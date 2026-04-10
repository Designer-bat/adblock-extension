// ============================================================
// Ultimate Ad Blocker v2.0 — YouTube-Specific Content Script
// Injected at document_start on *.youtube.com
// Features: auto-skip, mute-during-ad, DOM removal,
//           anti-adblock neutralization, MutationObserver
// ============================================================

(function () {
    'use strict';

    // ─── State ─────────────────────────────────────────────────
    let enabled      = true;
    let debugMode    = false;
    let skipInterval = null;
    let isWhitelisted = false;

    // ─── Init ──────────────────────────────────────────────────
    chrome.runtime.sendMessage({ action: 'getState' }, (resp) => {
        if (!resp) return;
        enabled      = resp.enabled;
        isWhitelisted = resp.whitelisted;
        debugMode    = resp.debugMode;
        if (enabled && !isWhitelisted) {
            init();
        }
    });

    chrome.runtime.onMessage.addListener((msg) => {
        if (msg.action === 'stateChanged') {
            enabled   = msg.enabled;
            debugMode = msg.debugMode;
            if (enabled && !isWhitelisted) {
                init();
            } else {
                stopSkipInterval();
            }
        }
    });

    function log(...args) {
        if (debugMode) console.log('[AdBlocker YT]', ...args);
    }

    // ─── Main Init ─────────────────────────────────────────────
    function init() {
        neutralizeAntiAdblock();
        removeYouTubeAds();
        startSkipInterval();
        observeYouTube();
        log('YouTube ad blocker initialized');
    }

    // ─── Selectors ─────────────────────────────────────────────
    const YT_AD_SELECTORS = [
        // Player ads
        '#player-ads',
        '#ad-container-root',
        '.ytp-ad-module',
        '.ytp-ad-overlay-container',
        '.ytp-ad-text-overlay',
        '.ytp-ad-image-overlay',
        '.ytp-ad-player-overlay',
        '.ytp-ad-player-overlay-instream-info',
        '.ytp-ad-message-container',
        '.ytp-ad-feedback-dialog-container',
        '.ytp-ad-action-interstitial',
        '.ytp-ce-element',         // merchandise/end cards
        '.ytp-endscreen-element',

        // Masthead / banner ads
        '#masthead-ad',
        'ytd-banner-promo-renderer',
        'tp-yt-paper-dialog',      // modal/survey ads

        // Feed / sidebar ads
        'ytd-display-ad-renderer',
        'ytd-promoted-video-renderer',
        'ytd-promoted-sparkles-web-renderer',
        'ytd-ad-slot-renderer',
        'ytd-in-feed-ad-layout-renderer',
        'ytd-promoted-sparkles-text-search-renderer',
        'ytd-search-pyv-renderer',
        'ytd-statement-banner-renderer',
        'ytd-compact-promoted-video-renderer',

        // Shorts ads
        'ytd-reel-shelf-renderer[is-ad]',
        '.ytd-reel-video-renderer[is-ad]',

        // Info cards / overlays
        '.ytp-iv-card-content',
        '#panels > ytd-engagement-panel-section-list-renderer[target-id="engagement-panel-ads"]',

        // Premium upsell
        'ytd-mealbar-promo-renderer',
        '#offer-module',
    ];

    // ─── DOM Ad Removal ────────────────────────────────────────
    function removeYouTubeAds() {
        let removed = 0;
        for (const sel of YT_AD_SELECTORS) {
            try {
                for (const el of document.querySelectorAll(sel)) {
                    if (el && el.parentNode) {
                        el.remove();
                        removed++;
                        log(`Removed element: ${sel}`);
                    }
                }
            } catch (_) {}
        }
        if (removed > 0) {
            notifyBlocked(removed);
        }
    }

    // ─── Skip & Mute ───────────────────────────────────────────
    function handleAdSkipAndMute() {
        // Skip buttons (multiple selectors for different YT versions)
        const skipSelectors = [
            '.ytp-skip-ad-button',
            '.ytp-ad-skip-button',
            '.ytp-ad-skip-button-modern',
            'button[class*="skip-button"]',
            '.videoAdUiSkipButton',
        ];
        for (const sel of skipSelectors) {
            const btn = document.querySelector(sel);
            if (btn && btn.offsetParent !== null) {
                btn.click();
                log('Skip button clicked');
                notifyBlocked(1);
            }
        }

        // Mute video during ads to avoid audio annoyance even if skip not ready
        const player    = document.querySelector('.html5-main-video');
        const adShowing = document.querySelector('.ad-showing');
        if (player && adShowing) {
            if (!player.muted) {
                player.muted   = true;
                player.volume  = 0;
                log('Video muted during ad');
                // Restore after ad ends
                waitForAdEnd(player);
            }
            // Fast-forward to end if ad duration is exposed
            if (player.duration && isFinite(player.duration) && player.duration > 0) {
                try {
                    player.currentTime = player.duration;
                    log('Fast-forwarded ad video');
                } catch (_) {}
            }
        } else if (player && player.muted && !adShowing) {
            // Ad is done — restore audio
            player.muted  = false;
            player.volume = 1;
            log('Audio restored after ad');
        }
    }

    function waitForAdEnd(player) {
        const check = setInterval(() => {
            if (!document.querySelector('.ad-showing')) {
                player.muted  = false;
                player.volume = 1;
                log('Ad ended — audio restored');
                clearInterval(check);
            }
        }, 500);
    }

    function startSkipInterval() {
        stopSkipInterval();
        skipInterval = setInterval(() => {
            if (enabled && !isWhitelisted) {
                handleAdSkipAndMute();
            }
        }, 300);
    }

    function stopSkipInterval() {
        if (skipInterval) {
            clearInterval(skipInterval);
            skipInterval = null;
        }
    }

    // ─── MutationObserver ──────────────────────────────────────
    let observerTimeout = null;
    function observeYouTube() {
        const observer = new MutationObserver((mutations) => {
            let relevant = false;
            for (const m of mutations) {
                if (m.addedNodes.length > 0) { relevant = true; break; }
            }
            if (!relevant) return;
            clearTimeout(observerTimeout);
            observerTimeout = setTimeout(() => {
                if (enabled && !isWhitelisted) removeYouTubeAds();
            }, 150);
        });

        const root = document.documentElement;
        observer.observe(root, { childList: true, subtree: true });
    }

    // ─── Anti-Adblock Neutralization ───────────────────────────
    function neutralizeAntiAdblock() {
        // Patch ytInitialPlayerResponse to strip ad-related metadata before YT reads it
        try {
            Object.defineProperty(window, 'ytInitialPlayerResponse', {
                get() { return this._ytIPR; },
                set(val) {
                    if (val && val.adBreakHeartbeatParams) {
                        delete val.adBreakHeartbeatParams;
                    }
                    if (val && val.adPlacements) {
                        val.adPlacements = [];
                    }
                    if (val && val.playerAds) {
                        val.playerAds = [];
                    }
                    this._ytIPR = val;
                },
                configurable: true
            });
        } catch (_) {}

        // Prevent YT from detecting extension via ad-element probe
        // YT checks for #ad-container-root to verify ads loaded; spoof it
        const origGetElementById = document.getElementById.bind(document);
        document.getElementById = function (id) {
            if (id === 'ad-container-root' || id === 'player-ads') {
                // Return a hidden dummy element so detection thinks ads are present
                const dummy = document.createElement('div');
                dummy.style.cssText = 'display:none!important;width:1px;height:1px;';
                return dummy;
            }
            return origGetElementById(id);
        };

        log('Anti-adblock neutralization applied');
    }

    // ─── Notification Helper ───────────────────────────────────
    function notifyBlocked(count) {
        for (let i = 0; i < count; i++) {
            chrome.runtime.sendMessage({ action: 'blockAd' });
        }
    }

})();
