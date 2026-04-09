chrome.declarativeNetRequest.onRuleMatchedDebug.addListener((info) => {
    const domain = new URL(info.request.url).hostname;
    const today = new Date().toISOString().slice(0, 10);

    chrome.storage.sync.get(null, (data) => {
        let total = data.totalBlocked || 0;
        let perSite = data.perSite || {};
        let weekly = data.weekly || {};

        total++;
        perSite[domain] = (perSite[domain] || 0) + 1;
        weekly[today] = (weekly[today] || 0) + 1;

        chrome.storage.sync.set({
            totalBlocked: total,
            perSite,
            weekly
        });

        chrome.action.setBadgeText({ text: perSite[domain].toString() });
    });
});