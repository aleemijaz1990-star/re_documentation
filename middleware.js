// middleware.js

import { NextResponse } from 'next/server';

// Get credentials from Vercel environment variables
const BASIC_AUTH_USERNAME = process.env.BASIC_AUTH_USERNAME;
const BASIC_AUTH_PASSWORD = process.env.BASIC_AUTH_PASSWORD;

// This function intercepts every incoming request
export function middleware(request) {
  // 1. Skip paths that don't need protection (e.g., assets, images, favicons)
  const pathname = request.nextUrl.pathname;
  if (
      pathname.startsWith('/__docusaurus') || // Docusaurus internal path
      pathname.endsWith('.css') ||
      pathname.endsWith('.js') ||
      pathname.endsWith('.png') ||
      pathname.endsWith('.svg') ||
      pathname.endsWith('.ico')
  ) {
    return NextResponse.next();
  }

  // 2. Look for the 'Authorization' header
  const basicAuth = request.headers.get('authorization');

  if (basicAuth) {
    // 3. Decode the credentials
    const authValue = basicAuth.split(' ')[1];
    const [user, password] = Buffer.from(authValue, 'base64').toString().split(':');

    // 4. Validate credentials
    if (user === BASIC_AUTH_USERNAME && password === BASIC_AUTH_PASSWORD) {
      // Credentials are correct, allow request to proceed
      return NextResponse.next();
    }
  }

  // 5. If credentials fail or are missing, trigger the pop-up
  const url = request.nextUrl;
  url.pathname = '/401'; // Optionally redirect to a specific error page

  // Response with 401 Unauthorized status and WWW-Authenticate header
  // This header is what triggers the browser's native login pop-up
  return new Response('Auth required', {
    status: 401,
    headers: {
      'WWW-Authenticate': 'Basic realm="Secure Area"',
    },
  });
}