/**
 * Sliding Window Counter Algorithm Implementation
 * 
 * An alternative rate limiting algorithm that counts requests within
 * a rolling time window. Unlike Token Bucket which allows bursts,
 * Sliding Window provides a smoother rate limit.
 * 
 * How it works:
 * 1. Define a time window (e.g., 10 seconds) and max requests per window
 * 2. Each request is timestamped and stored in a log
 * 3. On each request, expired entries (outside the window) are pruned
 * 4. If count within window < max, request is allowed; otherwise rejected
 * 
 * Use cases: GitHub API, Twitter API rate limiting
 */

export class SlidingWindowCounter {
    constructor({ windowSize = 10000, maxRequests = 10 }) {
        this.windowSize = windowSize; // milliseconds
        this.maxRequests = maxRequests;
        this.requestLog = []; // Array of timestamps
    }

    /**
     * Attempts to process a request
     * @returns {Object} { allowed, currentCount, windowRemaining, retryAfter }
     */
    tryConsume() {
        const now = Date.now();
        this._prune(now);

        if (this.requestLog.length < this.maxRequests) {
            this.requestLog.push(now);
            return {
                allowed: true,
                currentCount: this.requestLog.length,
                windowRemaining: this.maxRequests - this.requestLog.length,
                retryAfter: null
            };
        } else {
            // Calculate when the oldest request in window will expire
            const oldestInWindow = this.requestLog[0];
            const retryAfterMs = (oldestInWindow + this.windowSize) - now;
            return {
                allowed: false,
                currentCount: this.requestLog.length,
                windowRemaining: 0,
                retryAfter: Math.ceil(retryAfterMs / 1000) // seconds
            };
        }
    }

    /**
     * Remove timestamps outside the current window
     */
    _prune(now) {
        const windowStart = now - this.windowSize;
        this.requestLog = this.requestLog.filter(ts => ts > windowStart);
    }

    /**
     * Get current count within window
     */
    getCurrentCount() {
        this._prune(Date.now());
        return this.requestLog.length;
    }

    /**
     * Get max requests allowed per window
     */
    getMaxRequests() {
        return this.maxRequests;
    }

    /**
     * Get window size in milliseconds
     */
    getWindowSize() {
        return this.windowSize;
    }

    /**
     * Get stats for visualization
     */
    getStats() {
        this._prune(Date.now());
        return {
            currentCount: this.requestLog.length,
            maxRequests: this.maxRequests,
            windowSize: this.windowSize,
            windowRemaining: this.maxRequests - this.requestLog.length,
            utilization: ((this.requestLog.length / this.maxRequests) * 100).toFixed(2)
        };
    }

    /**
     * Reset for testing
     */
    reset() {
        this.requestLog = [];
    }
}
