
// ============================================================
// Ultimate Ad Blocker v2.0 — Popup Controller
// Responsive, Localized, Clean UI
// ============================================================
'use strict';

const masterToggle    = document.getElementById('masterToggle');
const debugToggle     = document.getElementById('debugToggle');
const themeToggleBtn  = document.getElementById('themeToggleBtn');
const langBtn         = document.getElementById('langBtn');
const langModal       = document.getElementById('langModal');
const siteDomainEl    = document.getElementById('siteDomain');
const statusPill      = document.getElementById('statusPill');
const statusDot       = document.getElementById('statusDot');
const statusText      = document.getElementById('statusText');
const totalBlockedEl  = document.getElementById('totalBlocked');
const phishingEl      = document.getElementById('phishingBlocked');
const siteBlockedEl   = document.getElementById('siteBlocked');
const chartTotalEl    = document.getElementById('chartTotal');
const filterInput     = document.getElementById('filterInput');
const filterList      = document.getElementById('filterList');
const whitelistList   = document.getElementById('whitelistList');
const logList         = document.getElementById('logList');

let currentDomain = '';
let isWhitelisted  = false;
let isEnabled      = true;
let isDarkMode     = false;

// ─── Tabs ──────────────────────────────────────────────────
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`panel-${target}`)?.classList.add('active');

        if (target === 'logs') loadLogs();
        if (target === 'whitelist') loadWhitelist();
        if (target === 'filters') loadFilters();
    });
});

// ─── Initialization ─────────────────────────────────────────
async function init() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    try { currentDomain = tabs[0]?.url ? new URL(tabs[0].url).hostname : '—'; } 
    catch (_) { currentDomain = '—'; }
    siteDomainEl.textContent = currentDomain;

    // Use getStats message to fetch aggregated data from sync and local
    const data = await chrome.runtime.sendMessage({ action: 'getStats' });
    // Also fetch settings that might not be in getStats
    const settings = await chrome.storage.sync.get(['darkMode', 'language']);

    isEnabled    = data.enabled !== false;
    isDarkMode   = settings.darkMode || false;
    isWhitelisted = (data.whitelist || []).includes(currentDomain);
    
    // Setup i18n
    if (settings.language) currentLang = settings.language;
    applyLanguage(currentLang);
    buildLangMenu();

    masterToggle.checked = isEnabled;
    debugToggle.checked = data.debugMode || false;
    
    applyTheme();
    updateStatusPill();
    updateWhitelistBtn();

    animateCounter(totalBlockedEl, data.totalBlocked || 0);
    animateCounter(phishingEl, data.phishingBlocked || 0);
    animateCounter(siteBlockedEl, (data.perSite || {})[currentDomain] || 0);

    drawChart(data.weekly || {});
}

// ─── Language Logic ─────────────────────────────────────────
function buildLangMenu() {
    langModal.innerHTML = '';
    Object.keys(translations).forEach(key => {
        const btn = document.createElement('button');
        btn.className = `lang-option ${key === currentLang ? 'active' : ''}`;
        btn.textContent = translations[key].langName;
        btn.addEventListener('click', async () => {
            currentLang = key;
            applyLanguage(currentLang);
            await chrome.storage.sync.set({ language: key });
            langModal.classList.remove('visible');
            buildLangMenu(); 
            updateStatusPill();
            updateWhitelistBtn();
            if(document.querySelector('.tab[data-tab="filters"].active')) loadFilters();
            if(document.querySelector('.tab[data-tab="whitelist"].active')) loadWhitelist();
            if(document.querySelector('.tab[data-tab="logs"].active')) loadLogs();
        });
        langModal.appendChild(btn);
    });
}

langBtn.addEventListener('click', (e) => {
    e.stopPropagation();
    langModal.classList.toggle('visible');
});
document.addEventListener('click', () => langModal.classList.remove('visible'));

// ─── Status Update ──────────────────────────────────────────
function updateStatusPill() {
    statusPill.className = 'status-badge';
    if (!isEnabled) {
        statusPill.classList.add('disabled');
        statusText.textContent = translations[currentLang].statusDisabled;
    } else if (isWhitelisted) {
        statusPill.classList.add('whitelisted');
        statusText.textContent = translations[currentLang].statusWhitelisted;
    } else {
        statusPill.classList.add('protected');
        statusText.textContent = translations[currentLang].statusProtected;
    }
}

