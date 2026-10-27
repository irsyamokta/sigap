import { serve } from "@hono/node-server";
import { serveStatic } from "@hono/node-server/serve-static";
import { Hono } from "hono";

// Import the TanStack Start fetch handler
const { default: handler } = await import("./dist/server/server.js");

const app = new Hono();

app.use("*", async (c, next) => {
  await next();

  c.header(
    "Content-Security-Policy",
    "frame-ancestors 'self' https://*.banyumaskab.go.id",
  );

  if (process.env.NODE_ENV === "production") {
    c.header(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains",
    );
  }

  c.header("X-Content-Type-Options", "nosniff");
  c.header("Referrer-Policy", "strict-origin-when-cross-origin");
});

// Serve static assets from dist/client
app.use("/assets/*", serveStatic({ root: "./dist/client" }));

app.use("/data/*", serveStatic({ root: "./dist/client" }));

app.use("/favicon.png", serveStatic({ root: "./dist/client" }));

app.use("/robots.txt", serveStatic({ root: "./dist/client" }));

app.use("/login-illustration.jpg", serveStatic({ root: "./dist/client" }));

// All other requests go to the SSR handler
app.all("*", async (c) => {
  return handler.fetch(c.req.raw, {}, {});
});

const port = Number(process.env.PORT) || 3000;
const hostname = process.env.HOST || "0.0.0.0";

console.log(`Server running at http://${hostname}:${port}`);

serve({ fetch: app.fetch, port, hostname });
