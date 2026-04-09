const btn = document.getElementById("toggle");

chrome.storage.local.get(["enabled", "adCount"], (data) => {
    btn.textContent = data.enabled ? "Disable" : "Enable";

    const countText = document.createElement("p");
    countText.textContent = `Blocked: ${data.adCount || 0}`;
    document.body.appendChild(countText);
});

btn.addEventListener("click", () => {
    chrome.storage.local.get("enabled", (data) => {
        const newState = !data.enabled;
        chrome.storage.local.set({ enabled: newState }, () => {
            btn.textContent = newState ? "Disable" : "Enable";
        });
    });
});
const resetBtn = document.createElement("button");
resetBtn.textContent = "Reset Count";

resetBtn.onclick = () => {
    chrome.storage.local.set({ adCount: 0 }, () => {
        chrome.action.setBadgeText({ text: "" });
        location.reload();
    });
};

document.body.appendChild(resetBtn);

function drawChart(data) {
    const canvas = document.getElementById("chart");
    const ctx = canvas.getContext("2d");

    const values = Object.values(data).slice(-7);
    const max = Math.max(...values, 10);

    const barWidth = 20;
    const gap = 10;

    ctx.clearRect(0, 0, canvas.width, canvas.height);

    values.forEach((val, i) => {
        const height = (val / max) * 100;

        ctx.fillRect(i * (barWidth + gap), 120 - height, barWidth, height);
    });
}

chrome.storage.sync.get(null, (data) => {
    document.getElementById("total").textContent =
        "Total Blocked: " + (data.totalBlocked || 0);

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        const domain = new URL(tabs[0].url).hostname;

        const siteCount = data.perSite?.[domain] || 0;

        document.getElementById("site").textContent =
            "This Site: " + siteCount;
    });

    drawChart(data.weekly || {});
});