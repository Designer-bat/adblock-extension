// ============================================================
// Ultimate Ad Blocker v2.0 — Background Service Worker
// Handles: dynamic DNR rules, counters, message routing,
//          whitelist enforcement, debug logging, popup blocking
// ============================================================

// ─── Constants ───────────────────────────────────────────────
const DYNAMIC_RULE_BASE_ID = 10000; // Dynamic rules start at this ID
const MAX_LOG_ENTRIES      = 100;   // Ring-buffer size for debug log
const WHITELIST_RULE_PRIO  = 100;   // Allow-rule priority (beats block pri=1)

// ─── Installation ─────────────────────────────────────────────
chrome.runtime.onInstalled.addListener(async () => {
    const existing = await chrome.storage.sync.get('initialized');
    if (!existing.initialized) {
        await chrome.storage.sync.set({
            enabled:         true,
            totalBlocked:    0,
            adsBlocked:      0,
            phishingBlocked: 0,
            perSite:         {},
            weekly:          {},
            whitelist:       [],
            customFilters:   [],
            debugMode:       false,
            reportedSites:   [],
            initialized:     true
        });
    }
    // Re-apply custom filters and whitelist DNR rules on update/install
    await syncCustomFilterRules();
    await syncWhitelistRules();
    console.log('[AdBlocker] Service worker initialized v2.0');
});

// ─── Message Router ──────────────────────────────────────────
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const action = request.action;

    if (action === 'blockAd') {
        handleBlockedItem(sender.url, 'ad', request.count || 1);
        sendResponse({ success: true });
        return false;
    }

    if (action === 'blockPhishing') {
        handleBlockedItem(sender.url, 'phishing', 1);
        sendResponse({ success: true });
        return false;
    }

    if (action === 'getState') {
        handleGetState(sender, sendResponse);
        return true; // async
    }

    if (action === 'getStats') {
        handleGetStats(sender, sendResponse);
        return true;
    }

    if (action === 'addCustomFilter') {
        handleAddCustomFilter(request.domain, sendResponse);
        return true;
    }

    if (action === 'removeCustomFilter') {
        handleRemoveCustomFilter(request.domain, sendResponse);
        return true;
    }

    if (action === 'addToWhitelist') {
        handleAddToWhitelist(request.domain, sendResponse);
        return true;
    }

    if (action === 'removeFromWhitelist') {
        handleRemoveFromWhitelist(request.domain, sendResponse);
        return true;
    }

    if (action === 'reportSite') {
        handleReportSite(request.domain, sendResponse);
        return true;
    }

    if (action === 'getLogs') {
        handleGetLogs(sendResponse);
        return true;
    }

    if (action === 'clearLogs') {
        chrome.storage.local.set({ debugLog: [] }, () => sendResponse({ success: true }));
        return true;
    }

    return false;
});

// ─── State Handlers ───────────────────────────────────────────

async function handleGetState(sender, sendResponse) {
    try {
        const data   = await chrome.storage.sync.get(['enabled', 'whitelist', 'debugMode']);
        const domain = getDomain(sender.url);
        sendResponse({
            enabled:     data.enabled !== false,
            whitelisted: (data.whitelist || []).includes(domain),
            debugMode:   data.debugMode || false
        });
    } catch (e) {
        sendResponse({ enabled: true, whitelisted: false, debugMode: false });
    }
}

async function handleGetStats(sender, sendResponse) {
    try {
        const data   = await chrome.storage.sync.get([
            'totalBlocked', 'adsBlocked', 'phishingBlocked', 'perSite', 'weekly',
            'whitelist', 'customFilters', 'enabled', 'debugMode', 'reportedSites'
        ]);
        const domain  = getDomain(sender.url);
        sendResponse({
            ...data,
            domain,
            siteCount:   (data.perSite || {})[domain] || 0,
            whitelisted: (data.whitelist || []).includes(domain)
        });
    } catch (e) {
        sendResponse({});
    }
}

