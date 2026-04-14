import codecs

html_content = """<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, user-scalable=no">
    <title>Shield — Ad Blocker</title>
    <style>
        :root {
            /* Light Theme */
            --bg-base: #ffffff;
            --bg-panel: #f8fafc;
            --bg-elevated: #ffffff;
            --bg-input: #f1f5f9;
            --bg-hover: #e2e8f0;
            --text-main: #0f172a;
            --text-muted: #64748b;
            --accent-primary: #3b82f6;
            --accent-hover: #2563eb;
            --accent-light: #e0e7ff;
            --success: #10b981;
            --success-light: #d1fae5;
            --warning: #f59e0b;
            --warning-light: #fef3c7;
            --danger: #ef4444;
            --danger-light: #fee2e2;
            --border: #e2e8f0;
            --shadow-sm: 0 1px 2px 0 rgb(0 0 0 / 0.05);
            --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.1);
            --radius-md: 12px;
            --radius-lg: 16px;
            --radius-full: 9999px;
            --transition: all 0.2s cubic-bezier(0.4, 0, 0.2, 1);
        }

        body.dark {
            --bg-base: #0f172a;
            --bg-panel: #020617;
            --bg-elevated: #1e293b;
            --bg-input: #0f172a;
            --bg-hover: #334155;
            --text-main: #f8fafc;
            --text-muted: #94a3b8;
            --accent-primary: #60a5fa;
            --accent-hover: #93c5fd;
            --accent-light: rgba(59, 130, 246, 0.2);
            --success: #34d399;
            --success-light: rgba(16, 185, 129, 0.2);
            --warning: #fbbf24;
            --warning-light: rgba(245, 158, 11, 0.2);
            --danger: #f87171;
            --danger-light: rgba(239, 68, 68, 0.2);
            --border: #334155;
            --shadow-sm: 0 1px 3px 0 rgb(0 0 0 / 0.5);
            --shadow-md: 0 4px 6px -1px rgb(0 0 0 / 0.5);
        }

        * { margin: 0; padding: 0; box-sizing: border-box; }
        
        body {
            font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
            background: var(--bg-base);
            color: var(--text-main);
            width: 380px; min-height: 600px;
            font-size: 14px; line-height: 1.5;
            transition: var(--transition);
            overflow-x: hidden;
        }

        svg { width: 1.2rem; height: 1.2rem; fill: none; stroke: currentColor; stroke-width: 2.2; stroke-linecap: round; stroke-linejoin: round; }
        ::-webkit-scrollbar { width: 5px; }
        ::-webkit-scrollbar-track { background: transparent; }
        ::-webkit-scrollbar-thumb { background: var(--border); border-radius: var(--radius-full); }
        ::-webkit-scrollbar-thumb:hover { background: var(--text-muted); }

        .container { display: flex; flex-direction: column; height: 100vh; }

        /* Header */
        .header { padding: 18px 20px; background: var(--bg-base); border-bottom: 1px solid var(--border); display: flex; flex-direction: column; gap: 16px; position: sticky; top: 0; z-index: 50; }
        .header-top { display: flex; justify-content: space-between; align-items: center; }
        .brand { display: flex; align-items: center; gap: 10px; }
        .logo-icon { width: 34px; height: 34px; background: var(--accent-light); color: var(--accent-primary); border-radius: 10px; display: flex; align-items: center; justify-content: center; }
        .brand-title { font-size: 18px; font-weight: 700; letter-spacing: -0.5px; }
        .brand-version { font-size: 10px; font-weight: 700; background: var(--bg-input); padding: 2px 7px; border-radius: var(--radius-full); color: var(--text-muted); }
        .header-actions { display: flex; align-items: center; gap: 8px; position: relative; }
        .icon-btn { background: var(--bg-input); border: none; color: var(--text-muted); width: 34px; height: 34px; border-radius: var(--radius-full); display: flex; align-items: center; justify-content: center; cursor: pointer; transition: var(--transition); }
        .icon-btn:hover { background: var(--bg-hover); color: var(--text-main); transform: scale(1.05); }
        .icon-btn svg { width: 16px; height: 16px; }

        /* site banner */
        .site-banner { display: flex; justify-content: space-between; align-items: center; background: var(--bg-panel); padding: 12px 20px; border-bottom: 1px solid var(--border); }
        .site-info { display: flex; align-items: center; gap: 10px; flex: 1; min-width: 0; }
        .site-domain { font-weight: 600; font-size: 13px; font-family: monospace; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; max-width: 170px; }
        .status-badge { display: inline-flex; align-items: center; gap: 6px; font-size: 11px; font-weight: 600; padding: 4px 10px; border-radius: var(--radius-full); transition: var(--transition); }
        .status-badge.protected { background: var(--success-light); color: var(--success); }
        .status-badge.whitelisted { background: var(--warning-light); color: var(--warning); }
        .status-badge.disabled { background: var(--bg-input); color: var(--text-muted); }
        .status-dot { width: 8px; height: 8px; border-radius: 50%; }
        .status-badge.protected .status-dot { background: var(--success); box-shadow: 0 0 6px var(--success); animation: pulse 2s infinite; }
        .status-badge.whitelisted .status-dot { background: var(--warning); }
        .status-badge.disabled .status-dot { background: var(--text-muted); }

        /* master toggle */
        .switch { position: relative; display: inline-block; width: 42px; height: 24px; flex-shrink: 0; }
        .switch input { opacity: 0; width: 0; height: 0; }
        .slider { position: absolute; cursor: pointer; inset: 0; background-color: var(--border); transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1); border-radius: 24px; }
        .slider:before { position: absolute; content: ""; height: 18px; width: 18px; left: 3px; bottom: 3px; background-color: white; transition: 0.3s cubic-bezier(0.4, 0, 0.2, 1); border-radius: 50%; box-shadow: var(--shadow-sm); }
        input:checked + .slider { background-color: var(--success); }
        input:checked + .slider:before { transform: translateX(18px); }

        /* Tabs */
        .tabs-wrap { padding: 16px 20px 4px; background: var(--bg-base); }
        .tabs { display: flex; background: var(--bg-input); padding: 4px; border-radius: var(--radius-lg); gap: 4px; }
        .tab { flex: 1; display: flex; align-items: center; justify-content: center; gap: 6px; padding: 8px 4px; border-radius: 12px; border: none; background: transparent; color: var(--text-muted); font-size: 11px; font-weight: 600; cursor: pointer; transition: var(--transition); letter-spacing: 0.2px; }
        .tab svg { width: 14px; height: 14px; }
        .tab:hover { color: var(--text-main); }
        .tab.active { background: var(--bg-elevated); color: var(--accent-primary); box-shadow: var(--shadow-sm); }

        /* Panels */
        .panel-container { flex: 1; position: relative; }
        .panel { padding: 16px 20px; display: none; animation: fadeIn 0.2s ease-out; }
        .panel.active { display: block; }

        /* Stats grids */
        .stats-grid { display: grid; grid-template-columns: repeat(2, 1fr); gap: 12px; margin-bottom: 16px; }
        .stat-card { background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 14px; display: flex; flex-direction: column; gap: 8px; box-shadow: var(--shadow-sm); transition: var(--transition); }
        .stat-card:hover { transform: translateY(-2px); box-shadow: var(--shadow-md); border-color: var(--accent-light); }
        .stat-header { display: flex; justify-content: space-between; align-items: center; color: var(--text-muted); font-size: 11px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.5px; }
        .stat-header svg { width: 14px; height: 14px; }
        .stat-val { font-size: 26px; font-weight: 800; font-variant-numeric: tabular-nums; line-height: 1; color: var(--text-main); }
        .stat-card.danger .stat-val { color: var(--danger); }
        .stat-card.danger .stat-header svg { color: var(--danger); }
        .stat-card.full-width { grid-column: span 2; }

        /* Actions */
        .action-params { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; margin-bottom: 20px; }
        .btn { display: flex; align-items: center; justify-content: center; gap: 6px; padding: 10px 14px; border-radius: var(--radius-md); border: 1px solid var(--border); font-size: 12px; font-weight: 600; cursor: pointer; background: var(--bg-elevated); color: var(--text-main); transition: var(--transition); }
        .btn:hover { background: var(--bg-hover); transform: translateY(-1px); }
        .btn:active { transform: translateY(0); }
        .btn svg { width: 14px; height: 14px; }
        .btn-primary { background: var(--accent-primary); color: white; border: none; }
        .btn-primary:hover { background: var(--accent-hover); color: white; }
        .btn-full { grid-column: span 2; background: var(--danger-light); color: var(--danger); border: none; }
        .btn-full:hover { background: rgba(239, 68, 68, 0.3); }

        /* Chart */
        .chart-box { background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--radius-lg); padding: 16px; display: flex; flex-direction: column; gap: 12px; margin-bottom: 16px;}
        .chart-top { display: flex; justify-content: space-between; align-items: center; }
        .chart-title-wrap { display: flex; align-items: center; gap: 6px; color: var(--text-muted); font-weight: 600; font-size: 11px; text-transform: uppercase; letter-spacing: 0.5px; }
        .chart-total { font-size: 11px; color: var(--accent-primary); font-weight: 700; background: var(--accent-light); padding: 2px 8px; border-radius: var(--radius-full); }
        canvas#chart { width: 100%; height: 80px; }

        /* List views (Filters/Whitelist/Logs) */
        .section-title { font-size: 12px; font-weight: 600; color: var(--text-muted); text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; }
        .input-group { display: flex; gap: 8px; margin-bottom: 16px; }
        .input-field { flex: 1; background: var(--bg-input); border: 1px solid var(--border); padding: 10px 14px; border-radius: var(--radius-md); color: var(--text-main); font-size: 13px; font-family: monospace; outline: none; transition: var(--transition); }
        .input-field:focus { border-color: var(--accent-primary); box-shadow: 0 0 0 3px var(--accent-light); }
        .list-wrap { display: flex; flex-direction: column; gap: 8px; max-height: 280px; overflow-y: auto; padding-right: 4px; }
        .list-item { display: flex; justify-content: space-between; align-items: center; padding: 10px 14px; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--radius-md); transition: var(--transition); }
        .list-item.log { padding: 8px 12px; flex-direction: column; align-items: flex-start; gap: 4px; background: var(--bg-input); border-left: 3px solid var(--border); font-family: monospace; font-size: 11px; }
        .list-item.log.phishing { border-left-color: var(--danger); color: var(--danger); }
        .list-item.log.ad { border-left-color: var(--accent-primary); color: var(--accent-primary); }
        .list-domain { font-size: 12px; font-weight: 600; font-family: monospace; color: var(--accent-primary); }
        .list-item.wl .list-domain { color: var(--warning); }
        .btn-del { background: transparent; border: none; color: var(--text-muted); cursor: pointer; padding: 6px; border-radius: 8px; transition: var(--transition); display: flex; }
        .btn-del:hover { background: var(--danger-light); color: var(--danger); transform: scale(1.1); }
        .empty-msg { text-align: center; color: var(--text-muted); font-size: 12px; padding: 30px 20px; font-style: italic; }

        /* debug Toggle */
        .debug-row { display: flex; justify-content: space-between; align-items: center; padding: 12px 14px; background: var(--bg-input); border-radius: var(--radius-md); margin-top: 10px; }
        .debug-row span { font-size: 12px; font-weight: 600; color: var(--text-muted); display: flex; align-items: center; gap: 6px; }

        /* Modals/Dropdowns */
        #langModal { position: absolute; top: 56px; right: 20px; background: var(--bg-elevated); border: 1px solid var(--border); border-radius: var(--radius-lg); box-shadow: var(--shadow-md); padding: 8px; z-index: 100; display: none; flex-direction: column; gap: 2px; min-width: 130px; }
        #langModal.visible { display: flex; animation: slideUp 0.2s cubic-bezier(0.4, 0, 0.2, 1); }
        .lang-option { padding: 8px 12px; background: transparent; border: none; border-radius: 8px; color: var(--text-main); font-size: 12px; font-weight: 500; text-align: left; cursor: pointer; transition: var(--transition); display: flex; align-items: center; justify-content: space-between; }
        .lang-option:hover { background: var(--bg-hover); }
        .lang-option.active { color: var(--accent-primary); font-weight: 700; background: var(--accent-light); }

        .toast { position: fixed; bottom: 20px; left: 50%; transform: translateX(-50%); background: var(--text-main); color: var(--bg-base); padding: 10px 20px; border-radius: var(--radius-full); font-size: 12px; font-weight: 600; box-shadow: var(--shadow-md); z-index: 1000; animation: toastIn 0.3s cubic-bezier(0.4, 0, 0.2, 1); white-space: nowrap;}
        
        @keyframes pulse { 0% { opacity: 1; box-shadow: 0 0 0 0 rgba(16,185,129,0.4); } 70% { opacity: 0.8; box-shadow: 0 0 0 6px rgba(16,185,129,0); } 100% { opacity: 1; box-shadow: 0 0 0 0 rgba(16,185,129,0); } }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(4px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes slideUp { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes toastIn { from { opacity: 0; transform: translate(-50%, 20px); } to { opacity: 1; transform: translate(-50%, 0); } }
    </style>
</head>
<body>

<div class="container">
    <div class="header">
        <div class="header-top">
            <div class="brand">
                <div class="logo-icon">
                    <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                </div>
                <div style="display: flex; flex-direction: column;">
                    <span class="brand-title" data-i18n="appTitle">Shield</span>
                </div>
                <span class="brand-version" data-i18n="version">Ultra</span>
            </div>
            <div class="header-actions">
                <button class="icon-btn" id="langBtn" title="Language">
                    <svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M2 12h20"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                </button>
                <div id="langModal"></div>
                <button class="icon-btn" id="themeToggleBtn" title="Theme">
                    <svg viewBox="0 0 24 24"><path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z"/></svg>
                </button>
            </div>
        </div>
    </div>

    <div class="site-banner">
        <div class="site-info">
            <div class="status-badge protected" id="statusPill">
                <div class="status-dot" id="statusDot"></div>
                <span id="statusText" data-i18n="statusProtected">Protected</span>
            </div>
            <span class="site-domain" id="siteDomain">example.com</span>
        </div>
        <label class="switch" title="Master Toggle">
            <input type="checkbox" id="masterToggle" checked>
            <span class="slider"></span>
        </label>
    </div>

    <div class="tabs-wrap">
        <div class="tabs">
            <button class="tab active" data-tab="shield">
                <svg viewBox="0 0 24 24"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                <span data-i18n="tabShield">Shield</span>
            </button>
            <button class="tab" data-tab="filters">
                <svg viewBox="0 0 24 24"><line x1="4" y1="21" x2="4" y2="14"/><line x1="4" y1="10" x2="4" y2="3"/><line x1="12" y1="21" x2="12" y2="12"/><line x1="12" y1="8" x2="12" y2="3"/><line x1="20" y1="21" x2="20" y2="16"/><line x1="20" y1="12" x2="20" y2="3"/><line x1="1" y1="14" x2="7" y2="14"/><line x1="9" y1="8" x2="15" y2="8"/><line x1="17" y1="16" x2="23" y2="16"/></svg>
                <span data-i18n="tabFilters">Filters</span>
            </button>
            <button class="tab" data-tab="whitelist">
                <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                <span data-i18n="tabWhitelist">Whitelist</span>
            </button>
            <button class="tab" data-tab="logs">
                <svg viewBox="0 0 24 24"><polyline points="4 7 4 4 20 4 20 7"/><line x1="9" y1="20" x2="15" y2="20"/><line x1="12" y1="4" x2="12" y2="20"/></svg>
                <span data-i18n="tabLogs">Logs</span>
            </button>
        </div>
    </div>

    <div class="panel-container">
        <!-- Shield Panel -->
        <div class="panel active" id="panel-shield">
            <div class="stats-grid">
                <div class="stat-card full-width accent">
                    <div class="stat-header"><span data-i18n="statTotal">Total Blocked</span><svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><line x1="4.93" y1="4.93" x2="19.07" y2="19.07"/></svg></div>
                    <div class="stat-val" id="totalBlocked">0</div>
                </div>
                <div class="stat-card danger">
                    <div class="stat-header"><span data-i18n="statPhishing">Phishing</span><svg viewBox="0 0 24 24"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg></div>
                    <div class="stat-val" id="phishingBlocked">0</div>
                </div>
                <div class="stat-card">
                    <div class="stat-header"><span data-i18n="statSite">This Site</span><svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2" ry="2"/><line x1="3" y1="9" x2="21" y2="9"/><line x1="9" y1="21" x2="9" y2="9"/></svg></div>
                    <div class="stat-val" id="siteBlocked">0</div>
                </div>
            </div>

            <div class="chart-box">
                <div class="chart-top">
                    <div class="chart-title-wrap"><svg viewBox="0 0 24 24"><line x1="18" y1="20" x2="18" y2="10"/><line x1="12" y1="20" x2="12" y2="4"/><line x1="6" y1="20" x2="6" y2="14"/></svg><span data-i18n="weekChart">Weekly Threats</span></div>
                    <span class="chart-total" id="chartTotal">0</span>
                </div>
                <canvas id="chart"></canvas>
            </div>

            <div class="action-params">
                <button class="btn btn-primary" id="btnWhitelist">
                    <svg viewBox="0 0 24 24"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>
                    <span><span data-i18n="whitelistBtn">Whitelist Site</span></span>
                </button>
                <button class="btn" id="btnReset">
                    <svg viewBox="0 0 24 24"><polyline points="23 4 23 10 17 10"/><polyline points="1 20 1 14 7 14"/><path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/></svg>
                    <span data-i18n="resetBtn">Reset Stats</span>
                </button>
                <button class="btn btn-full" id="btnReport">
                    <svg viewBox="0 0 24 24"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>
                    <span data-i18n="reportBtn">Report Issue</span>
                </button>
            </div>
            
            <div class="debug-row">
                <span><svg viewBox="0 0 24 24"><path d="M20 14.66V20a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h5.34"/><polygon points="18 2 22 6 12 16 8 16 8 12 18 2"/></svg> <strong data-i18n="debugToggle">Enable Debug Logs</strong></span>
                <label class="switch"><input type="checkbox" id="debugToggle"><span class="slider"></span></label>
            </div>
        </div>

        <!-- Filters Panel -->
        <div class="panel" id="panel-filters">
            <div class="section-title" data-i18n="tabFilters">Custom Filters</div>
            <div class="input-group">
                <input type="text" class="input-field" id="filterInput" data-i18ph="filterPlace" placeholder="e.g. ad.example.com">
                <button class="btn btn-primary" id="btnAddFilter" data-i18n="addBtn">Add</button>
            </div>
            <div class="list-wrap" id="filterList"></div>
        </div>

        <!-- Whitelist Panel -->
        <div class="panel" id="panel-whitelist">
            <div class="section-title" data-i18n="tabWhitelist">Allowed Sites</div>
            <div class="list-wrap" id="whitelistList"></div>
        </div>

        <!-- Logs Panel -->
        <div class="panel" id="panel-logs">
            <div style="display:flex; justify-content:space-between; align-items:center; margin-bottom:12px;">
                <div class="section-title" style="margin-bottom:0;" data-i18n="tabLogs">Event Logs</div>
                <button class="btn" id="btnClearLog" style="padding: 6px 12px; font-size: 11px;">
                    <svg viewBox="0 0 24 24"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                    <span data-i18n="clearLogsBtn">Clear</span>
                </button>
            </div>
            <div class="list-wrap" id="logList"></div>
        </div>
    </div>
</div>

<script src="i18n.js"></script>
<script src="popup.js"></script>
</body>
</html>
"""

