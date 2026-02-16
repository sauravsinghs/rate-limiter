/**
 * Unit tests for the Token Bucket middleware
 */
import { jest } from '@jest/globals';
import { TokenBucket, UserBucketManager } from '../middleware/tokenBucket.js';

describe('TokenBucket', () => {
  let bucket;

  beforeEach(() => {
    bucket = new TokenBucket({ capacity: 5, refillRate: 1, tokensPerRequest: 1 });
  });

  test('starts at full capacity', () => {
    expect(bucket.getTokens()).toBe(5);
    expect(bucket.getCapacity()).toBe(5);
  });

  test('tryConsume removes one token by default', () => {
    const r = bucket.tryConsume();
    expect(r.allowed).toBe(true);
    expect(r.tokensRemaining).toBe(4);
  });

  test('tryConsume with custom cost', () => {
    const r = bucket.tryConsume(3);
    expect(r.allowed).toBe(true);
    expect(r.tokensRemaining).toBe(2);
  });

  test('returns blocked when tokens exhausted', () => {
    for (let i = 0; i < 5; i++) bucket.tryConsume();
    const r = bucket.tryConsume();
    expect(r.allowed).toBe(false);
    expect(r.tokensRemaining).toBe(0);
    expect(r.retryAfter).toBeGreaterThan(0);
  });

  test('tokens refill over time', async () => {
    for (let i = 0; i < 5; i++) bucket.tryConsume();
    expect(bucket.getTokens()).toBe(0);

    // Manually move lastRefill back by 3 seconds
    bucket.lastRefill = Date.now() - 3000;
    expect(bucket.getTokens()).toBe(3); // 3 tokens refilled at 1/sec
  });

  test('tokens do not exceed capacity', () => {
    bucket.lastRefill = Date.now() - 100000; // way in the past
    expect(bucket.getTokens()).toBe(5); // capped at capacity
  });

  test('reset restores full capacity', () => {
    for (let i = 0; i < 5; i++) bucket.tryConsume();
    bucket.reset();
    expect(bucket.getTokens()).toBe(5);
  });

  test('updateConfig changes parameters', () => {
    bucket.updateConfig({ capacity: 20, refillRate: 5, tokensPerRequest: 2 });
    expect(bucket.getCapacity()).toBe(20);
    expect(bucket.getRefillRate()).toBe(5);
    const state = bucket.getState();
    expect(state.tokensPerRequest).toBe(2);
  });

  test('getState returns full snapshot', () => {
    const state = bucket.getState();
    expect(state).toHaveProperty('tokensLeft');
    expect(state).toHaveProperty('capacity', 5);
    expect(state).toHaveProperty('refillRate', 1);
    expect(state).toHaveProperty('tokensPerRequest', 1);
    expect(state).toHaveProperty('lastRefillTime');
  });
});

describe('UserBucketManager', () => {
  let mgr;

  beforeEach(() => {
    mgr = new UserBucketManager({ capacity: 3, refillRate: 1, tokensPerRequest: 1 });
  });

  test('creates separate buckets per userId', () => {
    mgr.tryConsume('alice');
    mgr.tryConsume('alice');
    const aliceState = mgr.getState('alice');
    const bobState = mgr.getState('bob');
    expect(aliceState.tokensLeft).toBe(1);
    expect(bobState.tokensLeft).toBe(3); // bob untouched
  });

  test('blocks user when their bucket is exhausted', () => {
    mgr.tryConsume('alice');
    mgr.tryConsume('alice');
    mgr.tryConsume('alice');
    const r = mgr.tryConsume('alice');
    expect(r.allowed).toBe(false);
    // Bob should still be fine
    const rBob = mgr.tryConsume('bob');
    expect(rBob.allowed).toBe(true);
  });

  test('resetAll resets every user', () => {
    mgr.tryConsume('alice');
    mgr.tryConsume('bob');
    mgr.resetAll();
    expect(mgr.getState('alice').tokensLeft).toBe(3);
    expect(mgr.getState('bob').tokensLeft).toBe(3);
  });

  test('updateConfig propagates to all existing buckets', () => {
    mgr.tryConsume('alice'); // creates bucket
    mgr.updateConfig({ capacity: 10 });
    expect(mgr.getDefaults().capacity).toBe(10);
    const aliceState = mgr.getState('alice');
    expect(aliceState.capacity).toBe(10);
  });
});
