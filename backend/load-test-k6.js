/**
 * k6 Load Testing Script
 * 
 * Install k6: https://k6.io/docs/getting-started/installation/
 * 
 * Run:
 *   k6 run backend/load-test-k6.js
 * 
 * With options:
 *   k6 run --vus 20 --duration 60s backend/load-test-k6.js
 */

import { check, sleep } from 'k6';
import http from 'k6/http';
import { Rate, Trend } from 'k6/metrics';

// Custom metrics
const allowedRate = new Rate('allowed_requests');
const blockedRate = new Rate('blocked_requests');
const responseTime = new Trend('response_time');

// Test configuration
export const options = {
  stages: [
    { duration: '10s', target: 5 },   // Ramp up to 5 users
    { duration: '30s', target: 10 },  // Ramp up to 10 users
    { duration: '20s', target: 20 },   // Spike to 20 users
    { duration: '30s', target: 10 },   // Scale down to 10 users
    { duration: '10s', target: 0 },    // Ramp down to 0
  ],
  thresholds: {
    'http_req_duration': ['p(95)<500'], // 95% of requests should be below 500ms
    'allowed_requests': ['rate>0.5'],   // At least 50% requests should be allowed
  },
};

const BASE_URL = __ENV.API_URL || 'http://localhost:3001';

export default function () {
  const response = http.post(`${BASE_URL}/api/test`, null, {
    headers: { 'Content-Type': 'application/json' },
  });

  const duration = response.timings.duration;
  responseTime.add(duration);

  const isAllowed = check(response, {
    'status is 200': (r) => r.status === 200,
  });

  const isBlocked = check(response, {
    'status is 429': (r) => r.status === 429,
  });

  allowedRate.add(isAllowed);
  blockedRate.add(isBlocked);

  // Simulate user think time
  sleep(0.5);
}

export function handleSummary(data) {
  return {
    'stdout': textSummary(data, { indent: ' ', enableColors: true }),
  };
}

function textSummary(data, options) {
  const indent = options.indent || '';
  const allowed = data.metrics.allowed_requests?.values?.rate || 0;
  const blocked = data.metrics.blocked_requests?.values?.rate || 0;
  
  return `
${indent}Rate Limiter Load Test Results
${indent}===============================
${indent}Total Requests: ${data.metrics.http_reqs?.values?.count || 0}
${indent}Allowed Rate: ${(allowed * 100).toFixed(2)}%
${indent}Blocked Rate: ${(blocked * 100).toFixed(2)}%
${indent}Avg Response Time: ${data.metrics.http_req_duration?.values?.avg?.toFixed(2) || 0}ms
${indent}P95 Response Time: ${data.metrics.http_req_duration?.values?.['p(95)']?.toFixed(2) || 0}ms
  `;
}
