// ============================================================
// Ultimate Ad Blocker v2.0 — Popup Controller
// Handles: tab switching, stats display, chart, toggles,
//          whitelist mgmt, custom filters, debug logs
// ============================================================

'use strict';

// ─── DOM Refs ──────────────────────────────────────────────
const masterToggle    = document.getElementById('masterToggle');
const toggleLabel     = document.getElementById('toggleLabel');
const debugToggle     = document.getElementById('debugToggle');
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

// ─── Tab Navigation ────────────────────────────────────────
document.querySelectorAll('.tab').forEach(tab => {
    tab.addEventListener('click', () => {
        const target = tab.dataset.tab;
        document.querySelectorAll('.tab').forEach(t => t.classList.remove('active'));
        document.querySelectorAll('.panel').forEach(p => p.classList.remove('active'));
        tab.classList.add('active');
        document.getElementById(`panel-${target}`)?.classList.add('active');

        // Load data for the newly visible tab
        if (target === 'logs') loadLogs();
        if (target === 'whitelist') loadWhitelist();
        if (target === 'filters') loadFilters();
    });
});

// ─── State ─────────────────────────────────────────────────
let currentDomain = '';
let isWhitelisted  = false;
let isEnabled      = true;

// ─── Init ──────────────────────────────────────────────────
async function init() {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const tab  = tabs[0];

    try {
        currentDomain = tab?.url ? new URL(tab.url).hostname : '—';
    } catch (_) {
        currentDomain = '—';
    }
    siteDomainEl.textContent = currentDomain;

    loadStats();
}

// ─── Stats & Status ────────────────────────────────────────
async function loadStats() {
    const data = await storageGet([
        'enabled', 'totalBlocked', 'adsBlocked', 'phishingBlocked',
        'perSite', 'weekly', 'whitelist', 'debugMode'
    ]);

    isEnabled    = data.enabled !== false;
    isWhitelisted = (data.whitelist || []).includes(currentDomain);

    // Master toggle
    masterToggle.checked = isEnabled;
    toggleLabel.textContent = isEnabled ? 'ON' : 'OFF';

    // Debug toggle
    debugToggle.checked = data.debugMode || false;

    // Sync whitelist button label
    const btnWl = document.getElementById('btnWhitelist');
    if (btnWl) btnWl.textContent = isWhitelisted ? 'Un-whitelist' : 'Whitelist Site';

    // Status pill
    updateStatusPill();

    // Counters (animated)
    animateCounter(totalBlockedEl, data.totalBlocked || 0);
    animateCounter(phishingEl,     data.phishingBlocked || 0);
    animateCounter(siteBlockedEl,  (data.perSite || {})[currentDomain] || 0);

    // Chart
    drawChart(data.weekly || {});
}

function updateStatusPill() {
    statusPill.className = 'status-pill';
    statusDot.className  = 'dot';

    if (!isEnabled) {
        statusPill.classList.add('disabled');
        statusDot.classList.add('gray');
        statusText.textContent = 'Disabled';
    } else if (isWhitelisted) {
        statusPill.classList.add('whitelisted');
        statusDot.classList.add('yellow');
        statusText.textContent = 'Whitelisted';
    } else {
        statusPill.classList.add('protected');
        statusDot.classList.add('green');
        statusText.textContent = 'Protected';
    }
}

// ─── Master Toggle ─────────────────────────────────────────
masterToggle.addEventListener('change', async () => {
    isEnabled = masterToggle.checked;
    toggleLabel.textContent = isEnabled ? 'ON' : 'OFF';
    await chrome.storage.sync.set({ enabled: isEnabled });
    updateStatusPill();
});

// ─── Debug Toggle ──────────────────────────────────────────
debugToggle.addEventListener('change', async () => {
    await chrome.storage.sync.set({ debugMode: debugToggle.checked });
});

// ─── Whitelist Button ──────────────────────────────────────
document.getElementById('btnWhitelist').addEventListener('click', async () => {
    if (!currentDomain || currentDomain === '—') return;

    if (isWhitelisted) {
        // Remove from whitelist
        await chrome.runtime.sendMessage({ action: 'removeFromWhitelist', domain: currentDomain });
        isWhitelisted = false;
        showToast(`${currentDomain} removed from whitelist`);
    } else {
        await chrome.runtime.sendMessage({ action: 'addToWhitelist', domain: currentDomain });
        isWhitelisted = true;
        showToast(`${currentDomain} whitelisted`);
    }

    document.getElementById('btnWhitelist').textContent = isWhitelisted ? 'Un-whitelist' : 'Whitelist Site';
    updateStatusPill();
    loadWhitelist();
});

