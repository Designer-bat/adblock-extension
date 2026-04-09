const btn = document.getElementById("toggle");
const resetBtn = document.getElementById("reset");
const whitelistBtn = document.getElementById("whitelist");

// Initialize UI on load
function initializeUI() {
    // Get stored data
    chrome.storage.sync.get(["enabled", "totalBlocked", "perSite", "weekly"], (data) => {
        if (chrome.runtime.lastError) {
            console.error("Storage error:", chrome.runtime.lastError);
            return;
        }

        // Update toggle button
        if (btn) {
            btn.textContent = data.enabled ? "Disable" : "Enable";
        }

        // Update total blocked count
        const totalEl = document.getElementById("total");
        if (totalEl) {
            animateCounter(totalEl, parseInt(totalEl.textContent) || 0, data.totalBlocked || 0);
        }

        // Get current site stats
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (chrome.runtime.lastError || !tabs[0]) {
                console.error("Tabs query error:", chrome.runtime.lastError);
                return;
            }

            try {
                const domain = new URL(tabs[0].url).hostname;
                const siteCount = data.perSite?.[domain] || 0;

                const siteEl = document.getElementById("site");
                if (siteEl) {
                    animateCounter(siteEl, parseInt(siteEl.textContent) || 0, siteCount);
                }
            } catch (e) {
                console.error("URL parsing error:", e);
            }
        });

        // Draw chart
        drawChart(data.weekly || {});
    });
}

// Animate counter from current to target
function animateCounter(element, current, target) {
    if (current === target) {
        element.textContent = target;
        return;
    }

    const duration = 600;
    const startTime = performance.now();
    const difference = target - current;

    function update(currentTime) {
        const elapsed = currentTime - startTime;
        const progress = Math.min(elapsed / duration, 1);

        const easeOut = 1 - Math.pow(1 - progress, 3);
        const newValue = Math.floor(current + difference * easeOut);

        element.textContent = newValue;

        if (progress < 1) {
            requestAnimationFrame(update);
        }
    }

    requestAnimationFrame(update);
}

// Toggle button handler
if (btn) {
    btn.addEventListener("click", () => {
        btn.disabled = true;

        chrome.storage.sync.get("enabled", (data) => {
            if (chrome.runtime.lastError) {
                console.error("Storage error:", chrome.runtime.lastError);
                btn.disabled = false;
                return;
            }

            const newState = !data.enabled;

            chrome.storage.sync.set({ enabled: newState }, () => {
                if (chrome.runtime.lastError) {
                    console.error("Storage error:", chrome.runtime.lastError);
                    btn.disabled = false;
                    return;
                }

                btn.textContent = newState ? "Disable" : "Enable";
                btn.disabled = false;
            });
        });
    });
}

// Reset button
if (resetBtn) {
    resetBtn.addEventListener("click", () => {
        if (confirm("Are you sure you want to reset all data?")) {
            resetBtn.disabled = true;

            chrome.storage.sync.set({
                totalBlocked: 0,
                perSite: {},
                weekly: {}
            }, () => {
                if (chrome.runtime.lastError) {
                    console.error("Storage error:", chrome.runtime.lastError);
                    resetBtn.disabled = false;
                    return;
                }

                resetBtn.disabled = false;
                initializeUI();
            });
        }
    });
}

// Whitelist current site
if (whitelistBtn) {
    whitelistBtn.addEventListener("click", () => {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (!tabs[0]) return;

            try {
                const domain = new URL(tabs[0].url).hostname;
                chrome.storage.sync.get("whitelist", (data) => {
                    const whitelist = data.whitelist || [];
                    if (!whitelist.includes(domain)) {
                        whitelist.push(domain);
                        chrome.storage.sync.set({ whitelist }, () => {
                            whitelistBtn.textContent = "✓ Whitelisted";
                            whitelistBtn.disabled = true;
                            setTimeout(() => {
                                whitelistBtn.textContent = "Whitelist This Site";
                                whitelistBtn.disabled = false;
                            }, 2000);
                        });
                    }
                });
            } catch (e) {
                console.error("URL parsing error:", e);
            }
        });
    });
}

