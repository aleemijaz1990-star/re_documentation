const fs = require('fs');
const path = require('path');

const BASIC_AUTH_USERNAME = process.env.BASIC_AUTH_USERNAME;
const BASIC_AUTH_PASSWORD = process.env.BASIC_AUTH_PASSWORD;

function resolveStaticPath(urlPath) {
  // Ensure we are resolving to a file path within the 'build' directory.
  // The path logic here looks correct for mapping URL paths to file paths,
  // e.g., '/' -> 'build/index.html', '/styles/main.css' -> 'build/styles/main.css'
  const staticPath = path.join(process.cwd(), 'build', urlPath === '/' ? 'index.html' : urlPath);
  return staticPath.endsWith('/') ? path.join(staticPath, 'index.html') : staticPath;
}

module.exports = (req, res) => {
  // ... (Basic Auth Logic remains the same) ...
  const basicAuth = req.headers.authorization;
  let isAuthenticated = false;

  if (basicAuth && basicAuth.startsWith('Basic ')) {
    const authValue = basicAuth.substring(6);
    const [user, password] = Buffer.from(authValue, 'base64').toString().split(':');
    if (user === BASIC_AUTH_USERNAME && password === BASIC_AUTH_PASSWORD) isAuthenticated = true;
  }

  if (!isAuthenticated) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Secure Documentation"');
    res.statusCode = 401;
    res.end('Authentication required.');
    return;
  }

  // 1. Get the requested URL path directly.
  const requestedPath = req.url || '/';

  // 2. The resolveStaticPath function handles mapping the URL to the 'build' directory file.
  const filePath = resolveStaticPath(requestedPath);

  if (!fs.existsSync(filePath)) {
    res.statusCode = 404;
    res.end('Documentation file not found.');
    return;
  }

  // ... (MIME type and file serving logic remains the same) ...
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
  };

  res.setHeader('Content-Type', mimeTypes[ext] || 'text/plain');
  fs.createReadStream(filePath).pipe(res);
};