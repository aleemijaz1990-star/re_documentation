const fs = require('fs');
const path = require('path');

const BASIC_AUTH_USERNAME = process.env.BASIC_AUTH_USERNAME;
const BASIC_AUTH_PASSWORD = process.env.BASIC_AUTH_PASSWORD;

function resolveStaticPath(urlPath) {
  const staticPath = path.join(process.cwd(), 'build', urlPath === '/' ? 'index.html' : urlPath);
  return staticPath.endsWith('/') ? path.join(staticPath, 'index.html') : staticPath;
}

module.exports = (req, res) => {
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

  // const requestedPath = req.url.replace(/^\/docs/, '') || '/';
  // const filePath = resolveStaticPath(requestedPath);

  // ... (Basic Auth logic) ...

// Use req.url directly, which will be the full path requested by the user
// (e.g., '/', '/intro', '/assets/logo.png').
  const requestedPath = req.url || '/';

// IMPORTANT: You must also use the improved resolveStaticPath function
// from the previous answer to handle paths like '/intro' correctly:

  function resolveStaticPath(urlPath) {
    let staticPath = path.join(process.cwd(), 'build', urlPath);

    // Handle the root path
    if (urlPath === '/' || urlPath === '') {
      return path.join(process.cwd(), 'build', 'index.html');
    }

    // Handle sub-paths without extension (e.g., /intro -> /intro/index.html)
    if (path.extname(staticPath) === '' && !staticPath.endsWith(path.sep)) {
      staticPath = path.join(staticPath, 'index.html');
    }

    return staticPath;
  }

  const filePath = resolveStaticPath(requestedPath);

// ... (404 and File Serving logic) ...




  if (!fs.existsSync(filePath)) {
    res.statusCode = 404;
    res.end('Documentation file not found.');
    return;
  }

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
