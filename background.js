// Initialize storage on install
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.sync.get("initialized", (data) => {
        if (!data.initialized) {
            chrome.storage.sync.set({
                enabled: true,
                totalBlocked: 0,
                perSite: {},
                weekly: {},
                whitelist: [],
                initialized: true
            });
        }
    });
});

// Listen for messages from content script
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "blockAd") {
        handleBlockedAd(sender.url);
        sendResponse({ success: true });
    }

    if (request.action === "getState") {
        chrome.storage.sync.get(["enabled", "whitelist"], (data) => {
            const domain = getDomain(sender.url);
            const isWhitelisted = data.whitelist?.includes(domain);

            sendResponse({
                enabled: data.enabled !== false,
                whitelisted: isWhitelisted
            });
        });
        return true; // Keep channel open for async response
    }
});

// Handle blocked ads - update counters
function handleBlockedAd(pageUrl) {
    chrome.storage.sync.get(["totalBlocked", "perSite", "weekly"], (data) => {
        const domain = getDomain(pageUrl);
        const today = getWeekKey();

        // Update total
        const newTotal = (data.totalBlocked || 0) + 1;

        // Update per-site
        const perSite = data.perSite || {};
        perSite[domain] = (perSite[domain] || 0) + 1;

        // Update weekly
        const weekly = data.weekly || {};
        weekly[today] = (weekly[today] || 0) + 1;

        chrome.storage.sync.set({
            totalBlocked: newTotal,
            perSite: perSite,
            weekly: weekly
        });
    });
}

// Extract domain from URL
function getDomain(url) {
    try {
        return new URL(url).hostname;
    } catch {
        return "unknown";
    }
}

// Get week key for tracking (Monday = 0)
function getWeekKey() {
    const now = new Date();
    const dayOfWeek = now.getDay();
    const diff = now.getDate() - dayOfWeek + (dayOfWeek === 0 ? -6 : 1);
    const monday = new Date(now.setDate(diff));

    const year = monday.getFullYear();
    const month = String(monday.getMonth() + 1).padStart(2, "0");
    const date = String(monday.getDate()).padStart(2, "0");

    return `${year}-${month}-${date}`;
}

// Optional: Handle storage changes from popup
chrome.storage.onChanged.addListener((changes, areaName) => {
    if (areaName === "sync" && changes.enabled) {
        // Broadcast state change to content scripts
        chrome.tabs.query({}, (tabs) => {
            tabs.forEach(tab => {
                chrome.tabs.sendMessage(tab.id, {
                    action: "stateChanged",
                    enabled: changes.enabled.newValue
                }).catch(() => {
                    // Tab may not have content script, ignore
                });
            });
        });
    }
});