// ─── Block Counter ────────────────────────────────────────────

async function handleBlockedItem(pageUrl, type, count = 1) {
    try {
        const data   = await chrome.storage.sync.get([
            'totalBlocked', 'adsBlocked', 'phishingBlocked', 'perSite', 'weekly'
        ]);
        const domain = getDomain(pageUrl);
        const week   = getWeekKey();

        const newTotal    = (data.totalBlocked    || 0) + count;
        const newAds      = (data.adsBlocked      || 0) + (type === 'ad'       ? count : 0);
        const newPhishing = (data.phishingBlocked || 0) + (type === 'phishing' ? count : 0);

        const perSite = data.perSite || {};
        perSite[domain] = (perSite[domain] || 0) + count;

        const weekly = data.weekly || {};
        weekly[week] = (weekly[week] || 0) + count;

        await chrome.storage.sync.set({
            totalBlocked:    newTotal,
            adsBlocked:      newAds,
            phishingBlocked: newPhishing,
            perSite,
            weekly
        });

        if (type === 'phishing') {
            appendLog(`[PHISHING BLOCKED] ${domain}`);
        }
    } catch (e) {
        // Silently ignore storage errors
    }
}

// ─── Custom Filters ───────────────────────────────────────────

async function handleAddCustomFilter(domain, sendResponse) {
    try {
        const data    = await chrome.storage.sync.get('customFilters');
        const filters = data.customFilters || [];
        if (!filters.includes(domain)) {
            filters.push(domain.trim().toLowerCase());
            await chrome.storage.sync.set({ customFilters: filters });
            await syncCustomFilterRules();
            appendLog(`[CUSTOM FILTER ADDED] ${domain}`);
        }
        sendResponse({ success: true, filters });
    } catch (e) {
        sendResponse({ success: false, error: e.message });
    }
}

async function handleRemoveCustomFilter(domain, sendResponse) {
    try {
        const data    = await chrome.storage.sync.get('customFilters');
        const filters = (data.customFilters || []).filter(d => d !== domain);
        await chrome.storage.sync.set({ customFilters: filters });
        await syncCustomFilterRules();
        sendResponse({ success: true, filters });
    } catch (e) {
        sendResponse({ success: false, error: e.message });
    }
}

/** Rebuilds all dynamic DNR block-rules from the stored customFilters list */
async function syncCustomFilterRules() {
    const data    = await chrome.storage.sync.get(['customFilters', 'whitelist']);
    const filters = data.customFilters || [];
    const wl      = data.whitelist     || [];

    // Remove all existing dynamic rules first (custom filter range: 10000-10999)
    const existing = await chrome.declarativeNetRequest.getDynamicRules();
    const toRemove = existing
        .filter(r => r.id >= DYNAMIC_RULE_BASE_ID && r.id < DYNAMIC_RULE_BASE_ID + 1000)
        .map(r => r.id);

    const toAdd = filters.map((domain, idx) => ({
        id:       DYNAMIC_RULE_BASE_ID + idx,
        priority: 1,
        action:   { type: 'block' },
        condition: {
            urlFilter:     `||${domain}^`,
            resourceTypes: ['script', 'image', 'stylesheet', 'xmlhttprequest', 'sub_frame', 'media', 'other']
        }
    }));

    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: toRemove,
        addRules:      toAdd
    });
}

// ─── Whitelist ────────────────────────────────────────────────

async function handleAddToWhitelist(domain, sendResponse) {
    try {
        const data = await chrome.storage.sync.get('whitelist');
        const wl   = data.whitelist || [];
        if (!wl.includes(domain)) {
            wl.push(domain);
            await chrome.storage.sync.set({ whitelist: wl });
            await syncWhitelistRules();
            broadcastStateChange();
            appendLog(`[WHITELISTED] ${domain}`);
        }
        sendResponse({ success: true, whitelist: wl });
    } catch (e) {
        sendResponse({ success: false });
    }
}