function updateWhitelistBtn() {
    const btnSpan = document.querySelector('#btnWhitelist span');
    if(btnSpan) btnSpan.textContent = isWhitelisted ? translations[currentLang].unwhitelistBtn : translations[currentLang].whitelistBtn;
}

// ─── Event Listeners ────────────────────────────────────────
masterToggle.addEventListener('change', async () => {
    isEnabled = masterToggle.checked;
    await chrome.storage.sync.set({ enabled: isEnabled });
    updateStatusPill();
});

themeToggleBtn?.addEventListener('click', async () => {
    isDarkMode = !isDarkMode;
    applyTheme();
    await chrome.storage.sync.set({ darkMode: isDarkMode });
});

debugToggle.addEventListener('change', async () => {
    await chrome.storage.sync.set({ debugMode: debugToggle.checked });
});

document.getElementById('btnWhitelist').addEventListener('click', async () => {
    if (!currentDomain || currentDomain === '—') return;
    if (isWhitelisted) {
        await chrome.runtime.sendMessage({ action: 'removeFromWhitelist', domain: currentDomain });
        isWhitelisted = false;
        showToast(`${currentDomain} removed`);
    } else {
        await chrome.runtime.sendMessage({ action: 'addToWhitelist', domain: currentDomain });
        isWhitelisted = true;
        showToast(`${currentDomain} allowed`);
    }
    updateStatusPill();
    updateWhitelistBtn();
    loadWhitelist();
});

document.getElementById('btnReset').addEventListener('click', async () => {
    await chrome.storage.sync.set({ totalBlocked: 0, adsBlocked: 0, phishingBlocked: 0, perSite: {}, weekly: {} });
    animateCounter(totalBlockedEl, 0); animateCounter(phishingEl, 0); animateCounter(siteBlockedEl, 0);
    drawChart({});
    showToast('Stats reset');
});

document.getElementById('btnReport').addEventListener('click', async () => {
    if (!currentDomain || currentDomain === '—') return;
    await chrome.runtime.sendMessage({ action: 'reportSite', domain: currentDomain });
    showToast(`Reported! Thanks.`);
});

// ─── Filter Manager ─────────────────────────────────────────
document.getElementById('btnAddFilter').addEventListener('click', addFilter);
filterInput.addEventListener('keydown', e => { if(e.key==='Enter') addFilter() });

async function addFilter() {
    let domain = filterInput.value.trim().toLowerCase();
    if (!domain) return;
    try { domain = new URL(domain.includes('://') ? domain : `http://${domain}`).hostname; } catch (_) {}
    if (!domain) return;
    await chrome.runtime.sendMessage({ action: 'addCustomFilter', domain });
    filterInput.value = '';
    showToast(`${domain} added`);
    loadFilters();
}

async function loadFilters() {
    const data = await new Promise(r => chrome.storage.sync.get('customFilters', r));
    const filters = data.customFilters || [];
    if (!filters.length) {
        filterList.innerHTML = `<div class="empty-msg">${translations[currentLang].emptyFilters}</div>`;
        return;
    }
    filterList.innerHTML = filters.map(f => `
        <div class="list-item">
            <span class="list-domain">${escHtml(f)}</span>
            <button class="btn-del" data-domain="${escHtml(f)}"><svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
        </div>`).join('');
    filterList.querySelectorAll('.btn-del').forEach(b => b.addEventListener('click', async () => {
        await chrome.runtime.sendMessage({ action: 'removeCustomFilter', domain: b.dataset.domain });
        loadFilters();
    }));
}

// ─── Whitelist Manager ──────────────────────────────────────
async function loadWhitelist() {
    const data = await new Promise(r => chrome.storage.sync.get('whitelist', r));
    const wl = data.whitelist || [];
    if (!wl.length) {
        whitelistList.innerHTML = `<div class="empty-msg">${translations[currentLang].emptyWhitelist}</div>`;
        return;
    }
    whitelistList.innerHTML = wl.map(d => `
        <div class="list-item wl">
            <span class="list-domain">${escHtml(d)}</span>
            <button class="btn-del" data-domain="${escHtml(d)}"><svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg></button>
        </div>`).join('');
    whitelistList.querySelectorAll('.btn-del').forEach(b => b.addEventListener('click', async () => {
        const d = b.dataset.domain;
        await chrome.runtime.sendMessage({ action: 'removeFromWhitelist', domain: d });
        if (d === currentDomain) {
            isWhitelisted = false; updateStatusPill(); updateWhitelistBtn();
        }
        loadWhitelist();
    }));
}

