// ============================================================
// Ultimate Ad Blocker v2.0 — Main Content Script
// Injected on all URLs at document_idle
// Features: DOM ad removal, phishing detection, window.open
//           override, anti-adblock bypass, notification block,
//           MutationObserver, debug logging
// ============================================================

(function () {
    'use strict';

    // ─── State ─────────────────────────────────────────────────
    let isEnabled      = true;
    let isWhitelisted  = false;
    let debugMode      = false;
    let popupBlockerInjected       = false;
    let notificationBlockerInjected = false;

    // ─── Bootstrap ─────────────────────────────────────────────
    chrome.runtime.sendMessage({ action: 'getState' }, (resp) => {
        if (!resp) return;
        isEnabled     = resp.enabled;
        isWhitelisted = resp.whitelisted;
        debugMode     = resp.debugMode;

        if (isEnabled && !isWhitelisted) {
            runAll();
        }
    });

    chrome.runtime.onMessage.addListener((msg) => {
        if (msg.action === 'stateChanged') {
            isEnabled = msg.enabled;
            debugMode = msg.debugMode;
            if (isEnabled && !isWhitelisted) {
                runAll();
            }
        }
    });

    function log(...args) {
        if (debugMode) console.log('[AdBlocker]', ...args);
    }

    function runAll() {
        injectPopupBlocker();
        injectNotificationBlocker();
        blockAds();
        detectPhishing();
        neutralizeAntiAdblock();
        observeAdChanges();
    }

    // ─── Ad Selectors (80+) ────────────────────────────────────
    const AD_SELECTORS = [
        // Google / AdSense
        '[data-ad-slot]',
        '[data-ad-format]',
        '[data-ad-channel]',
        'ins[data-adsbygoogle]',
        '.adsbygoogle',
        '.goog-inline-block',
        '[id^="google_ads"]',
        '[class^="google_ads"]',
        'iframe[src*="googlesyndication"]',
        'iframe[src*="doubleclick"]',
        'iframe[src*="pagead"]',
        'iframe[src*="adservice"]',

        // Generic ad containers
        '.ad', '.ads', '.ad-unit',
        '.ad-container', '.ad-wrapper', '.ad-holder',
        '.ad-banner', '.ad-bar', '.ad-box',
        '.ad-block', '.ad-slot', '.ad-frame',
        '.ad-zone', '.ad-area', '.ad-section',
        '.ad-placement', '.ad-widget',
        '.advertisement', '.advertisement-banner',
        '.advertise', '.advertorial',
        '.sidebar-ad', '.sidebar-ads', '.sidebar-advertisement',
        '.header-ad', '.footer-ad', '.top-ad',
        '.leaderboard-ad', '.rectangle-ad', '.skyscraper-ad',
        '.banner-ad', '.inline-ad', '.in-content-ad',
        '.native-ad', '.native-advertisement',
        '.promoted-content', '.sponsored-content',
        '.sponsored-post', '.sponsored-article',
        '.text-ad', '.text-ads', '.text-advertisement',
        '[class*="AdUnit"]', '[class*="AdBanner"]',
        '[class*="Advertisement"]', '[id*="advertisement"]',
        '[id*="AdContainer"]', '[id*="AdWrapper"]',
        '[id*="banner_ad"]', '[id*="ad_unit"]',

        // Video / multimedia ads
        '.video-ad', '.video-advertisement',
        '[data-video-ad]', '.preroll-ad',
        '.midroll-ad', '.postroll-ad',
        '.mobile-ad', '.mobile-banner',

        // Popups / overlays
        '.ad-overlay', '.modal-ad', '.popup-ad',
        '.interstitial-ad', '.lightbox-ad',
        '.sticky-ad', '.floating-ad', '.slide-in-ad',
        '[class*="PopupAd"]', '[class*="popover-ad"]',

        // Taboola / Outbrain / Mgid
        '[id^="taboola"]', '[class^="taboola"]',
        '[id^="outbrain"]', '[class^="outbrain"]',
        '[id^="mgid"]',    '[class^="mgid"]',
        '#taboola-below-article-thumbnails',
        '.outbrain-widget',

        // Media.net
        '[id^="mediabaner"]', '[class^="mediabaner"]',
        '#mn_recom', '#mn_recs', '.content_below_article_mn',

        // Criteo
        '[id^="criteo"]', '[class^="criteo"]',
        '.criteo-banner', '#criteo_container',

        // IFrame catch-alls
        'iframe[src*="ads"]',
        'iframe[src*="advertisement"]',
        'iframe[id*="ad"]',
        'iframe[class*="ad"]',
        'iframe[src*="advertising"]',
        'iframe[src*="pop"]',
    ];

    // URL patterns that indicate an element carries ads
    const AD_URL_PATTERNS = [
        /doubleclick\.net/i,
        /googlesyndication/i,
        /pagead2?\.googlesyndication/i,
        /adservice\./i,
        /ads\.google/i,
        /googleadservices/i,
        /advertising\.com/i,
        /criteo\.com/i,
        /taboola\.com/i,
        /outbrain\.com/i,
        /popads\.net/i,
        /popcash\.net/i,
        /propellerads\.com/i,
        /adsterra\.com/i,
        /exoclick\.com/i,
        /trafficjunky\.com/i,
    ];

    // ─── DOM Ad Removal ────────────────────────────────────────
    let blockedAdBuffer = 0;
    let adFlushTimer    = null;

    function blockAds() {
        removeBySelectors();
        removeAdIframes();
    }

    function removeBySelectors() {
        for (const sel of AD_SELECTORS) {
            try {
                const els = document.querySelectorAll(sel);
                for (const el of els) {
                    if (!isAdElement(el)) continue;
                    collapseElement(el);
                    bufferAdCount();
                    log(`Removed ad: ${sel}`);
                }
            } catch (_) {}
        }
    }

    function removeAdIframes() {
        for (const iframe of document.querySelectorAll('iframe')) {
            const src = iframe.src || iframe.getAttribute('data-src') || '';
            if (AD_URL_PATTERNS.some(p => p.test(src))) {
                collapseElement(iframe);
                bufferAdCount();
                log(`Removed ad iframe: ${src.substring(0, 80)}`);
            }
        }
    }

    /** Safely determines if an element is an ad and not already hidden */
    function isAdElement(el) {
        if (!el || !el.parentNode) return false;
        if (el.offsetHeight === 0 && el.offsetWidth === 0) return false;
        if (window.getComputedStyle(el).display === 'none') return false;
        return true;
    }

    /** Remove element cleanly without breaking page layout */
    function collapseElement(el) {
        try {
            el.style.setProperty('display', 'none', 'important');
            el.style.setProperty('visibility', 'hidden', 'important');
            el.style.setProperty('height', '0', 'important');
            el.style.setProperty('max-height', '0', 'important');
            el.style.setProperty('overflow', 'hidden', 'important');
            el.style.setProperty('margin', '0', 'important');
            el.style.setProperty('padding', '0', 'important');
            el.style.setProperty('border', 'none', 'important');
            el.setAttribute('data-blocked-by-uab', '1');
        } catch (_) {}
    }

    /** Batch counter — notifies background every 5 ad-blocks or after 2s */
    function bufferAdCount() {
        blockedAdBuffer++;
        clearTimeout(adFlushTimer);
        if (blockedAdBuffer >= 5) {
            flushAdCount();
        } else {
            adFlushTimer = setTimeout(flushAdCount, 2000);
        }
    }

    function flushAdCount() {
        if (blockedAdBuffer > 0) {
            const count = blockedAdBuffer;
            blockedAdBuffer = 0;
            chrome.runtime.sendMessage({ action: 'blockAd', count });
        }
    }

    // ─── Phishing / Scam Detection ─────────────────────────────
    const PHISHING_KEYWORDS = [
        'virus detected', 'your computer', 'your system', 'your device',
        'is infected', 'has been hacked', 'has been compromised',
        'urgent action', 'immediate action', 'act now', 'act immediately',
        'click to fix', 'click to clean', 'call now', 'call immediately',
        'tech support', 'customer support alert', 'microsoft support',
        'apple support', 'google security',
        'congratulations you won', 'you have been selected',
        'free gift', 'claim your prize', 'you are the winner',
        'your account will be', 'verify your account',
        'suspicious activity', 'unauthorized access',
        'warning!', 'danger!', 'security alert',
        'download now to remove', 'scan your device',
    ];

    let phishingCheckTimeout = null;

    function detectPhishing() {
        checkForPhishingOverlays();
    }

    function checkForPhishingOverlays() {
        // Check elements that are fixed/absolute positioned with high z-index
        const candidates = document.querySelectorAll(
            'div[style*="z-index"], section[style*="z-index"], ' +
            'div[class*="modal"], div[class*="overlay"], div[class*="popup"], ' +
            'div[class*="alert"], div[class*="warning"], div[class*="notice"]'
        );

        for (const el of candidates) {
            if (isPhishingElement(el)) {
                log('PHISHING OVERLAY DETECTED, removing:', el.className || el.id);
                el.remove();
                chrome.runtime.sendMessage({ action: 'blockPhishing' });
            }
        }
    }

    function isPhishingElement(el) {
        try {
            const style    = window.getComputedStyle(el);
            const position = style.position;
            const zIndex   = parseInt(style.zIndex, 10);
            const display  = style.display;

            if (display === 'none') return false;

            // Must be positioned overlay with very high z-index
            const isOverlay = (position === 'fixed' || position === 'absolute')
                           && !isNaN(zIndex)
                           && zIndex > 9000;

            if (!isOverlay) return false;

            // Check for large coverage (phishing overlays are usually full-screen)
            const rect = el.getBoundingClientRect();
            const vw   = window.innerWidth;
            const vh   = window.innerHeight;
            const isBig = rect.width > vw * 0.5 && rect.height > vh * 0.3;

            if (!isBig) return false;

            // Match against phishing keywords in text content
            const text = (el.textContent || '').toLowerCase();
            return PHISHING_KEYWORDS.some(kw => text.includes(kw));
        } catch (_) {
            return false;
        }
    }

    // ─── window.open() Blocker ────────────────────────────────
    /**
     * We inject a tiny <script> tag in the page context (NOT the extension context)
     * so the override runs before any page JS — this is the only safe way to
     * intercept window.open in a content script.
     */
    function injectPopupBlocker() {
        if (popupBlockerInjected) return;
        popupBlockerInjected = true;
        try {
            const s   = document.createElement('script');
            s.textContent = `
(function(){
    if (window.__uab_popup_blocked) return;
    window.__uab_popup_blocked = true;
    // Block unrequested popup windows
    const _open = window.open.bind(window);
    window.open = function(url, target, features) {
        // Allow popups triggered by direct user gesture (feature detection: call stack depth)
        const stack = new Error().stack || '';
        const isUser = stack.split('\\n').length < 5;
        if (isUser) return _open(url, target, features);
        console.log('[AdBlocker] Blocked popup:', url);
        return null;
    };
    // Block window.print spam
    const _print = window.print.bind(window);
    window.print = function() {
        const stack = new Error().stack || '';
        if (stack.split('\\n').length < 4) return _print();
    };
})();`;
            s.setAttribute('data-uab', '1');
            (document.head || document.documentElement).prepend(s);
            s.remove();
        } catch (_) {}
    }

    // ─── Notification Permission Blocker ──────────────────────
    function injectNotificationBlocker() {
        if (notificationBlockerInjected) return;
        notificationBlockerInjected = true;
        try {
            const s   = document.createElement('script');
            s.textContent = `
(function(){
    if (window.__uab_notif_blocked) return;
    window.__uab_notif_blocked = true;
    // Intercept permission requests for notifications/geolocation from spam sites
    const _req = Notification.requestPermission.bind(Notification);
    Notification.requestPermission = function(callback) {
        const p = Promise.resolve('denied');
        if (callback) { callback('denied'); }
        return p;
    };
})();`;
            s.setAttribute('data-uab', '1');
            (document.head || document.documentElement).prepend(s);
            s.remove();
        } catch (_) {}
    }

    // ─── Anti-Adblock Neutralization ──────────────────────────
    function neutralizeAntiAdblock() {
        try {
            // Remove scripts known to be adblock detectors
            const scripts = document.querySelectorAll('script[src]');
            for (const script of scripts) {
                const src = script.src || '';
                if (/adblock.*detect|detect.*adblock|fuckadblock|pagefair|admiral\.com/i.test(src)) {
                    script.remove();
                    log(`Removed anti-adblock script: ${src.substring(0, 80)}`);
                }
            }

            // Spoof the presence of common "ad-zone" test elements that detectors probe
            const spoofIds = ['ad', 'ads', 'adsbox', 'ad-banner', 'ad-unit', 'DoubleClickDetector'];
            for (const id of spoofIds) {
                if (!document.getElementById(id)) {
                    const dummy   = document.createElement('div');
                    dummy.id      = id;
                    dummy.className = 'ad ads adsbygoogle';
                    dummy.style.cssText = 'width:1px;height:1px;position:absolute;left:-9999px;top:-9999px;';
                    document.body?.appendChild(dummy);
                }
            }
        } catch (_) {}
    }

    // ─── MutationObserver ──────────────────────────────────────
    function observeAdChanges() {
        if (!document.body) return;

        let mutationTimer = null;
        const observer   = new MutationObserver((mutations) => {
            let needsCheck = false;
            for (const m of mutations) {
                if (m.addedNodes.length > 0 ||
                    (m.type === 'attributes' && ['src', 'data-src', 'style'].includes(m.attributeName))) {
                    needsCheck = true;
                    break;
                }
            }
            if (!needsCheck || !isEnabled || isWhitelisted) return;
            clearTimeout(mutationTimer);
            mutationTimer = setTimeout(() => {
                blockAds();
                detectPhishing();
            }, 150);
        });

        observer.observe(document.body, {
            childList:      true,
            subtree:        true,
            attributes:     true,
            attributeFilter: ['src', 'data-src', 'style', 'class'],
        });
        log('MutationObserver started');
    }

    // ─── Post-load safety runs ─────────────────────────────────
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', () => {
            if (isEnabled && !isWhitelisted) blockAds();
        });
    }
    // Also run after a short delay — catches late-injected ads
    setTimeout(() => {
        if (isEnabled && !isWhitelisted) {
            blockAds();
            detectPhishing();
        }
    }, 800);
    setTimeout(() => {
        if (isEnabled && !isWhitelisted) blockAds();
    }, 2500);

})();