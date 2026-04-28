/**
 * Leaky Bucket Algorithm Implementation
 *
 * Requests are poured into a bucket (queue) with fixed capacity.
 * The bucket leaks at a constant rate, which smooths bursty traffic.
 */
export class LeakyBucket {
  constructor({ capacity = 10, leakRate = 1 }) {
    this.capacity = capacity;
    this.leakRate = leakRate; // requests drained per second
    this.level = 0; // queued requests (can be fractional due to timed leaking)
    this.lastLeak = Date.now();
  }

  _leak(now = Date.now()) {
    const elapsedSeconds = (now - this.lastLeak) / 1000;
    const leaked = elapsedSeconds * this.leakRate;
    this.level = Math.max(0, this.level - leaked);
    this.lastLeak = now;
  }

  tryConsume(cost = 1) {
    this._leak();

    if (this.level + cost <= this.capacity) {
      this.level += cost;
      return {
        allowed: true,
        currentLevel: this.getCurrentLevel(),
        queueRemaining: Math.max(0, Math.floor(this.capacity - this.level)),
        retryAfter: null,
      };
    }

    const overflow = this.level + cost - this.capacity;
    const retryAfterSeconds = Math.max(1, Math.ceil(overflow / this.leakRate));

    return {
      allowed: false,
      currentLevel: this.getCurrentLevel(),
      queueRemaining: 0,
      retryAfter: retryAfterSeconds,
    };
  }

  getCurrentLevel() {
    this._leak();
    return Math.max(0, Math.ceil(this.level));
  }

  getCapacity() {
    return this.capacity;
  }

  getLeakRate() {
    return this.leakRate;
  }

  getStats() {
    const currentLevel = this.getCurrentLevel();
    return {
      currentLevel,
      capacity: this.capacity,
      leakRate: this.leakRate,
      queueRemaining: Math.max(0, this.capacity - currentLevel),
      utilization: ((currentLevel / this.capacity) * 100).toFixed(2),
    };
  }

  reset() {
    this.level = 0;
    this.lastLeak = Date.now();
  }

  updateConfig({ capacity, leakRate }) {
    if (capacity !== undefined) {
      const nextCapacity = Number(capacity);
      if (Number.isFinite(nextCapacity) && nextCapacity > 0) {
        this.capacity = nextCapacity;
        this.level = Math.min(this.level, this.capacity);
      }
    }

    if (leakRate !== undefined) {
      const nextLeakRate = Number(leakRate);
      if (Number.isFinite(nextLeakRate) && nextLeakRate > 0) {
        this.leakRate = nextLeakRate;
      }
    }
  }
}