// ─── Logs Manager ───────────────────────────────────────────
async function loadLogs() {
    const resp = await chrome.runtime.sendMessage({ action: 'getLogs' });
    const logs = resp?.logs || [];
    if (!logs.length) {
        logList.innerHTML = `<div class="empty-msg">${translations[currentLang].emptyLogs}</div>`;
        return;
    }
    logList.innerHTML = logs.map(entry => `
        <div class="list-item log ${entry.includes('[PHISHING')?'phishing':(entry.includes('Blocked:')?'ad':'')}">
            ${escHtml(entry)}
        </div>`).join('');
}
document.getElementById('btnClearLog').addEventListener('click', async () => {
    await chrome.runtime.sendMessage({ action: 'clearLogs' });
    loadLogs();
});

// ─── Charting & UI Utils ────────────────────────────────────
function applyTheme() {
    if (isDarkMode) {
        document.body.classList.add('dark');
        themeToggleBtn.innerHTML = '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="5"/><path d="M12 1v2M12 21v2M4.22 4.22l1.42 1.42M17.36 17.36l1.42 1.42M1 12h2M21 12h2M4.22 19.78l1.42-1.42M17.36 6.64l1.42-1.42"/></svg>';
    } else {
        document.body.classList.remove('dark');
        themeToggleBtn.innerHTML = '<svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>';
    }
    drawChart({}); // Trigger redraw with empty data, will be updated by interval
}

function drawChart(data = {}) {
    const canvas = document.getElementById('chart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    const dpr = window.devicePixelRatio || 1;
    const W = canvas.offsetWidth || 340;
    const H = 80;
    canvas.width = W * dpr; canvas.height = H * dpr;
    ctx.scale(dpr, dpr); ctx.clearRect(0,0,W,H);

    const values = Object.values(data).filter(v => typeof v ==='number').slice(-7);
    const sum = values.reduce((a,b)=>a+b,0);
    if(chartTotalEl) chartTotalEl.textContent = sum;

    if (!values.length) return;
    const max = Math.max(...values, 1);
    const padL = 4, gap = W / values.length, plotH = H - 16, barW = gap * 0.75;
    
    // Style
    const accent = isDarkMode ? 'rgba(96, 165, 250, 0.9)' : 'rgba(59, 130, 246, 0.9)';
    
    values.forEach((val, i) => {
        const bh = Math.max((val/max)*plotH, val>0?4:0);
        const x = padL + i*gap + (gap-barW)/2;
        const y = H - 4 - bh;
        ctx.fillStyle = accent;
        // Rounded bars
        ctx.beginPath();
        ctx.moveTo(x, y+4); ctx.arcTo(x, y, x+4, y, Math.min(4, bh/2));
        ctx.arcTo(x+barW, y, x+barW, y+4, Math.min(4, bh/2));
        ctx.lineTo(x+barW, y+bh); ctx.lineTo(x, y+bh);
        ctx.fill();
    });
}

function animateCounter(el, target) {
    if(!el) return;
    const s = parseInt(el.textContent) || 0;
    if(s===target){el.textContent=target;return;}
    const t0 = performance.now();
    const diff = target - s;
    function tick(now){
        const p = Math.min((now-t0)/500, 1);
        el.textContent = Math.round(s + diff * (1 - Math.pow(1-p,3)));
        if(p<1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}

let toastTimer;
function showToast(msg) {
    document.querySelector('.toast')?.remove();
    clearTimeout(toastTimer);
    const toast = document.createElement('div'); toast.className = 'toast'; toast.textContent = msg;
    document.body.appendChild(toast);
    toastTimer = setTimeout(()=>toast.remove(), 2000);
}

function escHtml(str) { return String(str).replace(/[&<>"']/g, m=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[m]); }

init();
setInterval(async () => {
    const active = document.querySelector('.tab.active')?.dataset.tab;
    if (active === 'shield') {
        const d = await chrome.runtime.sendMessage({ action: 'getStats' });
        animateCounter(totalBlockedEl, d.totalBlocked || 0);
        animateCounter(phishingEl, d.phishingBlocked || 0);
        animateCounter(siteBlockedEl, (d.perSite || {})[currentDomain] || 0);
        drawChart(d.weekly || {});
    }
    if (active === 'logs') loadLogs();
}, 2500);
