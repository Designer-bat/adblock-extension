/**
 * Ultimate Ad Blocker v3.0 — Refactored Background Service Worker
 * Focus: Performance, Reliability, Maintainability
 */

// ─── Constants & Configuration ────────────────────────────────
const CONFIG = {
    DYNAMIC_RULE_START_ID: 100000,
    MAX_LOG_ENTRIES: 100,
    FLUSH_ALARM_NAME: 'flushStats',
    FLUSH_INTERVAL_MIN: 0.5, // 30 seconds (alarms are min 1 min in some contexts, but service worker can use smaller or we use 1 min for safety)
    WHITELIST_PRIORITY: 100,
    BLOCK_PRIORITY: 1
};

// ─── Logger (Ring Buffer) ─────────────────────────────────────
class Logger {
    constructor(maxEntries) {
        this.maxEntries = maxEntries;
        this.logs = [];
        this.isDirty = false;
    }

    async init() {
        const data = await chrome.storage.local.get('debugLog');
        this.logs = data.debugLog || [];
    }

    log(message) {
        const entry = `[${new Date().toISOString()}] ${message}`;
        this.logs.push(entry);
        if (this.logs.length > this.maxEntries) {
            this.logs = this.logs.slice(-this.maxEntries);
        }
        this.isDirty = true;
    }

    async flush() {
        if (!this.isDirty) return;
        await chrome.storage.local.set({ debugLog: this.logs });
        this.isDirty = false;
    }

    getLogs() {
        return this.logs;
    }

    async clear() {
        this.logs = [];
        await chrome.storage.local.set({ debugLog: [] });
    }
}

// ─── Storage Manager (Throttled Writes) ───────────────────────
class StorageManager {
    constructor() {
        this.buffer = {
            stats: {}, // totalBlocked, adsBlocked, phishingBlocked
            perSite: {},
            weekly: {}
        };
        this.isDirty = false;
    }

    async init() {
        // Migration logic: Move stats from sync to local if needed
        const syncData = await chrome.storage.sync.get(['totalBlocked', 'perSite', 'weekly']);
        if (syncData.totalBlocked !== undefined) {
            const localData = await chrome.storage.local.get(['totalBlocked', 'perSite', 'weekly']);
            
            // Merge if necessary, then clear from sync
            await chrome.storage.local.set({
                totalBlocked: (localData.totalBlocked || 0) + (syncData.totalBlocked || 0),
                perSite: { ...(localData.perSite || {}), ...(syncData.perSite || {}) },
                weekly: { ...(localData.weekly || {}), ...(syncData.weekly || {}) }
            });
            await chrome.storage.sync.remove(['totalBlocked', 'adsBlocked', 'phishingBlocked', 'perSite', 'weekly']);
        }
    }

    incrementStat(key, count = 1) {
        this.buffer.stats[key] = (this.buffer.stats[key] || 0) + count;
        this.isDirty = true;
    }

    incrementSiteStat(domain, count = 1) {
        this.buffer.perSite[domain] = (this.buffer.perSite[domain] || 0) + count;
        this.isDirty = true;
    }

    incrementWeeklyStat(weekKey, count = 1) {
        this.buffer.weekly[weekKey] = (this.buffer.weekly[weekKey] || 0) + count;
        this.isDirty = true;
    }

    async flush() {
        if (!this.isDirty) return;

        try {
            const local = await chrome.storage.local.get(['totalBlocked', 'adsBlocked', 'phishingBlocked', 'perSite', 'weekly']);
            
            // Update counts
            const update = {
                totalBlocked: (local.totalBlocked || 0) + (this.buffer.stats.totalBlocked || 0),
                adsBlocked: (local.adsBlocked || 0) + (this.buffer.stats.adsBlocked || 0),
                phishingBlocked: (local.phishingBlocked || 0) + (this.buffer.stats.phishingBlocked || 0),
                perSite: local.perSite || {},
                weekly: local.weekly || {}
            };

            // Merge per-site
            for (const [domain, count] of Object.entries(this.buffer.perSite)) {
                update.perSite[domain] = (update.perSite[domain] || 0) + count;
            }

            // Merge weekly
            for (const [week, count] of Object.entries(this.buffer.weekly)) {
                update.weekly[week] = (update.weekly[week] || 0) + count;
            }

            await chrome.storage.local.set(update);
            
            // Reset buffer
            this.buffer = { stats: {}, perSite: {}, weekly: {} };
            this.isDirty = false;
        } catch (error) {
            console.error('[StorageManager] Flush failed:', error);
        }
    }
}

