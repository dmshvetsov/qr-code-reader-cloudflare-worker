import { bearerAuth as honoBearerAuth } from "hono/bearer-auth";

export function bearerAuth() {
  return honoBearerAuth({
    async verifyToken(token, ctx) {
      return ctx.env.AUTH_TOKEN === token;
    },
  });
}
