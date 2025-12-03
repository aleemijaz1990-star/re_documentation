export function middleware(req) {
  const basicAuth = req.headers.get("authorization");

  const username = "admin";      // Change this
  const password = "secret123";  // Change this

  const validAuth =
      "Basic " + Buffer.from(`${username}:${password}`).toString("base64");

  if (basicAuth === validAuth) {
    return; // Allow access
  }

  return new Response("Authentication required", {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Protected Docs"',
    },
  });
}
