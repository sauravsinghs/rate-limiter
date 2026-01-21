/**
 * Load Testing Script for Rate Limiter
 * 
 * Usage:
 *   node backend/load-test.js [options]
 * 
 * Options:
 *   --users=N      Number of virtual users (default: 10)
 *   --duration=N   Test duration in seconds (default: 30)
 *   --rate=N       Requests per second per user (default: 2)
 *   --url=URL      Backend URL (default: http://localhost:3001)
 * 
 * Example:
 *   node backend/load-test.js --users=20 --duration=60 --rate=5
 */

const API_URL = process.env.API_URL || 'http://localhost:3001';
const ENDPOINT = `${API_URL}/api/test`;

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  users: 10,
  duration: 30,
  rate: 2,
  url: API_URL
};

args.forEach(arg => {
  if (arg.startsWith('--users=')) {
    options.users = parseInt(arg.split('=')[1]);
  } else if (arg.startsWith('--duration=')) {
    options.duration = parseInt(arg.split('=')[1]);
  } else if (arg.startsWith('--rate=')) {
    options.rate = parseFloat(arg.split('=')[1]);
  } else if (arg.startsWith('--url=')) {
    options.url = arg.split('=')[1];
  }
});

const stats = {
  total: 0,
  allowed: 0,
  blocked: 0,
  errors: 0,
  startTime: Date.now()
};

async function sendRequest() {
  try {
    const response = await fetch(`${options.url}/api/test`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });

    stats.total++;
    
    if (response.status === 200) {
      stats.allowed++;
    } else if (response.status === 429) {
      stats.blocked++;
    } else {
      stats.errors++;
    }
  } catch (error) {
    stats.total++;
    stats.errors++;
  }
}

function runUser(userId) {
  const interval = 1000 / options.rate; // milliseconds between requests
  const endTime = Date.now() + (options.duration * 1000);
  
  const userLoop = () => {
    if (Date.now() >= endTime) {
      return;
    }
    
    sendRequest();
    setTimeout(userLoop, interval);
  };
  
  userLoop();
}

function printStats() {
  const elapsed = ((Date.now() - stats.startTime) / 1000).toFixed(1);
  const rps = (stats.total / elapsed).toFixed(2);
  const successRate = stats.total > 0 ? ((stats.allowed / stats.total) * 100).toFixed(2) : 0;
  
  console.log('\n📊 Load Test Statistics:');
  console.log(`   Duration: ${elapsed}s`);
  console.log(`   Total Requests: ${stats.total}`);
  console.log(`   ✅ Allowed: ${stats.allowed} (${successRate}%)`);
  console.log(`   ❌ Blocked: ${stats.blocked}`);
  console.log(`   ⚠️  Errors: ${stats.errors}`);
  console.log(`   📈 Requests/sec: ${rps}`);
}

// Start load test
console.log(`🚀 Starting load test:`);
console.log(`   Users: ${options.users}`);
console.log(`   Duration: ${options.duration}s`);
console.log(`   Rate: ${options.rate} req/s per user`);
console.log(`   Target: ${options.url}\n`);

// Start all users
for (let i = 0; i < options.users; i++) {
  setTimeout(() => runUser(i), i * 100); // Stagger user starts
}

// Print stats periodically
const statsInterval = setInterval(printStats, 5000);

// Stop after duration
setTimeout(() => {
  clearInterval(statsInterval);
  printStats();
  console.log('\n✅ Load test completed!\n');
  process.exit(0);
}, options.duration * 1000);