// Premium chart rendering with gradients and smooth bars
function drawChart(data = {}) {
    const canvas = document.getElementById("chart");
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    // Set canvas resolution for crisp rendering
    const rect = canvas.getBoundingClientRect();
    canvas.width = rect.width * window.devicePixelRatio;
    canvas.height = rect.height * window.devicePixelRatio;
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);

    const values = Object.values(data).filter(v => typeof v === "number");

    // Clear canvas with gradient background
    const bgGradient = ctx.createLinearGradient(0, 0, 0, rect.height);
    bgGradient.addColorStop(0, "rgba(16, 185, 129, 0.05)");
    bgGradient.addColorStop(1, "rgba(16, 185, 129, 0)");
    ctx.fillStyle = bgGradient;
    ctx.fillRect(0, 0, rect.width, rect.height);

    if (values.length === 0) {
        ctx.fillStyle = "#64748b";
        ctx.font = "12px -apple-system, BlinkMacSystemFont, 'Segoe UI'";
        ctx.textAlign = "center";
        ctx.fillText("No data yet", rect.width / 2, rect.height / 2);
        return;
    }

    // Get last 7 days
    const last7 = values.slice(-7);
    const max = Math.max(...last7, 1);

    const barWidth = Math.floor((rect.width - 30) / 7);
    const gap = 6;
    const padding = 15;
    const chartHeight = rect.height - 40;

    // Draw bars with gradient
    last7.forEach((val, i) => {
        const barHeight = (val / max) * chartHeight;
        const x = padding + i * (barWidth + gap);
        const y = rect.height - 25 - barHeight;

        // Bar gradient
        const barGradient = ctx.createLinearGradient(0, y, 0, rect.height - 25);
        barGradient.addColorStop(0, "#10b981");
        barGradient.addColorStop(1, "#059669");

        ctx.fillStyle = barGradient;
        ctx.shadowColor = "rgba(16, 185, 129, 0.3)";
        ctx.shadowBlur = 8;
        ctx.shadowOffsetY = 2;

        // Round top corners
        ctx.beginPath();
        ctx.moveTo(x, y + 4);
        ctx.lineTo(x, y + barHeight - 4);
        ctx.quadraticCurveTo(x, y + barHeight, x + barWidth / 2, y + barHeight);
        ctx.quadraticCurveTo(x + barWidth, y + barHeight, x + barWidth, y + barHeight - 4);
        ctx.lineTo(x + barWidth, y + 4);
        ctx.quadraticCurveTo(x + barWidth, y, x + barWidth / 2, y);
        ctx.quadraticCurveTo(x, y, x, y + 4);
        ctx.fill();

        ctx.shadowColor = "transparent";

        // Value label
        if (val > 0) {
            ctx.fillStyle = "#f8fafc";
            ctx.font = "bold 10px -apple-system, BlinkMacSystemFont, 'Segoe UI'";
            ctx.textAlign = "center";
            ctx.fillText(val.toString(), x + barWidth / 2, y - 6);
        }
    });

    // Draw axis
    ctx.strokeStyle = "rgba(71, 85, 105, 0.5)";
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(padding, rect.height - 25);
    ctx.lineTo(rect.width - 5, rect.height - 25);
    ctx.stroke();

    ctx.strokeStyle = "rgba(71, 85, 105, 0.3)";
    ctx.beginPath();
    ctx.moveTo(padding, 10);
    ctx.lineTo(padding, rect.height - 25);
    ctx.stroke();
}

// Initialize on page load
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", initializeUI);
} else {
    initializeUI();
}

// Refresh every 5 seconds for real-time updates
setInterval(initializeUI, 5000);