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
    let leaveCount = 0;
    let warningMessage, leaveCounter, consoleOutput;
    let mousePosition = { x: 0, y: 0 };

    const debug = (message, type = 'info') => {
        const outputLine = document.createElement('div');
        outputLine.className = `output-line ${type}`;
    
        const timestamp = document.createElement('span');
        timestamp.className = 'timestamp';
        timestamp.textContent = new Date().toLocaleTimeString();
    
        const content = document.createElement('span');
        content.className = 'content';
        content.textContent = message;
    
        outputLine.append(timestamp, content);
    
        const consoleOutput = document.getElementById('consoleOutput');
        consoleOutput.appendChild(outputLine);
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    
        setTimeout(() => {
            outputLine.classList.add('new');
            setTimeout(() => {
                outputLine.classList.remove('new');
            }, 2500);
        });
    };

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
            if (warningMessage) {
                warningMessage.style.display = 'block';
                warningMessage.setAttribute('aria-hidden', 'false');
                incrementLeaveCount();
                updateLeaveCounter();
                setTimeout(() => {
                    warningMessage.style.display = 'none';
                    warningMessage.setAttribute('aria-hidden', 'true');
                }, config.warningDuration);
            }
        }, config.warningDelay);
    };

    const incrementLeaveCount = () => {
        leaveCount++;
        safelySetStorageItem(config.storageKey, leaveCount);
    };

    const updateLeaveCounter = () => {
        if (leaveCounter) {
            leaveCounter.textContent = `Times left the page: ${leaveCount}`;
            leaveCounter.setAttribute('aria-label', `You have left the page ${leaveCount} times`);
        }
    };

    const isUserLeavingPage = (event) => {
        if (!event) return document.hidden;
        const isFocusLost = document.activeElement !== document.body;

        switch (event.type) {
            case 'mouseleave':
                return event.clientY <= 0 || event.clientX <= 0 || 
                    event.clientX >= window.innerWidth || event.clientY >= window.innerHeight;
            case 'mousemove':
                const velocity = Math.sqrt(
                    Math.pow(event.clientX - mousePosition.x, 2) + 
                    Math.pow(event.clientY - mousePosition.y, 2)
                );
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

    const debounce = (func, delay) => {
        let timeoutId;
        return function(...args) {
            const context = this;
            clearTimeout(timeoutId);
            timeoutId = setTimeout(() => func.apply(context, args), delay);
        };
    };

    const handlePageExitEvent = (event) => {
        if (isUserLeavingPage(event)) {
            showWarning();
            debug(`Detected: ${event.type}`, 'warning');
        }
    };

    const addEventListeners = () => {
        const debouncedHandlePageExitEvent = debounce(handlePageExitEvent, config.mouseMoveDebounceTime);

        ['visibilitychange', 'blur', 'focusout', 'mouseleave', 'keydown', 'mousemove'].forEach(eventType => {
            if (eventType === 'mousemove') {
                document.addEventListener(eventType, (e) => {
                    mousePosition.x = e.clientX;
                    mousePosition.y = e.clientY;
                    debouncedHandlePageExitEvent(e);
                }, { passive: true });
            } else {
                document.addEventListener(eventType, handlePageExitEvent, { passive: true });
            }
        });

        window.addEventListener('pageshow', () => {
            if (warningMessage) {
                warningMessage.style.display = 'none';
                warningMessage.setAttribute('aria-hidden', 'true');
            }
        });
    };

    const initializeElements = () => {
        warningMessage = document.getElementById(config.warningMessageId);
        leaveCounter = document.getElementById(config.leaveCounterId);
        consoleOutput = document.getElementById(config.consoleOutputId);

        if (warningMessage) {
            warningMessage.setAttribute('role', 'alert');
            warningMessage.setAttribute('aria-hidden', 'true');
        }

        if (leaveCounter) {
            leaveCounter.setAttribute('role', 'status');
        }
    };

    const initialize = (userConfig = {}) => {
        config = { ...defaultConfig, ...userConfig };
        initializeElements();
        addEventListeners();
        
        const fingerprint = getFingerprint();
        leaveCount = parseInt(safelyGetStorageItem(`${config.storageKey}-${fingerprint}`)) || 0;
        
        updateLeaveCounter();
        debug(`initialized || with hash: ${fingerprint}`);
    };
    
    // Public API
    window.pageExitDetector = {
        init: initialize,
        resetCounter: () => {
            leaveCount = 0;
            safelySetStorageItem(config.storageKey, leaveCount);
            updateLeaveCounter();
            debug('Counter reset');
        },
        getLeaveCount: () => leaveCount,
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