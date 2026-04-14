
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
