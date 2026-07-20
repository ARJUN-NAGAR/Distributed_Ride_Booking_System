const http = require('http');

// Configuration
const TARGET_HOST = 'localhost';
const TARGET_PORT = 8080; 
const TARGET_PATH = '/api/v1/locations/drivers/';

const NUM_DRIVERS = 1000;
const BATCH_SIZE = 50; 
const INTERVAL_MS = 1000; // Send a batch every 1 second
const CENTER_LAT = 28.7041;
const CENTER_LNG = 77.1025;
const RADIUS_DEG = 0.045; 

// Reuse TCP connections to prevent "No buffer space available" socket exhaustion on Windows
const keepAliveAgent = new http.Agent({
    keepAlive: true,
    maxSockets: 100, // Max concurrent sockets
    keepAliveMsecs: 1000
});

console.log(`🚀 Booting up Smooth Scale Load Tester...`);
console.log(`Generating ${NUM_DRIVERS} drivers, streaming ${BATCH_SIZE} per second to avoid 503 Circuit Breaker trips...\n`);

const drivers = [];
for (let i = 1; i <= NUM_DRIVERS; i++) {
    drivers.push({
        id: `driver_scale_${i}`,
        lat: CENTER_LAT + (Math.random() * RADIUS_DEG * 2 - RADIUS_DEG),
        lng: CENTER_LNG + (Math.random() * RADIUS_DEG * 2 - RADIUS_DEG),
    });
}

function sendTelemetry(driver, token) {
    driver.lat += (Math.random() * 0.0002) - 0.0001;
    driver.lng += (Math.random() * 0.0002) - 0.0001;

    const data = JSON.stringify({
        latitude: driver.lat,
        longitude: driver.lng
    });

    const options = {
        hostname: TARGET_HOST,
        port: TARGET_PORT,
        path: `${TARGET_PATH}${driver.id}/telemetry`,
        method: 'POST',
        agent: keepAliveAgent,
        headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(data),
            'Authorization': `Bearer ${token}`
        }
    };

    const req = http.request(options, res => {
        if (res.statusCode !== 200) {
            console.warn(`[WARN] Driver ${driver.id} returned status: ${res.statusCode}`);
        }
    });

    req.on('error', error => {
        if (error.code !== 'ECONNREFUSED') {
            console.error(`[ERROR] Driver ${driver.id}: ${error.message}`);
        }
    });

    req.write(data);
    req.end();
}

// Authenticate to get JWT token before starting load test
const authData = JSON.stringify({ username: 'load_tester', role: 'ROLE_DRIVER' });
const authOptions = {
    hostname: TARGET_HOST,
    port: TARGET_PORT,
    path: '/api/v1/auth/login',
    method: 'POST',
    headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(authData)
    }
};

console.log('Authenticating with Gateway to acquire JWT token...');
const authReq = http.request(authOptions, res => {
    let responseBody = '';
    res.on('data', chunk => responseBody += chunk);
    res.on('end', () => {
        if (res.statusCode === 200) {
            const token = JSON.parse(responseBody).token;
            console.log('✅ Token acquired. Beginning telemetry stream...');
            
            let currentBatch = 0;
            setInterval(() => {
                const startIndex = currentBatch * BATCH_SIZE;
                const endIndex = Math.min(startIndex + BATCH_SIZE, NUM_DRIVERS);
                
                if (startIndex >= NUM_DRIVERS) {
                    currentBatch = 0;
                    return;
                }

                console.log(`[STREAM] Dispatching telemetry for drivers ${startIndex + 1} to ${endIndex}...`);
                for (let i = startIndex; i < endIndex; i++) {
                    sendTelemetry(drivers[i], token);
                }
                
                currentBatch++;
            }, INTERVAL_MS);
        } else {
            console.error('Failed to authenticate:', responseBody);
        }
    });
});
authReq.write(authData);
authReq.end();
