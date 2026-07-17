#!/usr/bin/env node
/* Dead-simple static server. No dependencies — Node built-ins only.
   Run:  node serve.js         (from the site/ directory)
   Then open the URL it prints. Ctrl-C to stop.

   You don't strictly need this — index.html also opens by double-clicking —
   but serving over http is closer to production and is what you want once the
   real click.wav and pedestal footage go in (browsers treat file:// oddly for
   media). */
const http = require('http');
const fs = require('fs');
const path = require('path');

const ROOT = __dirname;
const START_PORT = Number(process.env.PORT) || 8123;

const TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'text/javascript; charset=utf-8',
  '.mjs': 'text/javascript; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.json': 'application/json; charset=utf-8',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.gif': 'image/gif',
  '.mp4': 'video/mp4',
  '.webm': 'video/webm',
  '.wav': 'audio/wav',
  '.mp3': 'audio/mpeg',
  '.woff': 'font/woff',
  '.woff2': 'font/woff2',
  '.ico': 'image/x-icon'
};

const server = http.createServer((req, res) => {
  let urlPath = decodeURIComponent(req.url.split('?')[0]);

  // resolve safely inside ROOT (no path traversal)
  let filePath = path.join(ROOT, path.normalize(urlPath));
  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403); res.end('Forbidden'); return;
  }

  fs.stat(filePath, (err, stat) => {
    // directory (or "/") → its index.html, so /showcase/everest/ just works
    if (!err && stat.isDirectory()) {
      filePath = path.join(filePath, 'index.html');
    } else if (err && !path.extname(filePath)) {
      // extensionless route (/showcase/everest) → directory index
      filePath = path.join(filePath, 'index.html');
    }
    fs.stat(filePath, (err2, stat2) => {
      if (err2 || !stat2.isFile()) {
        res.writeHead(404, { 'Content-Type': 'text/plain' });
        res.end('404 Not Found: ' + urlPath);
        return;
      }
      res.writeHead(200, {
        'Content-Type': TYPES[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
        'Cache-Control': 'no-cache'
      });
      fs.createReadStream(filePath).pipe(res);
    });
  });
});

function listen(port, attemptsLeft) {
  server.once('error', (e) => {
    if (e.code === 'EADDRINUSE' && attemptsLeft > 0) {
      listen(port + 1, attemptsLeft - 1);
    } else {
      console.error(e.message);
      process.exit(1);
    }
  });
  server.listen(port, () => {
    console.log('\n  CENTINILY — serving ' + ROOT);
    console.log('  →  http://localhost:' + port + '\n');
    console.log('  Ctrl-C to stop.\n');
  });
}

listen(START_PORT, 15);