// ─── Rule Manager (Incremental DNR) ───────────────────────────
class RuleManager {
    /**
     * Deterministic ID generation based on domain hash.
     * Uses a simple FNV-1a like hash to avoid collisions in small sets.
     */
    static getRuleId(domain, type = 'block') {
        let hash = type === 'block' ? 0 : 1;
        for (let i = 0; i < domain.length; i++) {
            hash = ((hash << 5) - hash) + domain.charCodeAt(i);
            hash |= 0;
        }
        return Math.abs(hash) % 100000 + CONFIG.DYNAMIC_RULE_START_ID;
    }

    static validateDomain(domain) {
        if (!domain || typeof domain !== 'string') return false;
        const clean = domain.trim().toLowerCase();
        // Basic regex for domain validation
        const domainRegex = /^[a-z0-9]+([\-\.]{1}[a-z0-9]+)*\.[a-z]{2,15}$/;
        return domainRegex.test(clean) ? clean : false;
    }

    static async updateRules(domains, type = 'block') {
        const existingRules = await chrome.declarativeNetRequest.getDynamicRules();
        const currentIds = new Set(existingRules.map(r => r.id));
        
        const newRules = [];
        const targetIds = new Set();

        for (const domain of domains) {
            const cleanDomain = this.validateDomain(domain);
            if (!cleanDomain) continue;

            const id = this.getRuleId(cleanDomain, type);
            targetIds.add(id);

            if (!currentIds.has(id)) {
                newRules.push({
                    id,
                    priority: type === 'block' ? CONFIG.BLOCK_PRIORITY : CONFIG.WHITELIST_PRIORITY,
                    action: { type: type === 'block' ? 'block' : 'allow' },
                    condition: {
                        urlFilter: `||${cleanDomain}^`,
                        resourceTypes: ['script', 'image', 'stylesheet', 'xmlhttprequest', 'sub_frame', 'media', 'other', 'main_frame']
                    }
                });
            }
        }

        // Identify rules to remove: those in the dynamic range that are no longer needed
        const removeRuleIds = existingRules
            .filter(r => r.id >= CONFIG.DYNAMIC_RULE_START_ID)
            .filter(r => !targetIds.has(r.id))
            .map(r => r.id);

        if (newRules.length > 0 || removeRuleIds.length > 0) {
            await chrome.declarativeNetRequest.updateDynamicRules({
                addRules: newRules,
                removeRuleIds
            });
        }
    }
}

const storageManager = new StorageManager();
const logger = new Logger(CONFIG.MAX_LOG_ENTRIES);

// Initialize logger immediately on start
logger.init();

/**
 * Robust URL parsing helper
 */
function getHostname(url) {
    try {
        if (!url || typeof url !== 'string') return 'unknown';
        const parsed = new URL(url);
        return parsed.hostname || 'unknown';
    } catch (e) {
        return 'unknown';
    }
}

function getWeekKey() {
    const now = new Date();
    const day = now.getDay();
    const diff = now.getDate() - day + (day === 0 ? -6 : 1);
    const mon = new Date(now.setDate(diff));
    return `${mon.getFullYear()}-${String(mon.getMonth() + 1).padStart(2, '0')}-${String(mon.getDate()).padStart(2, '0')}`;
}

async function syncAllRules() {
    const data = await chrome.storage.sync.get(['customFilters', 'whitelist']);
    await RuleManager.updateRules(data.customFilters || [], 'block');
    await RuleManager.updateRules(data.whitelist || [], 'whitelist');
}

// ─── Event Listeners ──────────────────────────────────────────

chrome.runtime.onInstalled.addListener(async () => {
    logger.log('Extension installed/updated');
    
    const existing = await chrome.storage.sync.get('initialized');
    if (!existing.initialized) {
        await chrome.storage.sync.set({
            enabled: true,
            whitelist: [],
            customFilters: [],
            debugMode: false,
            initialized: true
        });

        await chrome.storage.local.set({
            totalBlocked: 0,
            adsBlocked: 0,
            phishingBlocked: 0,
            perSite: {},
            weekly: {},
            reportedSites: [],
            debugLog: []
        });
    }

    await storageManager.init();
    await syncAllRules();
    
    // Setup alarms for periodic tasks
    chrome.alarms.create(CONFIG.FLUSH_ALARM_NAME, { periodInMinutes: CONFIG.FLUSH_INTERVAL_MIN });
});

chrome.alarms.onAlarm.addListener((alarm) => {
    if (alarm.name === CONFIG.FLUSH_ALARM_NAME) {
        storageManager.flush();
        logger.flush();
    }
});

chrome.runtime.onSuspend.addListener(() => {
    console.log('[AdBlocker] Suspending service worker. Flushing data...');
    storageManager.flush();
    logger.flush();
});

