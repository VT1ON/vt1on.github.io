// garbageCollector.js

export default class GarbageCollector {
    constructor() {
        this.references = new WeakMap();
        this.cleanupCallbacks = new WeakMap();
        this.intervalId = null;
        this.autoCleanupInterval = 60000;
    }

    track(object, metadata = {}, cleanupCallback = null) {
        if (typeof object !== 'object' || object === null) {
            throw new TypeError('Only objects can be tracked');
        }

        this.references.set(object, {
            metadata,
            createdAt: Date.now()
        });

        if (typeof cleanupCallback === 'function') {
            this.cleanupCallbacks.set(object, cleanupCallback);
        }

        this.startAutoCleanup();
        return object;
    }

    untrack(object) {
        if (this.references.has(object)) {
            this.executeCleanup(object);
            this.references.delete(object);
            this.cleanupCallbacks.delete(object);
            return true;
        }
        return false;
    }

    getMetadata(object) {
        return this.references.get(object)?.metadata;
    }

    cleanup(maxAge = Infinity) {
        const now = Date.now();
        let cleanedCount = 0;
    
        const objectsToCheck = this.trackedObjects || [];
        const remainingObjects = [];
    
        for (const object of objectsToCheck) {
            const value = this.references.get(object);
            if (value) {
                if (now - value.createdAt > maxAge) {
                    this.executeCleanup(object);
                    cleanedCount++;
                } else {
                    remainingObjects.push(object);
                }
            }
        }
    
        this.trackedObjects = remainingObjects;
        return cleanedCount;
    }
    

    executeCleanup(object) {
        const callback = this.cleanupCallbacks.get(object);
        if (callback) {
            try {
                callback(object);
            } catch (error) {
                console.error('Error during cleanup callback:', error);
            }
        }
        this.untrack(object);
    }

    startAutoCleanup() {
        if (!this.intervalId) {
            this.intervalId = setInterval(() => {
                this.cleanup(this.autoCleanupInterval);
            }, this.autoCleanupInterval);
        }
    }

    stopAutoCleanup() {
        if (this.intervalId) {
            clearInterval(this.intervalId);
            this.intervalId = null;
        }
    }

    dispose() {
        this.stopAutoCleanup();
        this.cleanup(0);
        this.references = new WeakMap();
        this.cleanupCallbacks = new WeakMap();
    }
}