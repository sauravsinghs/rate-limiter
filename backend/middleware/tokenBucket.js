/**
 * Token Bucket Algorithm Implementation
 *
 * Used by: AWS API Gateway, Google Cloud Endpoints, Uber, Rapido…
 *
 * 1. Bucket has a maximum capacity (e.g., 10 tokens)
 * 2. Tokens refill at a constant rate (e.g., 1 token/second)
 * 3. Each request consumes tokensPerRequest tokens
 * 4. If bucket is empty, request is rejected (429)
 */

export class TokenBucket {
  /**
   * @param {Object} opts
   * @param {number} opts.capacity       – max tokens the bucket can hold
   * @param {number} opts.refillRate     – tokens added per second
   * @param {number} [opts.tokensPerRequest=1] – tokens consumed per request
   */
  constructor({ capacity, refillRate, tokensPerRequest = 1 }) {
    this.capacity = capacity;
    this.refillRate = refillRate;
    this.tokensPerRequest = tokensPerRequest;
    this.tokens = capacity;
    this.lastRefill = Date.now();
  }

  tryConsume(cost) {
    const c = cost ?? this.tokensPerRequest;
    this._refill();

    if (this.tokens >= c) {
      this.tokens -= c;
      return { allowed: true, tokensRemaining: Math.floor(this.tokens), retryAfter: null };
    }
    const timeUntilToken = ((c - this.tokens) / this.refillRate) * 1000;
    return {
      allowed: false,
      tokensRemaining: 0,
      retryAfter: Math.ceil(timeUntilToken / 1000),
    };
  }

  _refill() {
    const now = Date.now();
    const elapsed = (now - this.lastRefill) / 1000;
    this.tokens = Math.min(this.capacity, this.tokens + elapsed * this.refillRate);
    this.lastRefill = now;
  }

  getTokens()     { this._refill(); return Math.floor(this.tokens); }
  getCapacity()   { return this.capacity; }
  getRefillRate() { return this.refillRate; }

  reset() {
    this.tokens = this.capacity;
    this.lastRefill = Date.now();
  }

  updateConfig({ capacity, refillRate, tokensPerRequest }) {
    if (capacity !== undefined)        this.capacity = capacity;
    if (refillRate !== undefined)       this.refillRate = refillRate;
    if (tokensPerRequest !== undefined) this.tokensPerRequest = tokensPerRequest;
    this.tokens = Math.min(this.capacity, this.tokens);
  }

  getState() {
    this._refill();
    return {
      tokensLeft: Math.floor(this.tokens),
      capacity: this.capacity,
      refillRate: this.refillRate,
      tokensPerRequest: this.tokensPerRequest,
      lastRefillTime: this.lastRefill,
    };
  }
}

/* ================================================================
   Per-user token bucket manager (in-memory)
   ================================================================ */

export class UserBucketManager {
  constructor(defaults) {
    this.defaults = { capacity: 10, refillRate: 1, tokensPerRequest: 1, ...defaults };
    /** @type {Map<string, TokenBucket>} */
    this.buckets = new Map();
  }

  _getOrCreate(userId) {
    if (!this.buckets.has(userId)) {
      this.buckets.set(userId, new TokenBucket({ ...this.defaults }));
    }
    return this.buckets.get(userId);
  }

  tryConsume(userId, cost)  { return this._getOrCreate(userId).tryConsume(cost); }
  getState(userId)          { return this._getOrCreate(userId).getState(); }
  resetUser(userId)         { if (this.buckets.has(userId)) this.buckets.get(userId).reset(); }

  resetAll() { this.buckets.forEach(b => b.reset()); }

  updateConfig(newDefaults) {
    Object.assign(this.defaults, newDefaults);
    this.buckets.forEach(b => b.updateConfig(newDefaults));
  }

  getDefaults() { return { ...this.defaults }; }
}

/* ================================================================
   Redis-backed token bucket manager
   Atomic consume via Lua so refill+consume is a single round trip.
   ================================================================ */

export class RedisBucketManager {
  constructor(redisClient, defaults) {
    this.redis = redisClient;
    this.defaults = { capacity: 10, refillRate: 1, tokensPerRequest: 1, ...defaults };
    this.keyPrefix = 'rl:tb:';
  }

  _key(userId) { return `${this.keyPrefix}${userId}`; }

  async tryConsume(userId, cost) {
    const c = cost ?? this.defaults.tokensPerRequest;
    const key = this._key(userId);
    const now = Date.now();

    const lua = `
      local key       = KEYS[1]
      local capacity  = tonumber(ARGV[1])
      local refill    = tonumber(ARGV[2])
      local cost      = tonumber(ARGV[3])
      local now       = tonumber(ARGV[4])

      local data = redis.call('HMGET', key, 'tokens', 'lastRefill')
      local tokens     = tonumber(data[1]) or capacity
      local lastRefill = tonumber(data[2]) or now

      local elapsed = (now - lastRefill) / 1000
      tokens = math.min(capacity, tokens + elapsed * refill)

      local allowed = 0
      if tokens >= cost then
        tokens = tokens - cost
        allowed = 1
      end

      redis.call('HMSET', key, 'tokens', tokens, 'lastRefill', now)
      redis.call('EXPIRE', key, 3600)
      return {allowed, math.floor(tokens)}
    `;

    const [allowed, tokensLeft] = await this.redis.eval(
      lua, 1, key,
      this.defaults.capacity, this.defaults.refillRate, c, now
    );

    if (allowed === 1) {
      return { allowed: true, tokensRemaining: tokensLeft, retryAfter: null };
    }
    const retryAfter = Math.ceil((c - tokensLeft) / this.defaults.refillRate);
    return { allowed: false, tokensRemaining: tokensLeft, retryAfter };
  }

  async getState(userId) {
    const key = this._key(userId);
    const data = await this.redis.hgetall(key);
    const now = Date.now();
    let tokens = data.tokens !== undefined ? parseFloat(data.tokens) : this.defaults.capacity;
    let lastRefill = data.lastRefill !== undefined ? parseFloat(data.lastRefill) : now;
    const elapsed = (now - lastRefill) / 1000;
    tokens = Math.min(this.defaults.capacity, tokens + elapsed * this.defaults.refillRate);
    return {
      tokensLeft: Math.floor(tokens),
      capacity: this.defaults.capacity,
      refillRate: this.defaults.refillRate,
      tokensPerRequest: this.defaults.tokensPerRequest,
      lastRefillTime: lastRefill,
    };
  }

  async resetUser(userId) { await this.redis.del(this._key(userId)); }

  async resetAll() {
    const keys = await this.redis.keys(`${this.keyPrefix}*`);
    if (keys.length) await this.redis.del(...keys);
  }

  updateConfig(newDefaults) { Object.assign(this.defaults, newDefaults); }
  getDefaults() { return { ...this.defaults }; }
}
