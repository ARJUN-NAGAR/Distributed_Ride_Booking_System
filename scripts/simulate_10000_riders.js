const http = require('http');

// Configuration
const TARGET_HOST = 'localhost';
const TARGET_PORT = 8080; // API Gateway
const TARGET_PATH = '/api/v1/rides';
const TOTAL_REQUESTS = 10000;
const CONCURRENCY_BATCH_SIZE = 500; // Send in batches to avoid local Node.js socket exhaustion
const BATCH_DELAY_MS = 250; // 500 requests every 250ms = 2000 TPS = 10,000 in 5 seconds

console.log(`🚀 Starting 10,000 Rider Simulation against http://${TARGET_HOST}:${TARGET_PORT}${TARGET_PATH}`);
console.log(`⚠️ Expected duration: ~5 seconds. Watch the API Gateway and MySQL metrics...`);

let successCount = 0;
let errorCount = 0;
let rateLimitedCount = 0;

const agent = new http.Agent({ keepAlive: true, maxSockets: 1000 });

function sendRideRequest(passengerId) {
  return new Promise((resolve) => {
    // Randomize coordinates slightly around a city center
    const lat = 40.7128 + (Math.random() - 0.5) * 0.1;
    const lng = -74.0060 + (Math.random() - 0.5) * 0.1;

    const payload = JSON.stringify({
      passengerId: `sim_rider_${passengerId}`,
      pickupLatitude: lat,
      pickupLongitude: lng,
      dropLatitude: lat + 0.05,
      dropLongitude: lng + 0.05
    });

    const options = {
      hostname: TARGET_HOST,
      port: TARGET_PORT,
      path: TARGET_PATH,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
        'X-Session-ID': `session_${passengerId}` // Unique session bypasses IP rate limit
      },
      agent: agent
    };

    const req = http.request(options, (res) => {
      let data = '';
      res.on('data', chunk => { data += chunk; });
      res.on('end', () => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          successCount++;
        } else if (res.statusCode === 429) {
          rateLimitedCount++;
        } else {
          errorCount++;
        }
        resolve();
      });
    });

    req.on('error', (e) => {
      errorCount++;
      resolve();
    });

    req.write(payload);
    req.end();
  });
}

async function runSimulation() {
  const startTime = Date.now();
  let currentId = 1;

  while (currentId <= TOTAL_REQUESTS) {
    const batch = [];
    for (let i = 0; i < CONCURRENCY_BATCH_SIZE && currentId <= TOTAL_REQUESTS; i++) {
      batch.push(sendRideRequest(currentId));
      currentId++;
    }

    await Promise.all(batch);
    
    // Artificial delay to spread 10k requests over ~5 seconds (2000 TPS)
    await new Promise(resolve => setTimeout(resolve, BATCH_DELAY_MS));
  }

  const duration = (Date.now() - startTime) / 1000;
  console.log(`\n🏁 Simulation Complete in ${duration.toFixed(2)} seconds!`);
  console.log(`✅ Successful Ride Bookings: ${successCount}`);
  console.log(`🚫 Rate Limited (429): ${rateLimitedCount}`);
  console.log(`❌ Failed / Timeout (503s etc): ${errorCount}`);
  
  if (errorCount > 0) {
    console.log(`\n⚠️ The server struggled! Check API Gateway Circuit Breaker logs or MySQL HikariPool exhaustion.`);
  }
}

runSimulation();
