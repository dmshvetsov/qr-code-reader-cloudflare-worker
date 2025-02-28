import { fromHono } from "chanfana";
import { Hono } from "hono";
import { timeout } from "hono/timeout";
import { UrlQrCodeRead } from "endpoints/qr-code-read";
import { Errors } from "endpoints/errors";
import { Env, SERVER_TIMEOUT } from "config";
import { bearerAuth } from "middleware/auth";

// Start a Hono app
const app = new Hono<{ Bindings: Env }>();

app.use(timeout(SERVER_TIMEOUT));

const openapi = fromHono(app, {
  docs_url: "/",
});

openapi.get("/health", bearerAuth(), () => {
  return new Response(JSON.stringify({ ok: true }));
});
openapi.get("/errors", Errors);
app.on("POST", "/", bearerAuth());
openapi.post("/", UrlQrCodeRead);

// Export the Hono app
export default app;
