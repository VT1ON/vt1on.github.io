import common from './function/common.js';
// import ops from './ops.js';

// Precomputed constants
const K = [0x5A827999, 0x6ED9EBA1, 0x8F1BBCDC, 0xCA62C1D6];

// Optimized rotation function
function uint32_lrot(n, d) {
    return (n << d) | (n >>> (32 - d));
}

// SHA1 hashing function
export function sha1(message) {
    // Convert string to UTF-8 encoded array of bytes
    let bytes = new TextEncoder().encode(message);

    // Pre-processing: append padding bits and length
    const bits = bytes.length * 8;
    const newBytes = new Uint8Array(bytes.length + 9 + (64 - ((bytes.length + 9) % 64)));
    newBytes.set(bytes);
    newBytes[bytes.length] = 0x80; // Append 1 followed by zeros

    // Append original length in bits as big-endian 64-bit integer
    const lenBytes = new Uint8Array(8);
    for (let i = 0; i < 8; i++) {
        lenBytes[7 - i] = (bits >>> (i * 8)) & 0xFF;
    }
    newBytes.set(lenBytes, newBytes.length - 8);

    bytes = newBytes;

    // Initialize hash values (h0 - h4)
    let h0 = 0x67452301, h1 = 0xEFCDAB89, h2 = 0x98BADCFE, h3 = 0x10325476, h4 = 0xC3D2E1F0;

    // Process the message in 512-bit chunks
    for (let i = 0; i < bytes.length; i += 64) {
        const w = new Uint32Array(80);

        // Break chunk into sixteen 32-bit big-endian words
        for (let j = 0; j < 16; j++) {
            w[j] = common.bytesToUint32(bytes[i + j * 4], bytes[i + j * 4 + 1], bytes[i + j * 4 + 2], bytes[i + j * 4 + 3]);
        }

        // Extend the sixteen 32-bit words into eighty 32-bit words
        for (let j = 16; j < 80; j++) {
            w[j] = uint32_lrot(w[j - 3] ^ w[j - 8] ^ w[j - 14] ^ w[j - 16], 1);
        }

        // Initialize hash value for this chunk
        let a = h0, b = h1, c = h2, d = h3, e = h4;

        // Main loop with unrolling
        for (let j = 0; j < 80; j += 5) {
            for (let i = 0; i < 5; i++) {
                const j_i = j + i;
                let f;
                if (j_i < 20) {
                    f = (b & c) | ((~b) & d);
                } else if (j_i < 40) {
                    f = b ^ c ^ d;
                } else if (j_i < 60) {
                    f = (b & c) | (b & d) | (c & d);
                } else {
                    f = b ^ c ^ d;
                }

                const temp = (uint32_lrot(a, 5) + f + e + K[Math.floor(j_i / 20)] + w[j_i]) >>> 0;
                e = d;
                d = c;
                c = uint32_lrot(b, 30);
                b = a;
                a = temp;
            }
        }

        // Add this chunk's hash to result
        h0 = (h0 + a) >>> 0;
        h1 = (h1 + b) >>> 0;
        h2 = (h2 + c) >>> 0;
        h3 = (h3 + d) >>> 0;
        h4 = (h4 + e) >>> 0;
    }

    // Produce the final hash value as a 160-bit number in hex format
    return [h0, h1, h2, h3, h4].map(h => h.toString(16).padStart(8, '0')).join('');
}

export default common;

