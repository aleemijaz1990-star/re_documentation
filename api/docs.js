// api/docs.js

// Ensure 'fs' and 'path' are available for reading static files
const fs = require('fs');
const path = require('path');

// Credentials from Vercel Environment Variables
const BASIC_AUTH_USERNAME = process.env.BASIC_AUTH_USERNAME;
const BASIC_AUTH_PASSWORD = process.env.BASIC_AUTH_PASSWORD;

// Helper function to resolve the static path where Docusaurus builds
function resolveStaticPath(urlPath) {
  // Docusaurus builds to 'build/', Vercel serves from a root that contains this.
  // We look for the corresponding file in the static build directory.
  const staticPath = path.join(process.cwd(), 'build', urlPath === '/' ? 'index.html' : urlPath);
  return staticPath.endsWith('/') ? path.join(staticPath, 'index.html') : staticPath;
}

// Main Serverless Function Handler
module.exports = (req, res) => {
  // 1. Get the Authorization Header
  const basicAuth = req.headers.authorization;

  let isAuthenticated = false;

  if (basicAuth && basicAuth.startsWith('Basic ')) {
    // 2. Decode the credentials
    const authValue = basicAuth.substring(6); // Remove 'Basic '
    const decodedAuth = Buffer.from(authValue, 'base64').toString();
    const [user, password] = decodedAuth.split(':');

    // 3. Validate credentials
    if (user === BASIC_AUTH_USERNAME && password === BASIC_AUTH_PASSWORD) {
      isAuthenticated = true;
    }
  }

  // 4. Handle Authentication Failure
  if (!isAuthenticated) {
    console.log('Authentication failed! Sending 401.');
    // Set headers to trigger the browser's native Basic Auth pop-up
    res.setHeader('WWW-Authenticate', 'Basic realm="Secure Documentation"');
    res.statusCode = 401;
    res.end('Authentication required to access this documentation.');
    return;
  }

  // 5. Handle Authentication Success (Proxy Static Content)
  // Determine which static file the user is requesting (e.g., /index.html, /docs/intro.html)
  const requestedPath = req.url.startsWith('/api/docs') ? req.url.substring('/api/docs'.length) : req.url;

  // Resolve path to the Docusaurus build output
  const filePath = resolveStaticPath(requestedPath);

  // Simple check for file existence
  if (!fs.existsSync(filePath)) {
    res.statusCode = 404;
    res.end('Documentation file not found.');
    return;
  }

  // Serve the file content
  const fileExtension = path.extname(filePath);
  let contentType = 'text/html';

  if (fileExtension === '.css') contentType = 'text/css';
  else if (fileExtension === '.js') contentType = 'application/javascript';
  // Add other types (.png, .svg) as needed

  res.setHeader('Content-Type', contentType);
  res.statusCode = 200;
  fs.createReadStream(filePath).pipe(res);
};