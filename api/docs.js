// const fs = require('fs');
// const path = require('path');
//
// const BASIC_AUTH_USERNAME = process.env.BASIC_AUTH_USERNAME;
// const BASIC_AUTH_PASSWORD = process.env.BASIC_AUTH_PASSWORD;
//
// function resolveStaticPath(urlPath) {
//   const staticPath = path.join(process.cwd(), 'build', urlPath === '/' ? 'index.html' : urlPath);
//   return staticPath.endsWith('/') ? path.join(staticPath, 'index.html') : staticPath;
// }
//
// module.exports = (req, res) => {
//   const basicAuth = req.headers.authorization;
//   let isAuthenticated = false;
//
//   if (basicAuth && basicAuth.startsWith('Basic ')) {
//     const authValue = basicAuth.substring(6);
//     const [user, password] = Buffer.from(authValue, 'base64').toString().split(':');
//     if (user === BASIC_AUTH_USERNAME && password === BASIC_AUTH_PASSWORD) isAuthenticated = true;
//   }
//
//   if (!isAuthenticated) {
//     res.setHeader('WWW-Authenticate', 'Basic realm="Secure Documentation"');
//     res.statusCode = 401;
//     res.end('Authentication required.');
//     return;
//   }
//
//   const requestedPath = req.url.replace(/^\/docs/, '') || '/';
//   const filePath = resolveStaticPath(requestedPath);
//
//   if (!fs.existsSync(filePath)) {
//     res.statusCode = 404;
//     res.end('Documentation file not found.');
//     return;
//   }
//
//   const ext = path.extname(filePath).toLowerCase();
//   const mimeTypes = {
//     '.html': 'text/html',
//     '.css': 'text/css',
//     '.js': 'application/javascript',
//     '.json': 'application/json',
//     '.png': 'image/png',
//     '.jpg': 'image/jpeg',
//     '.jpeg': 'image/jpeg',
//     '.svg': 'image/svg+xml',
//     '.ico': 'image/x-icon',
//   };
//
//   res.setHeader('Content-Type', mimeTypes[ext] || 'text/plain');
//   fs.createReadStream(filePath).pipe(res);
// };


const fs = require('fs');
const path = require('path');

// --- Environment Variables for Authentication ---
const BASIC_AUTH_USERNAME = process.env.BASIC_AUTH_USERNAME;
const BASIC_AUTH_PASSWORD = process.env.BASIC_AUTH_PASSWORD;

// --- Helper Function for Static Path Resolution ---
function resolveStaticPath(urlPath) {
  // Use the path after the '/docs' prefix has been stripped
  let requested = urlPath || '/';

  // 1. Handle the root path: '/' should always map to build/index.html
  if (requested === '/') {
    return path.join(process.cwd(), 'build', 'index.html');
  }

  let staticPath = path.join(process.cwd(), 'build', requested);

  // 2. Check for explicit file extensions (e.g., .css, .png)
  // If it has an extension, assume it's a direct asset link.
  if (path.extname(staticPath) !== '') {
    return staticPath;
  }

  // 3. Handle paths without an extension (clean URLs like '/intro')
  // These usually map to a directory containing index.html.

  // Ensure the path ends with a separator if it's a directory structure
  if (!staticPath.endsWith(path.sep)) {
    staticPath = staticPath + path.sep;
  }

  // Append index.html to look inside that directory.
  return path.join(staticPath, 'index.html');
}

// --- Main Serverless Function Export ---
module.exports = (req, res) => {
  const basicAuth = req.headers.authorization;
  let isAuthenticated = false;

  // 1. Basic Authentication Check
  if (basicAuth && basicAuth.startsWith('Basic ')) {
    const authValue = basicAuth.substring(6);
    const [user, password] = Buffer.from(authValue, 'base64').toString().split(':');

    // Check credentials against environment variables
    if (user === BASIC_AUTH_USERNAME && password === BASIC_AUTH_PASSWORD) {
      isAuthenticated = true;
    }
  }

  // 2. Send 401 Unauthorized if not authenticated
  if (!isAuthenticated) {
    res.setHeader('WWW-Authenticate', 'Basic realm="Secure Documentation"');
    res.statusCode = 401;
    res.end('Authentication required.');
    return;
  }

  // 3. Resolve Requested Path (Stripping the public '/docs' prefix)
  // This is crucial for matching the Vercel rewrite rule: /docs/:path* -> /api/docs/:path*
  // const requestedPath = req.url.replace(/^\/docs/, '') || '/';
  const requestedPath = req.url || '/';
  const filePath = resolveStaticPath(requestedPath);

  // 4. Handle 404 Not Found
  if (!fs.existsSync(filePath)) {
    res.statusCode = 404;
    res.end('Documentation file not found: ' + filePath);
    return;
  }

  // 5. Determine MIME Type and Serve File
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