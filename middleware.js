import { NextResponse } from "next/server";
import { Buffer } from "buffer"; // needed for decoding

export default function middleware(req) {
  const basicAuth = req.headers.get("authorization");

  const username = process.env.BASIC_AUTH_USERNAME;
  const password = process.env.BASIC_AUTH_PASSWORD;

  if (!basicAuth) {
    return new Response("Auth required", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Secure Area"',
      },
    });
  }

  const [scheme, encoded] = basicAuth.split(" ");
  const decoded = Buffer.from(encoded, "base64").toString();
  const [user, pass] = decoded.split(":");

  if (user !== username || pass !== password) {
    return new Response("Unauthorized", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Secure Area"',
      },
    });
  }

  return NextResponse.next();
}

// Protect all routes except static files
export const config = {
  matcher: ['/((?!_next|static|favicon.ico|assets|images|fonts|css|js).*)'],
};
