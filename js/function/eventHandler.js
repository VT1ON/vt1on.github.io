'use strict';

import GarbageCollector from "./gc.js";

/**
 * EventHandler object for managing DOM event listeners with delegation and cleanup support.
 * This object simplifies event handling in web applications by providing methods to attach,
 * detach, and manage event listeners, supporting delegation and one-time execution.
 * 
 * Methods:
 * - on: Attach an event listener to a DOM element, with optional event delegation.
     * Attach an event listener to a DOM element, with optional event delegation.
     * @param {Element} element - The target element.
     * @param {string} eventType - The event type (e.g., 'click').
     * @param {string|Function} selectorOrHandler - CSS selector for delegation or the handler function.
     * @param {Function|Object} handlerOrOptions - The event handler if selector is used, or options.
     * @param {Object} [options] - Optional parameters for event listener (e.g., { once: true }).
     * @returns {Element} - The element, for chaining.
 * - off: Detach an event listener from a DOM element.
     * Detach an event listener from a DOM element.
     * @param {Element} element - The target element.
     * @param {string} eventType - The event type (e.g., 'click').
     * @param {Function} handler - The event handler to remove.
     * @returns {Element} - The element, for chaining.
 * - once: Attach a one-time event listener that removes itself after execution.
     * @param {Element} element - The target element.
     * @param {string} eventType - The event type (e.g., 'click').
     * @param {string|Function} selectorOrHandler - CSS selector or handler function.
     * @param {Function|Object} handlerOrOptions - The event handler or options.
     * @param {Object} [options] - Optional listener options.
     * @returns {Element} - The element, for chaining.
 * - onMultiple: Attach multiple event listeners at once.
     * Attach multiple event listeners at once.
     * @param {Element} element - The target element.
     * @param {string} events - Space-separated list of event types (e.g., 'click hover').
     * @param {string|Function} selectorOrHandler - CSS selector or handler function.
     * @param {Function|Object} handlerOrOptions - The event handler or options.
     * @param {Object} [options] - Optional listener options.
     * @returns {Element} - The element, for chaining.
 */

// const eventHandlers = new WeakMap();
// const eventHandler = {
//     on: (element, eventType, selectorOrHandler, handlerOrOptions, options) => {
//         let handler, selector;
    
//         if (typeof selectorOrHandler === 'function') {
//             handler = selectorOrHandler;
//             options = handlerOrOptions;
//         } else {
//             selector = selectorOrHandler;
//             handler = handlerOrOptions;
//         }
    
//         const wrappedHandler = selector ? createDelegatedHandler(selector, handler) : handler;
    
//         if (!eventHandlers.has(element)) {
//             eventHandlers.set(element, new Map());
//         }
//         const elementHandlers = eventHandlers.get(element);
//         if (!elementHandlers.has(eventType)) {
//             elementHandlers.set(eventType, new Set());
//         }
//         elementHandlers.get(eventType).add(wrappedHandler);
    
//         element.addEventListener(eventType, wrappedHandler, options);
//         return element;
//     },
//     off: (element, eventType, handler) => {
//         if (!eventHandlers.has(element)) return element;
//         const elementHandlers = eventHandlers.get(element);
//         if (!elementHandlers.has(eventType)) return element;
    
//         const handlers = elementHandlers.get(eventType);
//         handlers.delete(handler);
//         element.removeEventListener(eventType, handler);
    
//         if (handlers.size === 0) {
//             elementHandlers.delete(eventType);
//         }
//         if (elementHandlers.size === 0) {
//             eventHandlers.delete(element);
//         }
//         return element;
//     },
//     once: (element, eventType, selectorOrHandler, handlerOrOptions, options) => {
//         const onceHandler = (...args) => {
//             off(element, eventType, onceHandler);
//             (typeof selectorOrHandler === 'function' ? selectorOrHandler : handlerOrOptions).apply(this, args);
//         };
//         return on(element, eventType, selectorOrHandler, onceHandler, options);
//     },
//     onMultiple: (element, events, selectorOrHandler, handlerOrOptions, options) => {
//         events.split(' ').forEach(eventType => 
//             eventHandler.on(element, eventType, selectorOrHandler, handlerOrOptions, options)
//         );
//         return element;
//     },
// }

// function createDelegatedHandler(selector, handler) {
//     return function (event) {
//         let el = event.target;
//         do {
//             if (el.matches(selector)) {
//                 handler.call(el, event);
//                 return;
//             }
//             el = el.parentElement;
//         } while (el && el !== event.currentTarget);
//     };
// }

// export default eventHandler;

class EventHandler {
    constructor() {
        this.gc = new GarbageCollector();
        this.eventHandlers = new WeakMap();
    }

    on(element, eventType, selectorOrHandler, handlerOrOptions, options) {
        let handler, selector;

        if (typeof selectorOrHandler === 'function') {
            handler = selectorOrHandler;
            options = handlerOrOptions;
        } else {
            selector = selectorOrHandler;
            handler = handlerOrOptions;
        }

        const wrappedHandler = selector ? this.createDelegatedHandler(selector, handler) : handler;

        if (!this.eventHandlers.has(element)) {
            this.eventHandlers.set(element, new Map());
        }
        const elementHandlers = this.eventHandlers.get(element);
        if (!elementHandlers.has(eventType)) {
            elementHandlers.set(eventType, new Set());
        }
        elementHandlers.get(eventType).add(wrappedHandler);
        element.addEventListener(eventType, wrappedHandler, options);

        // Track the element and its handlers with the garbage collector
        this.gc.track(element, { eventType, handler: wrappedHandler }, (obj) => {
            this.off(obj, eventType, wrappedHandler);
        });
        return element;
    }

    off(element, eventType, handler) {
        if (!this.eventHandlers.has(element)) return element;
        const elementHandlers = this.eventHandlers.get(element);
        if (!elementHandlers.has(eventType)) return element;

        const handlers = elementHandlers.get(eventType);
        handlers.delete(handler);
        element.removeEventListener(eventType, handler);

        if (handlers.size === 0) {
            elementHandlers.delete(eventType);
        }
        if (elementHandlers.size === 0) {
            this.eventHandlers.delete(element);
        }

        // Untrack the element from the garbage collector
        this.gc.untrack(element);

        return element;
    }

    once(element, eventType, selectorOrHandler, handlerOrOptions, options) {
        const onceHandler = (...args) => {
            this.off(element, eventType, onceHandler);
            (typeof selectorOrHandler === 'function' ? selectorOrHandler : handlerOrOptions).apply(this, args);
        };
        return this.on(element, eventType, selectorOrHandler, onceHandler, options);
    }

    onMultiple(element, events, selectorOrHandler, handlerOrOptions, options) {
        events.split(' ').forEach(eventType => 
            this.on(element, eventType, selectorOrHandler, handlerOrOptions, options)
        );
        return element;
    }

    createDelegatedHandler(selector, handler) {
        return function (event) {
            let el = event.target;
            do {
                if (el.matches(selector)) {
                    handler.call(el, event);
                    return;
                }
                el = el.parentElement;
            } while (el && el !== event.currentTarget);
        };
    }

    cleanup(maxAge) {
        return this.gc.cleanup(maxAge);
    }

    dispose() {
        this.gc.dispose();
        this.eventHandlers = new WeakMap();
    }
}

export default new EventHandler();