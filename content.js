const removeAds = () => {
    document.querySelectorAll(`
        iframe[src*="ads"],
        iframe[src*="doubleclick"],
        [id*="ad"],
        [class*="ad"],
        [class*="banner"],
        [class*="sponsor"]
    `).forEach(el => el.remove());

    // popup remover (safe)
    document.querySelectorAll(`
        [role="dialog"],
        [class*="popup"],
        [class*="modal"]
    `).forEach(el => el.remove());
};

const observer = new MutationObserver(removeAds);

observer.observe(document.documentElement, {
    childList: true,
    subtree: true
});