// ─── Reset Stats ───────────────────────────────────────────
document.getElementById('btnReset').addEventListener('click', async () => {
    if (!confirm('Reset all blocked stats?')) return;
    await chrome.storage.sync.set({ totalBlocked: 0, adsBlocked: 0, phishingBlocked: 0, perSite: {}, weekly: {} });
    animateCounter(totalBlockedEl, 0);
    animateCounter(phishingEl, 0);
    animateCounter(siteBlockedEl, 0);
    drawChart({});
    showToast('Stats reset');
});

// ─── Report Site ───────────────────────────────────────────
document.getElementById('btnReport').addEventListener('click', async () => {
    if (!currentDomain || currentDomain === '—') return;
    if (!confirm(`Report "${currentDomain}" for missed ads?\n\nThis helps improve blocking rules.`)) return;
    await chrome.runtime.sendMessage({ action: 'reportSite', domain: currentDomain });
    showToast(`${currentDomain} reported — thank you!`);
});

// ─── Custom Filters ────────────────────────────────────────
document.getElementById('btnAddFilter').addEventListener('click', addCustomFilter);
filterInput.addEventListener('keydown', (e) => { if (e.key === 'Enter') addCustomFilter(); });

async function addCustomFilter() {
    let domain = filterInput.value.trim().toLowerCase();
    if (!domain) return;
    // Strip protocol/path if user pasted a full URL
    try { domain = new URL(domain.includes('://') ? domain : `http://${domain}`).hostname; } catch (_) {}
    if (!domain) return;

    await chrome.runtime.sendMessage({ action: 'addCustomFilter', domain });
    filterInput.value = '';
    showToast(`${domain} blocked`);
    loadFilters();
}

async function loadFilters() {
    const data    = await storageGet('customFilters');
    const filters = data.customFilters || [];

    if (filters.length === 0) {
        filterList.innerHTML = '<div class="empty-msg">No custom filters yet</div>';
        return;
    }

    filterList.innerHTML = filters.map(f => `
        <div class="filter-tag">
            <span class="filter-tag-domain">${escHtml(f)}</span>
            <button class="btn-remove-filter" data-domain="${escHtml(f)}" title="Remove">×</button>
        </div>
    `).join('');

    filterList.querySelectorAll('.btn-remove-filter').forEach(btn => {
        btn.addEventListener('click', async () => {
            const d = btn.dataset.domain;
            await chrome.runtime.sendMessage({ action: 'removeCustomFilter', domain: d });
            showToast(`${d} removed`);
            loadFilters();
        });
    });
}

// ─── Whitelist Manager ─────────────────────────────────────
async function loadWhitelist() {
    const data = await storageGet('whitelist');
    const wl   = data.whitelist || [];

    if (wl.length === 0) {
        whitelistList.innerHTML = '<div class="empty-msg">No sites whitelisted</div>';
        return;
    }

    whitelistList.innerHTML = wl.map(d => `
        <div class="wl-item">
            <span class="wl-domain">${escHtml(d)}</span>
            <button class="btn-remove-wl" data-domain="${escHtml(d)}" title="Remove">✕</button>
        </div>
    `).join('');

    whitelistList.querySelectorAll('.btn-remove-wl').forEach(btn => {
        btn.addEventListener('click', async () => {
            const d = btn.dataset.domain;
            await chrome.runtime.sendMessage({ action: 'removeFromWhitelist', domain: d });
            if (d === currentDomain) {
                isWhitelisted = false;
                updateStatusPill();
                document.getElementById('btnWhitelist').textContent = 'Whitelist Site';
            }
            showToast(`${d} removed from whitelist`);
            loadWhitelist();
        });
    });
}

// ─── Debug Logs ────────────────────────────────────────────
async function loadLogs() {
    const resp = await chrome.runtime.sendMessage({ action: 'getLogs' });
    const logs = resp?.logs || [];

    if (logs.length === 0) {
        logList.innerHTML = '<div style="color:var(--text2);font-size:11px;">No log entries. Enable Debug Mode to capture events.</div>';
        return;
    }

    logList.innerHTML = logs.map(entry => {
        const isPhishing = entry.includes('[PHISHING');
        return `<div class="log-entry${isPhishing ? ' phishing' : ''}">${escHtml(entry)}</div>`;
    }).join('');
}

document.getElementById('btnClearLog').addEventListener('click', async () => {
    await chrome.runtime.sendMessage({ action: 'clearLogs' });
    loadLogs();
    showToast('Logs cleared');
});

