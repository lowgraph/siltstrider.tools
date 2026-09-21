const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');

// Node loads .env.local at process startup. Only the publishable key is rendered.
// Never serve the repository directory: it contains ignored secret files.
function renderPage(html, key = '') {
  if (key && !/^pk_(test|live)_[A-Za-z0-9_-]+$/.test(key)) throw new Error('Invalid Clerk publishable key');
  return html.replace('<meta name="clerk-publishable-key" content="" />',
    '<meta name="clerk-publishable-key" content="' + key + '" />');
}
function createServer(key = '') {
  return http.createServer((req, res) => {
    const url = new URL(req.url, 'http://localhost');
    if (!['GET', 'HEAD'].includes(req.method)) { res.writeHead(405); res.end(); return; }
    if (!['/', '/index.html'].includes(url.pathname)) { res.writeHead(404); res.end('Not found'); return; }
    try {
      const html = renderPage(fs.readFileSync(path.join(__dirname, '../../../index.html'), 'utf8'), key);
      res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff' });
      res.end(req.method === 'HEAD' ? undefined : html);
    } catch {
      res.writeHead(500); res.end('Could not start the local preview. Check public authentication configuration.');
    }
  });
}
if (require.main === module) {
  const port = Number(process.env.PORT || 8765);
  createServer(process.env.CLERK_PUBLISHABLE_KEY || '').listen(port, '127.0.0.1', () => {
    console.log('Silt Strider: http://localhost:' + port);
  });
}
module.exports = { createServer, renderPage };
