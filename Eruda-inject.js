// ==UserScript==
// @name        A Powerful Eruda Injector
// @namespace   secure-namespace
// @description Universal Eruda injection with CSP bypass, iframe support, retry mechanisms, and advanced DOM handling.
// @match       https://*/*
// @grant       GM_getValue
// @grant       GM_setValue
// @grant       GM_registerMenuCommand
// @version     2.5.0
// @author      YA
// @license     MIT
// @homepage    https://your-company.com/eruda-injector
// @supportURL  https://your-company.com/support
// @updateURL   https://your-company.com/eruda-injector.meta.js
// @icon        https://eruda.liriliri.io/favicon.ico
// @run-at      document-start
// @compatible  chrome
// @compatible  firefox
// @compatible  safari
// @compatible  edge
// @compatible  opera
// @compatible  brave
// @noframes    false
// ==/UserScript==

(function() {
    'use strict';
    
    // ==== Configuration Center ================================================
    const CONFIG = {
        ENABLED: true,
        RETRY_ATTEMPTS: 3,
        RETRY_DELAY: 1500,
        INJECT_IN_FRAMES: true,
        HOTKEY: 'Ctrl+Shift+E',
        CDN_PRIORITY: [
            'https://cdn.jsdelivr.net/npm/eruda@3/eruda.min.js',
            'https://unpkg.com/eruda@3/eruda.min.js',
            'https://cdnjs.cloudflare.com/ajax/libs/eruda/3.0.0/eruda.min.js',
            'data:application/javascript;base64,' + btoa(`
                document.write('<script src="https://cdn.jsdelivr.net/npm/eruda@3/eruda.min.js"><\\/script>');
                document.addEventListener('DOMContentLoaded', function() {
                    eruda.init();
                });
            `)
        ],
        FALLBACK_SCRIPT: `//cdn.jsdelivr.net/npm/eruda@3/eruda.min.js`,
        PERSISTENCE_CHECK_INTERVAL: 3000
    };

    // ==== State Management ====================================================
    let injectionAttempts = 0;
    let observerActive = false;
    let erudaInitialized = false;

    // ==== Advanced DOM Utilities ==============================================
    const domReady = (fn) => {
        if (document.readyState !== 'loading') fn();
        else document.addEventListener('DOMContentLoaded', fn);
    };

    const createBlobScript = (code) => {
        const blob = new Blob([code], { type: 'text/javascript' });
        return URL.createObjectURL(blob);
    };

    // ==== Robust Injection System =============================================
    const multiCDNInjector = async (attempt = 0) => {
        if (attempt >= CONFIG.RETRY_ATTEMPTS || erudaInitialized) return;

        try {
            const currentCDN = CONFIG.CDN_PRIORITY[attempt];
            await injectScript(currentCDN);
            erudaInitialized = true;
            log(`Successfully injected via ${currentCDN}`);
        } catch (err) {
            errorLog(`CDN attempt ${attempt + 1} failed: ${err.message}`);
            setTimeout(() => multiCDNInjector(attempt + 1), CONFIG.RETRY_DELAY);
        }
    };

    const injectScript = (src) => new Promise((resolve, reject) => {
        const script = document.createElement('script');
        script.src = src;
        script.onload = () => resolve();
        script.onerror = (err) => reject(new Error(`Failed to load ${src}`));
        
        (document.head || document.documentElement).appendChild(script);
    });

    // ==== Frame Handling System ===============================================
    const handleFrames = () => {
        if (!CONFIG.INJECT_IN_FRAMES) return;
        
        document.querySelectorAll('iframe').forEach(frame => {
            try {
                if (frame.contentDocument && !frame.dataset.erudaInjected) {
                    frame.contentDocument.defaultView.eval(injectionCode.toString());
                    frame.dataset.erudaInjected = true;
                }
            } catch (error) {
                // Cross-origin frame protection
            }
        });
    };

    // ==== Anti-Removal Protection =============================================
    const persistenceGuard = () => {
        setInterval(() => {
            if (!document.querySelector('script[src*="eruda"]')) {
                log('Eruda script removed - reinjecting');
                multiCDNInjector();
            }
        }, CONFIG.PERSISTENCE_CHECK_INTERVAL);
    };

    // ==== Adaptive Initialization =============================================
    const smartInitialize = () => {
        domReady(() => {
            if (typeof eruda !== 'undefined' && !erudaInitialized) {
                eruda.init();
                eruda.show();
                erudaInitialized = true;
                log('Eruda successfully initialized');
            }
        });
    };

    // ==== User Controls =======================================================
    const registerHotkey = () => {
        document.addEventListener('keydown', (e) => {
            if (e.ctrlKey && e.shiftKey && e.code === 'KeyE') {
                CONFIG.ENABLED = !CONFIG.ENABLED;
                GM_setValue('erudaEnabled', CONFIG.ENABLED);
                alert(`Eruda ${CONFIG.ENABLED ? 'Enabled' : 'Disabled'}`);
            }
        });
    };

    // ==== Advanced Monitoring =================================================
    const performanceMonitor = () => {
        const perfObserver = new PerformanceObserver((list) => {
            list.getEntries().forEach(entry => {
                log(`Resource loaded: ${entry.name} (${entry.duration.toFixed(2)}ms)`);
            });
        });
        perfObserver.observe({ entryTypes: ['resource'] });
    };

    // ==== Main Execution Flow =================================================
    const initializeSystem = () => {
        if (!CONFIG.ENABLED) return;
        
        CONFIG.ENABLED = GM_getValue('erudaEnabled', true);
        registerHotkey();
        persistenceGuard();
        performanceMonitor();
        
        const domObserver = new MutationObserver((mutations) => {
            if (!observerActive) {
                handleFrames();
                smartInitialize();
            }
        });
        
        domObserver.observe(document, {
            childList: true,
            subtree: true,
            attributes: false,
            characterData: false
        });

        multiCDNInjector();
        handleFrames();
        smartInitialize();
    };

    // ==== Utility Functions ===================================================
    const log = (...args) => console.log('%cERUDA-INJECTOR:', 'color: #4CAF50;', ...args);
    const errorLog = (...args) => console.error('%cERUDA-ERROR:', 'color: #FF5722;', ...args);

    // ==== Bootstrapping =======================================================
    domReady(initializeSystem);
    if (window.top === window.self) initializeSystem();

})();