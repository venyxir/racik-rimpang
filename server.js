const http = require('http');
const fs = require('fs');
const path = require('path');
const url = require('url');

const PORT = Number(process.env.PORT) || 3000;
const ROOT = __dirname;

const MIME = {
  '.html': 'text/html; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.md': 'text/markdown; charset=utf-8',
  '.txt': 'text/plain; charset=utf-8',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.webp': 'image/webp',
  '.ico': 'image/x-icon'
};

function safePath(requestPath) {
  const decoded = decodeURIComponent(requestPath.split('?')[0]);
  const normalized = path.normalize(decoded).replace(/^([.][.][\\/])+/, '');
  return path.join(ROOT, normalized === '/' ? 'index.html' : normalized);
}

function serve(req, res) {
  let filePath;
  try {
    filePath = safePath(url.parse(req.url).pathname || '/');
  } catch {
    res.writeHead(400, {'Content-Type': 'text/plain; charset=utf-8'});
    return res.end('Bad Request');
  }

  if (!filePath.startsWith(ROOT)) {
    res.writeHead(403, {'Content-Type': 'text/plain; charset=utf-8'});
    return res.end('Forbidden');
  }

  fs.stat(filePath, (err, stat) => {
    if (!err && stat.isDirectory()) filePath = path.join(filePath, 'index.html');

    fs.readFile(filePath, (readErr, data) => {
      if (readErr) {
        // Allow extensionless directory-style routes such as /seller and /login.
        const fallback = path.join(ROOT, url.parse(req.url).pathname || '/', 'index.html');
        return fs.readFile(fallback, (fallbackErr, fallbackData) => {
          if (fallbackErr) {
            res.writeHead(404, {'Content-Type': 'text/plain; charset=utf-8'});
            return res.end('404 - Not Found');
          }
          const ext = path.extname(fallback).toLowerCase();
          res.writeHead(200, {'Content-Type': MIME[ext] || 'application/octet-stream'});
          res.end(fallbackData);
        });
      }

      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, {
        'Content-Type': MIME[ext] || 'application/octet-stream',
        'Cache-Control': 'no-cache'
      });
      res.end(data);
    });
  });
}

const server = http.createServer(serve);
server.listen(PORT, '0.0.0.0', () => {
  console.log(`Katalog berjalan di http://localhost:${PORT}`);
  console.log('Tekan Ctrl+C untuk menghentikan server.');
});
