const http = require('http');
const config = require('./lib/config');
const { authenticate } = require('./lib/auth');
const { generateDriverPosition } = require('./lib/geo');
const { SimulationReporter } = require('./lib/reporter');

const args = process.argv.slice(2);
const DRIVER_COUNT = parseInt(args[0]) || 1000;
const TICK_INTERVAL_MS = parseInt(args[1]) || 3000;
const BATCH_SIZE = 200;

const agent = new http.Agent(config.HTTP_AGENT_CONFIG);

async function start() {
  console.log(`Starting driver spawn simulation: ${DRIVER_COUNT} drivers, ${TICK_INTERVAL_MS}ms interval`);
  
  let token;
  try {
    token = await authenticate('driver_tester', 'ROLE_DRIVER');
    console.log('Authenticated successfully.');
  } catch (err) {
    console.error('Failed to authenticate:', err.message);
    process.exit(1);
  }

  const reporter = new SimulationReporter(`Spawn ${DRIVER_COUNT} Drivers`);
  reporter.start();

  const drivers = Array.from({ length: DRIVER_COUNT }).map((_, i) => ({
    driverId: `driver_${i}`,
    position: generateDriverPosition()
  }));

  async function broadcastLocations() {
    for (let i = 0; i < drivers.length; i += BATCH_SIZE) {
      const batch = drivers.slice(i, i + BATCH_SIZE);
      const promises = batch.map(driver => {
        return new Promise((resolve) => {
          const startTime = Date.now();
          const payload = JSON.stringify({
            latitude: driver.position.lat,
            longitude: driver.position.lng
          });

          const options = {
            hostname: config.GATEWAY_HOST,
            port: config.GATEWAY_PORT,
            path: `/api/v1/locations/drivers/${driver.driverId}/telemetry`,
            method: 'POST',
            agent,
            headers: {
              'Content-Type': 'application/json',
              'Content-Length': Buffer.byteLength(payload),
              'Authorization': `Bearer ${token}`,
              'X-Driver-ID': driver.driverId
            }
          };

          const req = http.request(options, res => {
            const latency = Date.now() - startTime;
            // Drain the response to keep socket alive
            res.on('data', () => {});
            res.on('end', () => {
              if (res.statusCode === 200) reporter.recordSuccess(latency);
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
        });
      });

      await Promise.all(promises);
      reporter.logProgress(500);
    }
    
    // Simulate movement drift for next tick
    drivers.forEach(d => {
      d.position.lat += (Math.random() - 0.5) * 0.0004;
      d.position.lng += (Math.random() - 0.5) * 0.0004;
    });
    setTimeout(broadcastLocations, TICK_INTERVAL_MS);
  }

  broadcastLocations();

  process.on('SIGINT', () => {
    console.log('\nCaught interrupt signal');
    reporter.finish();
    process.exit();
  });
}

start();