async function handleRemoveFromWhitelist(domain, sendResponse) {
    try {
        const data = await chrome.storage.sync.get('whitelist');
        const wl   = (data.whitelist || []).filter(d => d !== domain);
        await chrome.storage.sync.set({ whitelist: wl });
        await syncWhitelistRules();
        broadcastStateChange();
        sendResponse({ success: true, whitelist: wl });
    } catch (e) {
        sendResponse({ success: false });
    }
}

/**
 * Adds high-priority `allow` rules for every whitelisted domain
 * so block rules don't fire on those sites.
 * Whitelist rule ID range: 11000–11999
 */
async function syncWhitelistRules() {
    const data = await chrome.storage.sync.get('whitelist');
    const wl   = data.whitelist || [];

    const existing = await chrome.declarativeNetRequest.getDynamicRules();
    const toRemove = existing
        .filter(r => r.id >= 11000 && r.id < 12000)
        .map(r => r.id);

    const toAdd = wl.map((domain, idx) => ({
        id:       11000 + idx,
        priority: WHITELIST_RULE_PRIO,
        action:   { type: 'allow' },
        condition: {
            urlFilter:     `||${domain}^`,
            resourceTypes: ['script', 'image', 'stylesheet', 'xmlhttprequest', 'sub_frame', 'media', 'other', 'main_frame']
        }
    }));

    await chrome.declarativeNetRequest.updateDynamicRules({
        removeRuleIds: toRemove,
        addRules:      toAdd
    });
}

// ─── Report Site ──────────────────────────────────────────────

async function handleReportSite(domain, sendResponse) {
    try {
        const data  = await chrome.storage.local.get('reportedSites');
        const sites = data.reportedSites || [];
        const entry = {
            domain,
            timestamp: new Date().toISOString()
        };
        sites.unshift(entry);
        // Keep last 50 reports
        if (sites.length > 50) sites.length = 50;
        await chrome.storage.local.set({ reportedSites: sites });
        appendLog(`[REPORTED] ${domain}`);
        sendResponse({ success: true });
    } catch (e) {
        sendResponse({ success: false });
    }
}

// ─── Debug Logging ────────────────────────────────────────────

async function appendLog(message) {
    try {
        const data = await chrome.storage.local.get('debugLog');
        const log  = data.debugLog || [];
        log.unshift(`[${new Date().toISOString()}] ${message}`);
        if (log.length > MAX_LOG_ENTRIES) log.length = MAX_LOG_ENTRIES;
        await chrome.storage.local.set({ debugLog: log });
    } catch (_) {}
}

async function handleGetLogs(sendResponse) {
    const data = await chrome.storage.local.get('debugLog');
    sendResponse({ logs: data.debugLog || [] });
}

// ─── State Broadcasting ───────────────────────────────────────

async function broadcastStateChange() {
    const data = await chrome.storage.sync.get(['enabled', 'whitelist', 'debugMode']);
    const tabs  = await chrome.tabs.query({});
    for (const tab of tabs) {
        if (!tab.id || !tab.url || tab.url.startsWith('chrome://')) continue;
        try {
            await chrome.tabs.sendMessage(tab.id, {
                action:    'stateChanged',
                enabled:   data.enabled !== false,
                debugMode: data.debugMode || false
            });
        } catch (_) {
            // Tab may not have content script injected — safe to ignore
        }
    }
}

// Listen for storage changes from popup (e.g., toggle on/off, debug mode)
chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && (changes.enabled || changes.debugMode)) {
        broadcastStateChange();
    }
});

// ─── Helpers ─────────────────────────────────────────────────

function getDomain(url) {
    try { return new URL(url).hostname; }
    catch { return 'unknown'; }
}

function getWeekKey() {
    const now  = new Date();
    const day  = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const mon  = new Date(now.setDate(diff));
    return `${mon.getFullYear()}-${String(mon.getMonth() + 1).padStart(2, '0')}-${String(mon.getDate()).padStart(2, '0')}`;
}