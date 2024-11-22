import { debug } from "./debug.js";
import { debounce } from "./debounce.js";
import eventHandler from "./eventHandler.js";

function detectScreenSize() {    
    return {
        width: screen.width,
        height: screen.height,
        availWidth: screen.availWidth,
        availHeight: screen.availHeight,
        logicalWidth: window.innerWidth,
        logicalHeight: window.innerHeight,
    };
}

function displayScreenInfo(screenInfo) {    
    const infoString = Object.entries(screenInfo)
        .map(([key, value]) => `${key}: ${value}`)
        .join('\n');
    
    debug(infoString);
}

let previousScreenSize = detectScreenSize();

export const checkScreenSizeChange = () => {
    const currentScreenSize = detectScreenSize();
    
    if (JSON.stringify(currentScreenSize) !== JSON.stringify(previousScreenSize)) {
        displayScreenInfo(currentScreenSize);
        previousScreenSize = currentScreenSize;
    }
}

eventHandler.on(window, 'resize', () => {
    debounce(checkScreenSizeChange(), 100);
});