i18n_js = """
const translations = {
    en: {
        appTitle: "Shield", version: "Ultra", statusProtected: "Protected", statusWhitelisted: "Whitelisted", statusDisabled: "Disabled",
        tabShield: "Shield", tabFilters: "Filters", tabWhitelist: "Whitelist", tabLogs: "Logs",
        statTotal: "Total Blocked", statSite: "This Site", statPhishing: "Phishing", weekChart: "Weekly Threats",
        whitelistBtn: "Whitelist Site", unwhitelistBtn: "Un-whitelist", resetBtn: "Reset Stats", reportBtn: "Report Issue",
        debugToggle: "Enable Debug Logs", filterPlace: "e.g. tracking.site.com", addBtn: "Add", clearLogsBtn: "Clear",
        emptyFilters: "No custom filters added yet.", emptyWhitelist: "No sites whitelisted yet.", emptyLogs: "System secure. No recent events recorded.",
        langName: "English"
    },
    es: {
        appTitle: "Escudo", version: "Ultra", statusProtected: "Protegido", statusWhitelisted: "Permitido", statusDisabled: "Desactivado",
        tabShield: "Escudo", tabFilters: "Filtros", tabWhitelist: "Lista Blanca", tabLogs: "Registros",
        statTotal: "Total Bloqueados", statSite: "Este Sitio", statPhishing: "Phishing", weekChart: "Amenazas Semanales",
        whitelistBtn: "Permitir Sitio", unwhitelistBtn: "No Permitir", resetBtn: "Restablecer", reportBtn: "Reportar Problema",
        debugToggle: "Habilitar Registros", filterPlace: "ej. ads.ejemplo.com", addBtn: "Añadir", clearLogsBtn: "Limpiar",
        emptyFilters: "No hay filtros personalizados.", emptyWhitelist: "No hay sitios permitidos.", emptyLogs: "Sistema seguro. No hay eventos.",
        langName: "Español"
    },
    fr: {
        appTitle: "Bouclier", version: "Ultra", statusProtected: "Protégé", statusWhitelisted: "Liste Blanche", statusDisabled: "Désactivé",
        tabShield: "Bouclier", tabFilters: "Filtres", tabWhitelist: "Autorisés", tabLogs: "Journaux",
        statTotal: "Total Bloqué", statSite: "Ce Site", statPhishing: "Hameçonnage", weekChart: "Menaces Hebdo",
        whitelistBtn: "Autoriser le Site", unwhitelistBtn: "Ne Plus Autoriser", resetBtn: "Réinitialiser", reportBtn: "Signaler",
        debugToggle: "Activer Débogage", filterPlace: "ex. pub.site.com", addBtn: "Ajouter", clearLogsBtn: "Effacer",
        emptyFilters: "Aucun filtre personnalisé.", emptyWhitelist: "Aucun site autorisé.", emptyLogs: "Système sécurisé.",
        langName: "Français"
    },
    de: {
        appTitle: "Schild", version: "Ultra", statusProtected: "Geschützt", statusWhitelisted: "Erlaubt", statusDisabled: "Deaktiviert",
        tabShield: "Schild", tabFilters: "Filter", tabWhitelist: "Erlaubt", tabLogs: "Protokolle",
        statTotal: "Insgesamt Blockiert", statSite: "Diese Seite", statPhishing: "Phishing", weekChart: "Wöchentliche Bedrohungen",
        whitelistBtn: "Seite Erlauben", unwhitelistBtn: "Nicht Erlauben", resetBtn: "Zurücksetzen", reportBtn: "Melden",
        debugToggle: "Debug-Logs Aktivieren", filterPlace: "z.B. ads.beispiel.de", addBtn: "Hinzufügen", clearLogsBtn: "Löschen",
        emptyFilters: "Keine Filter hinzugefügt.", emptyWhitelist: "Keine Seiten erlaubt.", emptyLogs: "System sicher. Keine Ereignisse.",
        langName: "Deutsch"
    },
    ne: {
        appTitle: "ढाल (Shield)", version: "Ultra", statusProtected: "सुरक्षित", statusWhitelisted: "अनुमति दिइएको", statusDisabled: "निष्क्रिय",
        tabShield: "ढाल", tabFilters: "फिल्टरहरू", tabWhitelist: "ह्वाइटलिस्ट", tabLogs: "लगहरू",
        statTotal: "कुल रोकिएको", statSite: "यो साइट", statPhishing: "ठगी (Phishing)", weekChart: "साप्ताहिक खतराहरू",
        whitelistBtn: "साइटलाई अनुमति दिनुहोस्", unwhitelistBtn: "अनुमति हटाउनुहोस्", resetBtn: "रिसेट गर्नुहोस्", reportBtn: "रिपोर्ट गर्नुहोस्",
        debugToggle: "डिबग लगहरू खोल्नुहोस्", filterPlace: "उदाहरण: tracking.site.com", addBtn: "थप्नुहोस्", clearLogsBtn: "हटाउनुहोस्",
        emptyFilters: "कुनै अनुकूलन फिल्टर छैन।", emptyWhitelist: "कुनै साइट ह्वाइटलिस्ट गरिएको छैन।", emptyLogs: "प्रणाली सुरक्षित छ। कुनै लग छैन।",
        langName: "नेपाली"
    },
    zh: {
        appTitle: "护盾", version: "Ultra", statusProtected: "受保护", statusWhitelisted: "已白名单", statusDisabled: "已禁用",
        tabShield: "护盾", tabFilters: "过滤器", tabWhitelist: "白名单", tabLogs: "日志",
        statTotal: "总计拦截", statSite: "本网站", statPhishing: "钓鱼网站", weekChart: "每周威胁",
        whitelistBtn: "加入白名单", unwhitelistBtn: "移除白名单", resetBtn: "重置数据", reportBtn: "报告问题",
        debugToggle: "启用调试日志", filterPlace: "例如: ad.site.com", addBtn: "添加", clearLogsBtn: "清除",
        emptyFilters: "尚未添加自定义过滤器。", emptyWhitelist: "尚未添加白名单网站。", emptyLogs: "系统安全。无近期日志。",
        langName: "中文"
    }
};

let currentLang = 'en';

function applyLanguage(lang) {
    if (translations[lang]) currentLang = lang;
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (translations[currentLang][key]) {
            el.textContent = translations[currentLang][key];
        }
    });
    document.querySelectorAll('[data-i18ph]').forEach(el => {
        const key = el.getAttribute('data-i18ph');
        if (translations[currentLang][key]) {
            el.placeholder = translations[currentLang][key];
        }
    });
}
"""

