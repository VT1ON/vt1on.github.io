'use strict';

/**
 * Debounce a function to limit its execution rate.
 * 
 * @param {Function} func The function to be debounced.
 * @param {Number} delay The time in milliseconds to wait before calling the debounced function.
 * @returns {Function} A new debounced function.
 */

export const debounce = (func, delay) => {
    let timeoutId;
    return function debounced(...args) {
        clearTimeout(timeoutId);
        timeoutId = setTimeout(() => {
            func.apply(this, args);
        }, delay);
    };
};