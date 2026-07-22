const http = require('http');
const config = require('./config');

/**
 * Authenticates with the ride-service and returns a JWT token.
 * @param {string} username - The username to authenticate as
 * @param {string} role - The role (ROLE_RIDER or ROLE_DRIVER)
 * @returns {Promise<string>} JWT token
 */
function authenticate(username = 'load_tester', role = 'ROLE_RIDER') {
  return new Promise((resolve, reject) => {
    const payload = JSON.stringify({ username, role });
    const options = {
      hostname: config.GATEWAY_HOST,
      port: config.GATEWAY_PORT,
      path: '/api/v1/auth/login',
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload)
      }
    };

    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', chunk => body += chunk);
      res.on('end', () => {
        if (res.statusCode === 200) {
          try {
            const token = JSON.parse(body).token;
            resolve(token);
          } catch (e) {
            reject(new Error(`Failed to parse auth response: ${body}`));
          }
        } else {
          reject(new Error(`Auth failed with status ${res.statusCode}: ${body}`));
        }
      });
    });

    req.on('error', reject);
    req.write(payload);
    req.end();
  });
}

module.exports = { authenticate };
