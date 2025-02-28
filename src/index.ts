import { fromHono } from "chanfana";
import { Hono } from "hono";
import { timeout } from "hono/timeout";
import { UrlQrCodeRead } from "endpoints/qr-code-read";
import { Errors } from "endpoints/errors";
import { SERVER_TIMEOUT } from "config";

// Start a Hono app
const app = new Hono();

app.use(timeout(SERVER_TIMEOUT));

// Setup OpenAPI registry
const openapi = fromHono(app, {
  docs_url: "/",
});

// Register OpenAPI endpoints
openapi.get("/health", () => {
  return new Response(JSON.stringify({ ok: true }));
});
openapi.get("/errors", Errors);
openapi.post("/", UrlQrCodeRead);

// Export the Hono app
export default app;
