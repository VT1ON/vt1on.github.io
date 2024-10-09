'use strict';

/**
    Debug function
    This function displays a debug message with a specific type on the web page.
    @param {string} message - The message to be displayed.
    @param {string} [type='info'] - The type of message ('info', 'error', 'warning', etc.).
*/

export const debug = (message, type = 'info') => {
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
    if (consoleOutput) {
        consoleOutput.appendChild(outputLine);
        consoleOutput.scrollTop = consoleOutput.scrollHeight;
    } else {
        return null;
    }

    setTimeout(() => {
        outputLine.classList.add('new');
        setTimeout(() => {
            outputLine.classList.remove('new');
        }, 2500);
    });
};