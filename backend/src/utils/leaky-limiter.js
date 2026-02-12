/**
 * Leaky Limiter
 * Implements a Leaky Bucket algorithm to smooth out traffic.
 * * Logic:
 * - Processes requests at a constant rate (e.g., 50 reqs/sec = 1 req every 20ms).
 * - If the buffer (queue) is empty, the request executes immediately.
 * - If requests arrive faster than the processing rate, they join the queue.
 * - They are never rejected, just delayed.
 */

class LeakyLimiter {
    /**
     * @param {number} ratePerSecond - Maximum requests allowed per second (e.g., 50)
     */
    constructor(ratePerSecond) {
        this.ratePerSecond = ratePerSecond;
        this.interval = 1000 / ratePerSecond; // Time window per request in ms
        this.queue = [];
        this.isProcessing = false;
    }

    /**
     * The main entry point. Call this function to delay execution
     * until the "bucket" drips a slot for you.
     * * @returns {Promise<void>} Resolves when it is the request's turn.
     */
    async wait() {
        return new Promise((resolve) => {
            this.queue.push(resolve);
            this.processQueue();
        });
    }

    /**
     * Internal method to drive the leaky bucket loop.
     * It ensures only one item is processed per interval.
     */
    processQueue() {
        // If the loop is already active, do nothing. It will pick up the new item naturally.
        if (this.isProcessing) return;

        if (this.queue.length > 0) {
            this.isProcessing = true;

            // Release the next request in line
            const resolveNext = this.queue.shift();
            resolveNext();

            // Schedule the next drip after the fixed interval
            setTimeout(() => {
                this.isProcessing = false;
                // Recursive call to check if more items arrived while waiting
                this.processQueue();
            }, this.interval);
        }
    }

    /**
     * Helper: Get current queue length (useful for monitoring load)
     */
    getPendingCount() {
        return this.queue.length;
    }
}

export default LeakyLimiter;