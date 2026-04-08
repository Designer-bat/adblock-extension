let adCount = 0;

// Initialize badge
chrome.runtime.onInstalled.addListener(() => {
    chrome.storage.local.set({ adCount: 0 });
    updateBadge(0);
});

// Listen for blocked requests
chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((info) => {
    adCount++;

    chrome.storage.local.set({ adCount });

    updateBadge(adCount);
});

// Update badge UI
function updateBadge(count) {
    chrome.action.setBadgeText({
        text: count > 0 ? count.toString() : ""
    });

    chrome.action.setBadgeBackgroundColor({
        color: "#FF0000"
    });
}