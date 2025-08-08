import { serve } from "@hono/node-server";
import { Hono } from "hono";
import { serveStatic } from "@hono/node-server/serve-static";
import { clerkMiddleware, getAuth } from "@hono/clerk-auth";
import * as dotenv from "dotenv";
import { cors } from "hono/cors";

dotenv.config();

const app = new Hono();

app.use("*", clerkMiddleware());
app.use("/static/*", serveStatic({ root: "./" }));
// app.get("/", (c) => {
//   return c.text("Hello Hono!");
// });

app.use(
  cors({
    origin: ["https://porta-nova-nu.vercel.app"],
    credentials: true,
  })
);
app.get("/", (c) => {
  const auth = getAuth(c);

  if (!auth?.userId) {
    return c.json({
      message: "You are not logged in.",
    });
  }

  return c.json({
    message: "You are logged in!",
    userId: auth.userId,
  });
});

serve(
  {
    fetch: app.fetch,
    port: 5100,
  },
  (info) => {
    console.log(`Server is running on http://localhost:${info.port}`);
  }
);
