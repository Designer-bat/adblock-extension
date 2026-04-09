// Check if extension is enabled for this site
let isEnabled = true;
let isWhitelisted = false;

// Get initial state
chrome.runtime.sendMessage(
    { action: "getState" },
    (response) => {
        isEnabled = response.enabled;
        isWhitelisted = response.whitelisted;

        if (isEnabled && !isWhitelisted) {
            blockAds();
            observeAdChanges();
        }
    }
);

// Listen for state changes from background
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === "stateChanged") {
        isEnabled = request.enabled;

        if (isEnabled && !isWhitelisted) {
            blockAds();
        }
    }
});

// Common ad selectors to block
const AD_SELECTORS = [
    // Google Ads
    "[data-ad-slot]",
    "[data-ad-format]",
    ".goog-inline-block",
    "ins[data-adsbygoogle]",
    ".adsbygoogle",

    // Common ad classes
    ".ad-container",
    ".advertisement",
    ".ad-unit",
    ".ad-banner",
    ".ad-box",
    ".ads",
    ".advertisement-banner",
    ".sidebar-ad",
    ".ad-spot",
    ".text-ad",

    // IFrames for ads
    "iframe[src*='ads']",
    "iframe[src*='advertisement']",
    "iframe[src*='doubleclick']",
    "iframe[src*='pagead']",
    "iframe[id*='ad']",
    "iframe[class*='ad']",

    // Video ads
    ".video-ad",
    ".video-advertisement",
    "[data-video-ad]",

    // Specific networks
    "[src*='googlesyndication']",
    "[src*='adservice']",
    "[src*='pagead2']",
    "[src*='advertising']",

    // Mobile ads
    ".mobile-ad",
    ".mobile-banner",

    // Popups and overlays
    ".ad-overlay",
    ".modal-ad",
    ".popup-ad",
];

// Additional blocklist for URLs
const AD_PATTERNS = [
    /doubleclick\.net/i,
    /googlesyndication/i,
    /pagead2\.googlesyndication/i,
    /adservice\./i,
    /ads\.google/i,
    /advertising\.google/i,
    /pagead\./i,
    /adx\.g\.doubleclick\.net/i,
    /googleadservices/i,
];

// Block ads on page
function blockAds() {
    // Remove existing ads
    AD_SELECTORS.forEach((selector) => {
        try {
            const elements = document.querySelectorAll(selector);
            elements.forEach((el) => {
                if (shouldBlock(el)) {
                    hideElement(el);
                    notifyBlockedAd();
                }
            });
        } catch (e) {
            // Invalid selector, skip
        }
    });

    // Block iframes with ad URLs
    blockAdIframes();
}

// Hide element and reclaim space
function hideElement(el) {
    el.style.display = "none !important";
    el.style.visibility = "hidden !important";
    el.style.height = "0 !important";
    el.style.margin = "0 !important";
    el.style.padding = "0 !important";

    // Remove from flow
    if (el.parentNode) {
        el.parentNode.style.height = "auto";
    }
}

// Check if element should be blocked
function shouldBlock(el) {
    // Don't block if already hidden
    if (el.style.display === "none" || el.offsetHeight === 0) {
        return false;
    }

    // Check data attributes
    if (el.hasAttribute("data-ad-slot") || el.hasAttribute("data-ad-format")) {
        return true;
    }

    // Check src/data attributes
    const src = el.getAttribute("src") || el.getAttribute("data-src") || "";
    if (AD_PATTERNS.some((pattern) => pattern.test(src))) {
        return true;
    }

    return true; // Block by default if it matches selector
}

// Block ad iframes specifically
function blockAdIframes() {
    const iframes = document.querySelectorAll("iframe");

    iframes.forEach((iframe) => {
        try {
            // Check src
            const src = iframe.src || "";

            if (AD_PATTERNS.some((pattern) => pattern.test(src))) {
                hideElement(iframe);
                notifyBlockedAd();
                return;
            }

            // Try to access iframe content (same-origin only)
            try {
                const content = iframe.contentDocument?.body?.innerHTML || "";
                if (AD_PATTERNS.some((pattern) => pattern.test(content))) {
                    hideElement(iframe);
                    notifyBlockedAd();
                }
            } catch (e) {
                // Cross-origin iframe, skip content check
            }
        } catch (e) {
            // Skip on error
        }
    });
}

// Observe DOM for new ads added dynamically
function observeAdChanges() {
    const observer = new MutationObserver((mutations) => {
        let shouldCheck = false;

        for (const mutation of mutations) {
            if (mutation.type === "childList" && mutation.addedNodes.length > 0) {
                shouldCheck = true;
                break;
            }

            if (
                mutation.type === "attributes" &&
                (mutation.attributeName === "src" ||
                    mutation.attributeName === "data-src" ||
                    mutation.attributeName === "style")
            ) {
                shouldCheck = true;
                break;
            }
        }

        if (shouldCheck) {
            // Debounce: wait 100ms before checking
            clearTimeout(observer.timeout);
            observer.timeout = setTimeout(() => {
                blockAds();
            }, 100);
        }
    });

    observer.observe(document.body, {
        childList: true,
        subtree: true,
        attributes: true,
        attributeFilter: ["src", "data-src", "style"],
        attributeOldValue: false,
    });
}

// Notify background script of blocked ad
let blockedCount = 0;
function notifyBlockedAd() {
    blockedCount++;

    // Batch notifications - send every 5 ads or after 2 seconds
    clearTimeout(notifyBlockedAd.timeout);

    if (blockedCount >= 5) {
        chrome.runtime.sendMessage({ action: "blockAd" });
        blockedCount = 0;
    } else {
        notifyBlockedAd.timeout = setTimeout(() => {
            if (blockedCount > 0) {
                chrome.runtime.sendMessage({ action: "blockAd" });
                blockedCount = 0;
            }
        }, 2000);
    }
}

// Block ads on page load completion
if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", () => {
        if (isEnabled && !isWhitelisted) {
            blockAds();
        }
    });
} else {
    // Already loaded
    if (isEnabled && !isWhitelisted) {
        blockAds();
    }
}

// Also check after a short delay (for dynamic content)
setTimeout(() => {
    if (isEnabled && !isWhitelisted) {
        blockAds();
    }
}, 500);