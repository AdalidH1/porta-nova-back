import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import * as dotenv from "dotenv";
import { cors } from "hono/cors";

dotenv.config();

const app = new Hono();

// Configurar CORS antes que Clerk middleware
app.use(
  "*",
  cors({
    origin: [
      "https://porta-nova-nu.vercel.app",
      "http://localhost:3000", // Para desarrollo local
      "http://127.0.0.1:3000",
    ],
    credentials: true,
    allowHeaders: [
      "Content-Type",
      "Authorization",
      "X-Requested-With",
      "Accept",
      "Origin",
      "Access-Control-Request-Method",
      "Access-Control-Request-Headers",
      "sec-ch-ua",
      "sec-ch-ua-mobile",
      "sec-ch-ua-platform",
    ],
    allowMethods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
  })
);

// Clerk middleware después de CORS
app.use(
  "*",
  clerkMiddleware({
    // Configuraciones adicionales de Clerk
    secretKey: process.env.CLERK_SECRET_KEY,
    publishableKey: process.env.CLERK_PUBLISHABLE_KEY,
  })
);

app.use("/static/*", serveStatic({ root: "./" }));

// Endpoint de prueba de autenticación
app.get("/", (c) => {
  const auth = getAuth(c);

  // Agregar headers de depuración
  const authHeader = c.req.header("Authorization");
  const cookies = c.req.header("Cookie");

  console.log("Auth object:", auth);
  console.log("Authorization header:", authHeader);
  console.log("Cookies:", cookies);

  if (!auth?.userId) {
    return c.json(
      {
        message: "You are not logged in.",
        debug: {
          hasAuth: !!auth,
          authKeys: auth ? Object.keys(auth) : [],
          hasAuthHeader: !!authHeader,
          hasCookies: !!cookies,
        },
      },
      401
    );
  }

  return c.json({
    message: "You are logged in!",
    userId: auth.userId,
    sessionId: auth.sessionId,
  });
});

// Endpoint adicional para debugging
app.get("/debug-auth", (c) => {
  const auth = getAuth(c);
  const headers: Record<string, string> = {};

  // Capturar todos los headers
  c.req.raw.headers.forEach((value, key) => {
    headers[key] = value;
  });

  return c.json({
    auth,
    headers,
    url: c.req.url,
    method: c.req.method,
  });
});

// Endpoint para verificar CORS
app.options("*", (c) => {
  return c.text("OK");
});

serve(
  {
    fetch: app.fetch,
    port: 5100,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
    console.log("Environment variables check:");
    console.log(
      "CLERK_SECRET_KEY:",
      process.env.CLERK_SECRET_KEY ? "Set" : "Missing"
    );
    console.log(
      "CLERK_PUBLISHABLE_KEY:",
      process.env.CLERK_PUBLISHABLE_KEY ? "Set" : "Missing"
    );
  }
);
