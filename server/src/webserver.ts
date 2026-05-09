import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "hono/bun";
import Bun from "bun";

export async function startWebserver() {
    const app = new Hono()

    app.use("*", cors({ origin: "http://localhost:5173" }));

    app.get("/api/hello", (c) => {
        return c.json({ message: "Hello from Bun!" });
    });

    app.post("/api/log-in", async (c) => {
        const body = await c.req.json()
        return c.json({ received: body });
    });

    app.use("/*", serveStatic({ root: "../frontend/dist" }));

    const server = Bun.serve({
        port: 3000,
        fetch: app.fetch,
    });

    console.log(`Server running at http://localhost:${server.port}`);
}