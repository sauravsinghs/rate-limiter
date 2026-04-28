/**
 * Token Bucket Algorithm Implementation
 * 
 * This is the core rate limiting algorithm used by systems like:
 * - AWS API Gateway
 * - Google Cloud Endpoints
 * - Uber's microservices
 * 
 * How it works:
 * 1. Bucket has a maximum capacity (e.g., 10 tokens)
 * 2. Tokens refill at a constant rate (e.g., 1 token/second)
 * 3. Each request consumes 1 token
 * 4. If bucket is empty, request is rejected (429)
 */

export class TokenBucket {
  constructor({ capacity, refillRate }) {
    this.capacity = capacity;
    this.refillRate = refillRate; // tokens per second
    this.tokens = capacity; // start with full bucket
    this.lastRefill = Date.now();
  }

  /**
   * Attempts to consume a token from the bucket
   * @returns {Object} { allowed: boolean, tokensRemaining: number, retryAfter?: number }
   */
  tryConsume() {
    this._refill();

    if (this.tokens >= 1) {
      this.tokens -= 1;
      return {
        allowed: true,
        tokensRemaining: this.tokens,
        retryAfter: null
      };
    } else {
      // Calculate when next token will be available
      const timeUntilNextToken = (1 / this.refillRate) * 1000; // milliseconds
      return {
        allowed: false,
        tokensRemaining: 0,
        retryAfter: Math.ceil(timeUntilNextToken / 1000) // seconds
      };
    }
  }

  /**
   * Refills tokens based on elapsed time
   * Private method called automatically
   */
  _refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000; // seconds
    const tokensToAdd = elapsed * this.refillRate;
    
    this.tokens = Math.min(this.capacity, this.tokens + tokensToAdd);
    this.lastRefill = now;
  }

  /**
   * Get current token count (refills first)
   */
  getTokens() {
    this._refill();
    return Math.floor(this.tokens);
  }

  /**
   * Get bucket capacity
   */
  getCapacity() {
    return this.capacity;
  }

  /**
   * Get refill rate
   */
  getRefillRate() {
    return this.refillRate;
  }

  /**
   * Reset bucket to full capacity (for testing)
   */
  reset() {
    this.tokens = this.capacity;
    this.lastRefill = Date.now();
  }

  /**
   * Update bucket parameters dynamically
   */
  updateConfig({ capacity, refillRate }) {
    if (capacity !== undefined) {
      const previousCapacity = this.capacity;
      const nextCapacity = Number(capacity);
      if (Number.isFinite(nextCapacity) && nextCapacity > 0) {
        this.capacity = nextCapacity;
        // Keep token ratio stable when capacity changes.
        const ratio = previousCapacity > 0 ? this.tokens / previousCapacity : 1;
        this.tokens = Math.min(this.capacity, Math.max(0, ratio * this.capacity));
      }
    }
    if (refillRate !== undefined) {
      const nextRefillRate = Number(refillRate);
      if (Number.isFinite(nextRefillRate) && nextRefillRate > 0) {
        this.refillRate = nextRefillRate;
      }
    }
  }
}
