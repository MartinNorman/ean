// Minimal HTTP client on Node's http/https modules (the NAS runs Node 12, which has no fetch).
const http = require('http');
const https = require('https');

/**
 * @returns {Promise<{status: number, text: string}>}
 */
function request(url, { method = 'GET', headers = {}, body, timeoutMs = 10000 } = {}) {
  const target = new URL(url);
  const client = target.protocol === 'https:' ? https : http;
  const payload = body === undefined ? undefined : Buffer.from(body);
  const options = {
    method,
    headers: payload ? { ...headers, 'Content-Length': payload.length } : headers,
  };

  return new Promise((resolve, reject) => {
    const req = client.request(target, options, (res) => {
      const chunks = [];
      res.on('data', (chunk) => chunks.push(chunk));
      res.on('end', () => resolve({ status: res.statusCode, text: Buffer.concat(chunks).toString('utf8') }));
    });
    req.on('error', reject);
    req.setTimeout(timeoutMs, () => req.destroy(new Error('Request timeout')));
    if (payload) req.write(payload);
    req.end();
  });
}

module.exports = { request };
