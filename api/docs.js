const fs = require('fs');
const path = require('path');

// Basic Auth credentials from Vercel environment variables
const BASIC_AUTH_USERNAME = process.env.BASIC_AUTH_USERNAME;
const BASIC_AUTH_PASSWORD = process.env.BASIC_AUTH_PASSWORD;

// Resolve the correct file in the Docusaurus build folder
function resolveStaticPath(urlPath) {
  const staticPath = path.join(
      process.cwd(),
      'build',
      urlPath === '/' ? 'index.html' : urlPath
  );
  return staticPath.endsWith('/') ? path.join(staticPath, 'index.html') : staticPath;
}

module.exports = (req, res) => {
  // --- 1. Basic Auth check ---
  const authHeader = req.headers.authorization;
  let isAuthenticated = false;

  if (authHeader && authHeader.startsWith('Basic ')) {
    const encoded = authHeader.substring(6);
    const [user, pass] = Buffer.from(encoded, 'base64').toString().split(':');
    if (user === BASIC_AUTH_USERNAME && pass === BASIC_AUTH_PASSWORD) {
      isAuthenticated = true;
    }
  }

  if (!isAuthenticated) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Protected Docs"');
    res.statusCode = 401;
    res.end('Authentication required.');
    return;
  }

  // --- 2. Determine requested file ---
  // Serve docs at root, so use req.url directly
  const requestedPath = req.url === '/' ? '/' : req.url;
  const filePath = resolveStaticPath(requestedPath);

  if (!fs.existsSync(filePath)) {
    res.statusCode = 404;
    res.end('Documentation file not found.');
    return;
  }

  // --- 3. Serve file with correct MIME type ---
  const ext = path.extname(filePath).toLowerCase();
  const mimeTypes = {
    '.html': 'text/html',
    '.css': 'text/css',
    '.js': 'application/javascript',
    '.json': 'application/json',
    '.png': 'image/png',
    '.jpg': 'image/jpeg',
    '.jpeg': 'image/jpeg',
    '.svg': 'image/svg+xml',
    '.ico': 'image/x-icon',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.ttf': 'font/ttf'
  };

  res.setHeader('Content-Type', mimeTypes[ext] || 'application/octet-stream');
  fs.createReadStream(filePath).pipe(res);
};
