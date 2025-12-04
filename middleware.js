export const config = {
  matcher: "/:path*"
};

export function middleware(req) {
  const auth = req.headers.get("authorization");

  const username = "admin";
  const password = "12345";

  const expected = "Basic " + Buffer.from(`${username}:${password}`).toString("base64");

  if (auth === expected) {
    return new Response(null, { status: 200 }); // allow request
  }

  return new Response("Authentication Required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Secure Area"'
    }
  });
}
