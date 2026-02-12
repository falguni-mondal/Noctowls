/**
 * User Limiter
 * Limits requests per user (based on IP) to a specific count within a time window.
 * - Rejects requests immediately if the limit is exceeded.
 * - Uses a Map to store { count, startTime } for each active IP.
 */

class UserLimiter {
    /**
     * @param {number} maxRequests - Max requests allowed (e.g., 40)
     * @param {number} windowMs - Time window in milliseconds (e.g., 10000 for 10s)
     */
    constructor(maxRequests, windowMs) {
        this.maxRequests = maxRequests;
        this.windowMs = windowMs;
        this.hits = new Map(); // Stores IP -> { count, startTime }
    }

    /**
     * Checks if the request is allowed for the given key (IP).
     * @param {string} key - Unique identifier (IP address)
     * @returns {boolean} - true if allowed, false if limit exceeded
     */
    check(key) {
        const now = Date.now();
        const record = this.hits.get(key);

        // 1. New User: Create record
        if (!record) {
            this.hits.set(key, { count: 1, startTime: now });
            return true;
        }

        // 2. Window Expired: Reset count for this user
        if (now - record.startTime > this.windowMs) {
            record.count = 1;
            record.startTime = now;
            return true;
        }

        // 3. Increment Count
        if (record.count < this.maxRequests) {
            record.count++;
            return true;
        }

        // 4. Limit Exceeded
        return false;
    }

    /**
     * Cleanup method to remove stale records and free up memory.
     * Can be called periodically by the server.
     */
    cleanup() {
        const now = Date.now();
        for (const [key, record] of this.hits.entries()) {
            if (now - record.startTime > this.windowMs) {
                this.hits.delete(key);
            }
        }
    }
}

export default UserLimiter;