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