js_content = """
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

    const data = await new Promise(r => chrome.storage.sync.get(['enabled', 'totalBlocked', 'adsBlocked', 'phishingBlocked', 'perSite', 'weekly', 'whitelist', 'debugMode', 'darkMode', 'language'], r));

    isEnabled    = data.enabled !== false;
    isDarkMode   = data.darkMode || false;
    isWhitelisted = (data.whitelist || []).includes(currentDomain);
    
    // Setup i18n
    if (data.language) currentLang = data.language;
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
setInterval(()=>{
    const active = document.querySelector('.tab.active')?.dataset.tab;
    if(active==='shield') chrome.storage.sync.get(['totalBlocked','phishingBlocked','perSite','weekly'], d=>{
        animateCounter(totalBlockedEl, d.totalBlocked || 0);
        animateCounter(phishingEl, d.phishingBlocked || 0);
        animateCounter(siteBlockedEl, (d.perSite||{})[currentDomain] || 0);
        drawChart(d.weekly||{});
    });
    if(active==='logs') loadLogs();
}, 2500);
"""

with codecs.open('popup.html', 'w', 'utf-8') as f: f.write(html_content)
with codecs.open('popup.js', 'w', 'utf-8') as f: f.write(js_content)
with codecs.open('i18n.js', 'w', 'utf-8') as f: f.write(i18n_js)
print("Build successful.")