// Message handling
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    const { action } = request;

    if (action === 'blockAd' || action === 'blockPhishing') {
        const type = action === 'blockAd' ? 'ad' : 'phishing';
        const count = request.count || 1;
        const domain = getHostname(sender.url);
        
        storageManager.incrementStat('totalBlocked', count);
        storageManager.incrementStat(type === 'ad' ? 'adsBlocked' : 'phishingBlocked', count);
        storageManager.incrementSiteStat(domain, count);
        storageManager.incrementWeeklyStat(getWeekKey(), count);

        if (type === 'phishing') {
            logger.log(`Phishing blocked on ${domain}`);
        }
        sendResponse({ success: true });
        return false;
    }

    if (action === 'getStats') {
        (async () => {
            const syncData = await chrome.storage.sync.get(['enabled', 'whitelist', 'customFilters', 'debugMode']);
            const localData = await chrome.storage.local.get(['totalBlocked', 'adsBlocked', 'phishingBlocked', 'perSite', 'weekly', 'reportedSites']);
            const domain = getHostname(sender.url);
            
            sendResponse({
                ...syncData,
                ...localData,
                domain,
                siteCount: (localData.perSite || {})[domain] || 0,
                whitelisted: (syncData.whitelist || []).includes(domain)
            });
        })();
        return true;
    }

    if (action === 'addCustomFilter' || action === 'addToWhitelist') {
        const type = action === 'addCustomFilter' ? 'customFilters' : 'whitelist';
        const ruleType = action === 'addCustomFilter' ? 'block' : 'whitelist';
        
        (async () => {
            const cleanDomain = RuleManager.validateDomain(request.domain);
            if (!cleanDomain) {
                sendResponse({ success: false, error: 'Invalid domain' });
                return;
            }

            const data = await chrome.storage.sync.get(type);
            const list = data[type] || [];
            if (!list.includes(cleanDomain)) {
                list.push(cleanDomain);
                await chrome.storage.sync.set({ [type]: list });
                await RuleManager.updateRules(list, ruleType);
                logger.log(`${type} added: ${cleanDomain}`);
                if (type === 'whitelist') broadcastStateChange();
            }
            sendResponse({ success: true, [type]: list });
        })();
        return true;
    }

    if (action === 'removeCustomFilter' || action === 'removeFromWhitelist') {
        const type = action === 'removeCustomFilter' ? 'customFilters' : 'whitelist';
        const ruleType = action === 'removeCustomFilter' ? 'block' : 'whitelist';

        (async () => {
            const data = await chrome.storage.sync.get(type);
            const list = (data[type] || []).filter(d => d !== request.domain);
            await chrome.storage.sync.set({ [type]: list });
            await RuleManager.updateRules(list, ruleType);
            if (type === 'whitelist') broadcastStateChange();
            sendResponse({ success: true, [type]: list });
        })();
        return true;
    }

    if (action === 'reportSite') {
        (async () => {
            const data = await chrome.storage.local.get('reportedSites');
            const sites = data.reportedSites || [];
            sites.unshift({ domain: request.domain, timestamp: new Date().toISOString() });
            if (sites.length > 50) sites.length = 50;
            await chrome.storage.local.set({ reportedSites: sites });
            logger.log(`Site reported: ${request.domain}`);
            sendResponse({ success: true });
        })();
        return true;
    }

    if (action === 'getLogs') {
        sendResponse({ logs: logger.getLogs() });
        return false;
    }

    if (action === 'clearLogs') {
        logger.clear().then(() => sendResponse({ success: true }));
        return true;
    }

    if (action === 'getState') {
        (async () => {
            const data = await chrome.storage.sync.get(['enabled', 'whitelist', 'debugMode']);
            const domain = getHostname(sender.url);
            sendResponse({
                enabled: data.enabled !== false,
                whitelisted: (data.whitelist || []).includes(domain),
                debugMode: data.debugMode || false
            });
        })();
        return true;
    }

    return false;
});

async function broadcastStateChange() {
    const data = await chrome.storage.sync.get(['enabled', 'debugMode']);
    const tabs = await chrome.tabs.query({});
    for (const tab of tabs) {
        if (!tab.id || !tab.url || tab.url.startsWith('chrome://')) continue;
        try {
            chrome.tabs.sendMessage(tab.id, {
                action: 'stateChanged',
                enabled: data.enabled !== false,
                debugMode: data.debugMode || false
            });
        } catch (_) {}
    }
}

chrome.storage.onChanged.addListener((changes, area) => {
    if (area === 'sync' && (changes.enabled || changes.debugMode)) {
        broadcastStateChange();
    }
});