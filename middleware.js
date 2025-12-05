export default function middleware(req) {
  const url = req.nextUrl;
  const basicAuth = req.headers.get("authorization");

  const username = process.env.BASIC_AUTH_USERNAME;
  const password = process.env.BASIC_AUTH_PASSWORD;

  // If no auth header present
  if (!basicAuth) {
    return new Response("Auth required", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Secure Area"',
      },
    });
  }

  // Extract auth header and decode
  const [scheme, encoded] = basicAuth.split(" ");
  const decoded = Buffer.from(encoded, "base64").toString();
  const [user, pass] = decoded.split(":");

  // Validate credentials
  if (user !== username || pass !== password) {
    return new Response("Unauthorized", {
      status: 401,
      headers: {
        "WWW-Authenticate": 'Basic realm="Secure Area"',
      },
    });
  }

  // Allow request if correct
  return NextResponse.next();
}

export const config = {
  matcher: ['/((?!_next|static|favicon.ico).*)'], // protects everything
};