// Consolidated Fingerprinting function
export function getFingerprint() {
    const storageKey = 'deviceFingerprint';
    
    // Check if fingerprint already exists in localStorage
    try {
        const storedFingerprint = localStorage.getItem(storageKey);
        if (storedFingerprint) {
            return storedFingerprint;
        }
    } catch (e) {
        console.warn('Unable to access localStorage:', e);
    }

    const components = [];

    // Screen Info
    const getStableScreenInfo = () => {
        const ratio = window.devicePixelRatio || 1;
        return `${screen.width * ratio}x${screen.height * ratio}`;
    };
    
    // Browser and OS Info
    const getStableBrowserInfo = () => {
        const ua = navigator.userAgent;
        const getBrowserName = (ua) => {
            if (ua.includes("Firefox")) return "Firefox";
            if (ua.includes("Chrome")) return "Chrome";
            if (ua.includes("Safari")) return "Safari";
            if (ua.includes("Edge")) return "Edge";
            if (ua.includes("Opera")) return "Opera";
            return "Unknown";
        };
        const getOSName = (ua) => {
            if (ua.includes("Win")) return "Windows";
            if (ua.includes("Mac")) return "MacOS";
            if (ua.includes("Linux")) return "Linux";
            if (ua.includes("Android")) return "Android";
            if (ua.includes("iOS")) return "iOS";
            return "Unknown";
        };
        return `${getBrowserName(ua)}|${getOSName(ua)}`;
    };
    
    // Hardware Info
    const getHardwareInfo = () => {
        return `${navigator.hardwareConcurrency || 'unknown'}|${navigator.deviceMemory || 'unknown'}`;
    };
    
    // Font List
    const getFontList = () => {
        const fonts = [
            'Arial', 'Helvetica', 'Times New Roman', 'Courier', 'Verdana', 'Georgia', 'Palatino', 'Garamond', 'Bookman',
            'Comic Sans MS', 'Trebuchet MS', 'Arial Black', 'Impact'
        ];
        return fonts.filter(font => document.fonts.check(`12px "${font}"`)).join(',');
    };
    
    // Canvas Fingerprint
    const getCanvasFingerprint = () => {
        try {
            const canvas = document.createElement('canvas');
            const ctx = canvas.getContext('2d');
            canvas.width = 200;
            canvas.height = 50;

            ctx.font = '14px Arial';
            ctx.fillText('Fingerprint', 10, 25);
            ctx.fillStyle = 'rgb(255,0,255)';
            ctx.fillRect(100, 5, 80, 40);
            
            return canvas.toDataURL();
        } catch (e) {
            console.warn('Canvas fingerprinting not supported:', e);
            return 'canvas-unsupported';
        }
    };
    
    // Audio Fingerprint
    const getAudioFingerprint = () => {
        try {
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            const oscillator = audioContext.createOscillator();
            const analyser = audioContext.createAnalyser();
            const gainNode = audioContext.createGain();
            const scriptProcessor = audioContext.createScriptProcessor(4096, 1, 1);
            
            gainNode.gain.value = 0;
            oscillator.type = 'triangle';
            oscillator.connect(analyser);
            analyser.connect(scriptProcessor);
            scriptProcessor.connect(gainNode);
            gainNode.connect(audioContext.destination);

            oscillator.start(0);

            const audioData = new Float32Array(analyser.frequencyBinCount);
            analyser.getFloatFrequencyData(audioData);

            oscillator.stop();
            audioContext.close();

            return audioData.slice(0, 5).join(',');
        } catch (e) {
            console.warn('Audio fingerprinting not supported:', e);
            return 'audio-unsupported';
        }
    };

    components.push(getCanvasFingerprint());
    components.push(getAudioFingerprint());
    components.push(getStableScreenInfo());
    components.push(getHardwareInfo());
    components.push(getStableBrowserInfo());
    components.push(getFontList());

    // Combine all components and hash
    const fingerprint = sha1(components.join('|'));
    
    // Store the fingerprint in localStorage
    try {
        localStorage.setItem(storageKey, fingerprint);
    } catch (e) {
        console.warn('Failed to store fingerprint in localStorage:', e);
    }

    return fingerprint;
}

// Time-safe string comparison (to prevent timing attacks)
export function safeCompare(a, b) {
    if (typeof a !== 'string' || typeof b !== 'string') {
        return false;
    }

    if (a.length !== b.length) {
        return false;
    }

    let result = 0;
    for (let i = 0; i < a.length; i++) {
        result |= a.charCodeAt(i) ^ b.charCodeAt(i);
    }

    return result === 0;
}

// Generate a secure random string
export function generateSecureToken(length = 32) {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

// HMAC-SHA1 implementation
export function hmacSha1(key, message) {
    const blockSize = 64; // SHA1 block size

    if (key.length > blockSize) {
        key = sha1(key);
    }

    key = key.padEnd(blockSize, '\0');

    const outerPadding = key.split('').map(c => c.charCodeAt(0) ^ 0x5c).map(c => String.fromCharCode(c)).join('');
    const innerPadding = key.split('').map(c => c.charCodeAt(0) ^ 0x36).map(c => String.fromCharCode(c)).join('');

    return sha1(outerPadding + sha1(innerPadding + message));
}