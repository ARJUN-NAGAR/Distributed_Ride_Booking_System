const http = require('http');
const fs = require('fs');
const path = require('path');
const config = require('./lib/config');
const { authenticate } = require('./lib/auth');
const { generateRideCoordinates } = require('./lib/geo');
const { SimulationReporter } = require('./lib/reporter');

const args = process.argv.slice(2);
const TOTAL_RIDES = parseInt(args[0]) || 10000;
const BATCH_SIZE = parseInt(args[1]) || 200;
const BATCH_DELAY_MS = parseInt(args[2]) || 500;
const MODE = args[3] || 'valid'; // valid, ddos, noauth

const agent = new http.Agent(config.HTTP_AGENT_CONFIG);

function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function start() {
  console.log(`Starting ${TOTAL_RIDES} rides simulation. Batch: ${BATCH_SIZE}, Delay: ${BATCH_DELAY_MS}ms, Mode: ${MODE}`);
  
  let token = null;
  if (MODE === 'valid' || MODE === 'ddos') {
    try {
      token = await authenticate('rider_tester', 'ROLE_RIDER');
      console.log('Authenticated successfully.');
    } catch (err) {
      console.error('Failed to authenticate:', err.message);
      process.exit(1);
    }
  }

  const reporter = new SimulationReporter(`Simulate ${TOTAL_RIDES} Riders (${MODE})`);
  reporter.start();

  for (let i = 0; i < TOTAL_RIDES; i += BATCH_SIZE) {
    const batchSize = Math.min(BATCH_SIZE, TOTAL_RIDES - i);
    const promises = [];

    for (let j = 0; j < batchSize; j++) {
      const idx = i + j;
      promises.push(new Promise((resolve) => {
        const startTime = Date.now();
        const coords = generateRideCoordinates();
        const payload = JSON.stringify({
          passengerId: `rider_${idx}`,
          ...coords
        });

        const headers = {
          'Content-Type': 'application/json',
          'Content-Length': Buffer.byteLength(payload)
        };

        if (token) {
          headers['Authorization'] = `Bearer ${token}`;
        }
        
        if (MODE === 'valid') {
          headers['X-Session-ID'] = `session_rider_${idx}`;
        } else if (MODE === 'ddos') {
          headers['X-DDoS-Test'] = 'true';
        }

        const options = {
          hostname: config.GATEWAY_HOST,
          port: config.GATEWAY_PORT,
          path: '/api/v1/rides',
          method: 'POST',
          agent,
          headers
        };

        const req = http.request(options, res => {
          const latency = Date.now() - startTime;
          res.on('data', () => {});
          res.on('end', () => {
            if (res.statusCode >= 200 && res.statusCode < 300) reporter.recordSuccess(latency);
            else if (res.statusCode === 429) reporter.recordRateLimited(latency);
            else if (res.statusCode === 401 || res.statusCode === 403) reporter.recordAuthFailed(latency);
            else reporter.recordServerError(latency);
            resolve();
          });
        });

        req.on('error', () => {
          reporter.recordConnectionError();
          resolve();
        });

        req.write(payload);
        req.end();
      }));
    }

    await Promise.all(promises);
    reporter.logProgress(500);
    if (BATCH_DELAY_MS > 0) {
      await delay(BATCH_DELAY_MS);
    }
  }

  const results = reporter.finish();

  console.log('\n--- Simulation Comparison ---');
  console.log(`Mode Expected Behavior:`);
  if (MODE === 'valid') console.log(`Expected mostly successes. Composite rate limit avoids triggering IP limit.`);
  else if (MODE === 'ddos') console.log(`Expected high 429s due to triggering 30/min limit.`);
  else if (MODE === 'noauth') console.log(`Expected high 429s/401s due to missing auth / IP limit (120/min).`);
  console.log('-----------------------------\n');

  const timestamp = Date.now();
  const resultsDir = path.join(__dirname, 'results');
  if (!fs.existsSync(resultsDir)) {
    fs.mkdirSync(resultsDir, { recursive: true });
  }
  
  const resultsPath = path.join(resultsDir, `simulation_results_${timestamp}.json`);
  fs.writeFileSync(resultsPath, JSON.stringify(results, null, 2));
  console.log(`Saved results to ${resultsPath}`);
}

start();
