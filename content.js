function isAdElement(el) {
    const text = el.innerText?.toLowerCase() || "";

    return (
        text.includes("sponsored") ||
        text.includes("advertisement") ||
        el.innerHTML.includes("ads") ||
        el.className.includes("promo")
    );
}

function removeSmartAds() {
    document.querySelectorAll("div, section, aside").forEach(el => {
        if (isAdElement(el)) {
            el.remove();
        }
    });
}

setInterval(removeSmartAds, 2000);