// ─── Chart ─────────────────────────────────────────────────
function drawChart(data = {}) {
    const canvas = document.getElementById('chart');
    if (!canvas) return;
    const ctx  = canvas.getContext('2d');
    const dpr  = window.devicePixelRatio || 1;
    const W    = canvas.offsetWidth  || 320;
    const H    = 80;

    canvas.width  = W * dpr;
    canvas.height = H * dpr;
    ctx.scale(dpr, dpr);
    ctx.clearRect(0, 0, W, H);

    const values = Object.values(data).filter(v => typeof v === 'number').slice(-7);
    const weekSum = values.reduce((a, b) => a + b, 0);
    if (chartTotalEl) chartTotalEl.textContent = weekSum > 0 ? `${weekSum} this week` : '';

    if (values.length === 0) {
        ctx.fillStyle = 'rgba(100,116,139,0.6)';
        ctx.font = '11px system-ui';
        ctx.textAlign = 'center';
        ctx.fillText('No data yet', W / 2, H / 2 + 4);
        return;
    }

    const max      = Math.max(...values, 1);
    const padL     = 8, padR = 8, padB = 4, padT = 14;
    const plotW    = W - padL - padR;
    const plotH    = H - padT - padB;
    const barW     = Math.floor(plotW / 7) - 4;
    const gap      = Math.floor(plotW / 7);

    values.forEach((val, i) => {
        const bh   = Math.max((val / max) * plotH, val > 0 ? 3 : 0);
        const x    = padL + i * gap;
        const y    = padT + plotH - bh;

        const grad = ctx.createLinearGradient(0, y, 0, y + bh);
        grad.addColorStop(0, 'rgba(16,185,129,0.9)');
        grad.addColorStop(1, 'rgba(5,150,105,0.5)');
        ctx.fillStyle = grad;
        ctx.shadowColor = 'rgba(16,185,129,0.3)';
        ctx.shadowBlur  = 6;

        // Rounded top bar
        const r2 = Math.min(3, bh / 2);
        ctx.beginPath();
        ctx.moveTo(x, y + r2);
        ctx.arcTo(x, y, x + r2, y, r2);
        ctx.arcTo(x + barW, y, x + barW, y + r2, r2);
        ctx.lineTo(x + barW, y + bh);
        ctx.lineTo(x, y + bh);
        ctx.closePath();
        ctx.fill();
        ctx.shadowBlur = 0;

        if (val > 0) {
            ctx.fillStyle   = 'rgba(240,246,255,0.7)';
            ctx.font        = `bold ${Math.min(10, barW)}px system-ui`;
            ctx.textAlign   = 'center';
            ctx.fillText(val > 999 ? `${(val/1000).toFixed(1)}k` : val, x + barW / 2, y - 3);
        }
    });

    // X-axis
    ctx.strokeStyle = 'rgba(71,85,105,0.4)';
    ctx.lineWidth   = 1;
    ctx.beginPath();
    ctx.moveTo(padL, H - padB);
    ctx.lineTo(W - padR, H - padB);
    ctx.stroke();
}

// ─── Counter Animation ─────────────────────────────────────
function animateCounter(el, target) {
    if (!el) return;
    const start    = parseInt(el.textContent, 10) || 0;
    if (start === target) { el.textContent = target; return; }
    const duration = 500;
    const t0       = performance.now();
    const diff     = target - start;

    function tick(now) {
        const p    = Math.min((now - t0) / duration, 1);
        const ease = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.round(start + diff * ease);
        if (p < 1) requestAnimationFrame(tick);
    }
    requestAnimationFrame(tick);
}

// ─── Toast Notification ────────────────────────────────────
let toastTimer = null;
function showToast(msg) {
    let existing = document.querySelector('.toast');
    if (existing) existing.remove();
    clearTimeout(toastTimer);
    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.textContent = msg;
    document.body.appendChild(toast);
    toastTimer = setTimeout(() => toast.remove(), 2200);
}

// ─── Utils ─────────────────────────────────────────────────
function storageGet(keys) {
    return new Promise(resolve => chrome.storage.sync.get(keys, resolve));
}

function escHtml(str) {
    return String(str)
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

// ─── Auto-refresh ──────────────────────────────────────────
init();
// Refresh stats every 3 seconds
setInterval(() => {
    const activeTab = document.querySelector('.tab.active')?.dataset.tab;
    if (activeTab === 'shield') loadStats();
    if (activeTab === 'logs')   loadLogs();
}, 3000);