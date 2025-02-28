import { bearerAuth as honoBearerAuth } from "hono/bearer-auth";

export function bearerAuth() {
  return honoBearerAuth({
    async verifyToken(token, ctx) {
      if (!ctx.env.AUTH_TOKEN) {
        // no token, all requests unauthorized
        return false;
      }
      return ctx.env.AUTH_TOKEN === token;
    },
  });
}
