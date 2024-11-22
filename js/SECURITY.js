import eventHandler from './function/eventHandler.js';
import { debounce } from './function/debounce.js';
import { debug } from './function/debug.js';
// import { checkScreenSizeChange } from './function/screenSize.js';
import { getFingerprint } from './sha1.js';

(function () {
    'use strict';

    const defaultConfig = {
        warningDelay: 500,
        warningDuration: 1500,
        storageKey: 'leaveCount',
        warningMessageId: 'warningMessage',
        leaveCounterId: 'leaveCounter',
        consoleOutputId: 'consoleOutput',
        mouseMoveDebounceTime: 200
    };

    let config = { ...defaultConfig };
    let warningTimeout = null;
    let warningMessage, leaveCounter, consoleOutput;
    let mousePosition = { x: 0, y: 0 };

    const safelySetStorageItem = (key, value) => {
        try {
            localStorage.setItem(key, value);
        } catch (e) {
            debug(`[DEBUG - LSTORAGE] Error setting localStorage for key ${key}: ${e.message}`, 'error');
        }
    };

    const safelyGetStorageItem = (key) => {
        try {
            return localStorage.getItem(key);
        } catch (e) {
            debug(`[DEBUG - LSTORAGE] Error accessing localStorage for key ${key}: ${e.message}`, 'error');
            return null;
        }
    };

    const showWarning = () => {
        clearTimeout(warningTimeout);
        warningTimeout = setTimeout(() => {
            const consoleOutput = document.getElementById('consoleOutput');
            const warningLine = document.createElement('div');
            warningLine.className = 'output-line warning-message new';
            const timestamp = document.createElement('span');
            timestamp.className = 'timestamp';
            timestamp.textContent = new Date().toLocaleTimeString();
            const messageText = document.createElement('span');
            messageText.textContent = 'fein fein fein';
            warningLine.appendChild(timestamp);
            warningLine.appendChild(messageText);
            consoleOutput.appendChild(warningLine);
            warningLine.scrollIntoView({ behavior: 'smooth' });
            setTimeout(() => {
                warningLine.classList.remove('new');
            }, config.warningDuration);
        }, config.warningDelay);
    };

    const isUserLeavingPage = (event) => {
        if (!event) return document.hidden;
        const isFocusLost = document.activeElement !== document.body;

        switch (event.type) {
            case 'mouseleave':
                return event.clientY <= 0 || event.clientX <= 0 ||
                    event.clientX >= window.innerWidth || event.clientY >= window.innerHeight;
            case 'mousemove':
                const velocity = Math.sqrt(Math.pow(event.clientX - mousePosition.x, 2) + Math.pow(event.clientY - mousePosition.y, 2));
                return velocity > 200 && (event.clientY <= 5 || event.clientX <= 5);
            case 'keydown':
                return event.key === 'Tab' || (event.altKey && (event.key === 'F4' || event.key === 'Tab'));
            case 'blur':
            case 'focusout':
                return isFocusLost;
            default:
                return true;
        }
    };

    const handlePageExitEvent = (event) => {
        if (isUserLeavingPage(event)) {
            showWarning();
            debug(`detected: ${event.type}`, 'warning');
        }
    };

    const addEventListeners = () => {
        const debouncedHandlePageExitEvent = debounce(handlePageExitEvent, config.mouseMoveDebounceTime);
        eventHandler.onMultiple(document, 'visibilitychange blur focusout mouseleave keydown', handlePageExitEvent, { passive: true });
        
        eventHandler.on(document, 'mousemove', (e) => {
            mousePosition.x = e.clientX;
            mousePosition.y = e.clientY;
            debouncedHandlePageExitEvent(e);
        }, { passive: true });
    
        eventHandler.on(window, 'pageshow', () => {
            if (warningMessage) {
                warningMessage.style.display = 'none';
                warningMessage.setAttribute('aria-hidden', 'true');
            }
        });
    };

    const initializeElements = () => {
        warningMessage = document.getElementById(config.warningMessageId);
        consoleOutput = document.getElementById(config.consoleOutputId);
        if (warningMessage) {
            warningMessage.setAttribute('role', 'alert');
            warningMessage.setAttribute('aria-hidden', 'true');
        }
    };

    const initialize = (userConfig = {}) => {
        config = { ...defaultConfig, ...userConfig };
        const fingerprint = getFingerprint();
        debug(`initialized || with hash: ${fingerprint}`);
        initializeElements();
        addEventListeners();
    };

    // Public API
    window.pageExitDetector = {
        init: initialize,
        updateConfig: (newConfig) => {
            Object.assign(config, newConfig);
            debug('Configuration updated');
        }
    };

    if (typeof Storage === 'undefined') {
        debug('LocalStorage is not supported in this browser. Some features may not work.', 'error');
    }

    initialize();
})();