import { Hono } from "hono";
import { cors } from "hono/cors";
import { serveStatic } from "hono/bun";
import Bun from "bun";
import { getSetting, setSetting } from "./settings";
import { createSession, validateSession, deleteSession } from "./session";
import { prisma } from "./prisma";
import { validate as cronValidate } from "node-cron";
import { syncJobs } from "./tasks";
export async function startWebserver() {
    const app = new Hono();

    app.use("*", cors({ origin: "http://localhost:5173" }));

    app.use("/api/logged-in", async (c, next) => {
        const token = c.req.header("Authorization")?.replace("Bearer ", "");
        if (!token || !validateSession(token)) {
            return c.json({ success: false, message: "Unauthorized" }, 401);
        }
        return c.json({ success: true, message: "Logged-in" }, 200);
    });

    app.post("/api/log-in", async (c) => {
        const body = await c.req.json();
        const { username, password } = body;

        if (!username || !password) {
            return c.json({ success: false, message: "Username and password are required" }, 400);
        }

        const storedUsername = await getSetting("username");
        const storedPassword = await getSetting("password");

        if (username !== storedUsername || password !== storedPassword) {
            return c.json({ success: false, message: "Invalid username or password" }, 401);
        }

        const token = createSession();
        return c.json({ success: true, message: "Logged in successfully", token });
    });

    app.post("/api/log-out", async (c) => {
        const token = c.req.header("Authorization")?.replace("Bearer ", "");
        if (!token) {
            return c.json({ success: false, message: "No token provided" }, 400);
        }
        deleteSession(token);
        return c.json({ success: true, message: "Logged out successfully" });
    });

    // Middleware to protect routes below
    app.use("/api/protected/*", async (c, next) => {
        const token = c.req.header("Authorization")?.replace("Bearer ", "");
        if (!token || !validateSession(token)) {
            return c.json({ success: false, message: "Unauthorized" }, 401);
        }
        await next();
    });

    app.get("/api/protected/qbit-clients", async (c) => {
        const clients = await prisma.qbitClients.findMany({
            orderBy: { id: "asc" },
        });

        return c.json(clients.map((cl) => ({
            id: cl.id,
            name: cl.name,
            url: cl.url,
            username: cl.username,
        })));
    });

    app.post("/api/protected/qbit-clients", async (c) => {
        const body = await c.req.json();
        const { name, url, username, password } = body;

        if (!name || !url) {
            return c.json({ success: false, message: "Name and URL are required" }, 400);
        }

        const client = await prisma.qbitClients.create({
            data: { name, url, username: username || null, password: password || null },
        });

        return c.json({ success: true, client: { id: client.id, name: client.name, url: client.url, username: client.username } }, 201);
    });

    app.put("/api/protected/qbit-clients/:id", async (c) => {
        const id = Number(c.req.param("id"));
        const body = await c.req.json();
        const { name, url, username, password } = body;

        if (!name || !url) {
            return c.json({ success: false, message: "Name and URL are required" }, 400);
        }

        const existing = await prisma.qbitClients.findUnique({ where: { id } });
        if (!existing) {
            return c.json({ success: false, message: "Client not found" }, 404);
        }

        const updated = await prisma.qbitClients.update({
            where: { id },
            data: {
                name,
                url,
                username: username || null,
                ...(password ? { password } : {}),
            },
        });

        return c.json({ success: true, client: { id: updated.id, name: updated.name, url: updated.url, username: updated.username } });
    });

    app.delete("/api/protected/qbit-clients/:id", async (c) => {
        const id = Number(c.req.param("id"));

        const existing = await prisma.qbitClients.findUnique({ where: { id } });
        if (!existing) {
            return c.json({ success: false, message: "Client not found" }, 404);
        }

        await prisma.qbitClients.delete({ where: { id } });

        return c.json({ success: true, message: "Client deleted" });
    });

    app.get("/api/protected/qbit-mirror-settings", async (c) => {
        const enabled = await getSetting<boolean>("qbitmirror.enabled");
        const mainId = await getSetting<number>("qbitmirror.main");

        return c.json({ enabled, mainId });
    });

    app.put("/api/protected/qbit-mirror-settings", async (c) => {
        const body = await c.req.json();
        const { enabled, mainId } = body;

        if (enabled !== undefined) {
            await setSetting("qbitmirror.enabled", String(enabled));
        }

        if (mainId !== undefined) {
            const existing = await prisma.qbitClients.findUnique({ where: { id: Number(mainId) } });
            if (!existing) {
                return c.json({ success: false, message: "Client not found" }, 404);
            }
            await setSetting("qbitmirror.main", String(mainId));
        }

        return c.json({ success: true });
    });

    app.post("/api/protected/setting", async (c) => {
        const body = await c.req.json();
        const { newUsername, newPassword } = body;

        const updated: string[] = [];

        if (newUsername) {
            await setSetting("username", newUsername);
            updated.push("username");
        }

        if (newPassword) {
            await setSetting("password", newPassword);
            updated.push("password");
        }

        if (updated.length === 0) {
            return c.json({ success: false, message: "No settings to update" }, 400);
        }

        return c.json({ success: true, message: `Updated: ${updated.join(", ")}` });
    });

    // GET settings
    app.get("/api/protected/arrdeadqueueremover", async (c) => {
        const stalledTime = await getSetting<string>("arrdeadqueueremover.time.stalled");

        const sonarrEnabled = await getSetting<boolean>("arrdeadqueueremover.sonarr.enabled");
        const sonarrUrl = await getSetting<string>("arrdeadqueueremover.sonarr.url");
        const sonarrApiKey = await getSetting<string>("arrdeadqueueremover.sonarr.apikey");

        const radarrEnabled = await getSetting<boolean>("arrdeadqueueremover.radarr.enabled");
        const radarrUrl = await getSetting<string>("arrdeadqueueremover.radarr.url");
        const radarrApiKey = await getSetting<string>("arrdeadqueueremover.radarr.apikey");

        return c.json({
            stalledTime,
            sonarr: {
                enabled: sonarrEnabled,
                url: sonarrUrl,
                apiKey: sonarrApiKey,
            },
            radarr: {
                enabled: radarrEnabled,
                url: radarrUrl,
                apiKey: radarrApiKey,
            },
        });
    });

    // PUT settings
    app.put("/api/protected/arrdeadqueueremover", async (c) => {
        const body = await c.req.json();
        const { stalledTime, sonarr, radarr } = body;

        if (stalledTime !== undefined) {
            await setSetting("arrdeadqueueremover.time.stalled", String(stalledTime));
        }

        if (sonarr !== undefined) {
            if (sonarr.enabled !== undefined) {
                await setSetting("arrdeadqueueremover.sonarr.enabled", String(sonarr.enabled));
            }
            if (sonarr.url !== undefined) {
                await setSetting("arrdeadqueueremover.sonarr.url", sonarr.url);
            }
            if (sonarr.apiKey !== undefined) {
                await setSetting("arrdeadqueueremover.sonarr.apikey", sonarr.apiKey);
            }
        }

        if (radarr !== undefined) {
            if (radarr.enabled !== undefined) {
                await setSetting("arrdeadqueueremover.radarr.enabled", String(radarr.enabled));
            }
            if (radarr.url !== undefined) {
                await setSetting("arrdeadqueueremover.radarr.url", radarr.url);
            }
            if (radarr.apiKey !== undefined) {
                await setSetting("arrdeadqueueremover.radarr.apikey", radarr.apiKey);
            }
        }

        return c.json({ success: true, message: "Settings updated" });
    });

    app.get("/api/protected/qbitipblocklist", async (c) => {
        const enabled = await getSetting<boolean>("qbitipblocklist.enabled");
        const link = await getSetting<string>("qbitipblocklist.link");
        const path = await getSetting<string>("qbitipblocklist.path");

        return c.json({ enabled, link, path });
    });

    app.put("/api/protected/qbitipblocklist", async (c) => {
        const body = await c.req.json();
        const { enabled, link, path } = body;

        if (enabled !== undefined) await setSetting("qbitipblocklist.enabled", String(enabled));
        if (link !== undefined) await setSetting("qbitipblocklist.link", link);
        if (path !== undefined) await setSetting("qbitipblocklist.path", path);

        return c.json({ success: true, message: "Settings updated" });
    });

    app.get("/api/protected/settings/account", async (c) => {
        const username = await getSetting<string>("username");
        return c.json({ username });
    });

    app.put("/api/protected/settings/account/username", async (c) => {
        const { username } = await c.req.json();

        if (!username || typeof username !== "string" || !username.trim()) {
            return c.json({ success: false, message: "Username cannot be empty." }, 400);
        }

        await setSetting("username", username.trim());
        return c.json({ success: true, message: "Username updated successfully." });
    });

    app.put("/api/protected/settings/account/password", async (c) => {
        const { currentPassword, newPassword } = await c.req.json();

        if (!currentPassword || !newPassword) {
            return c.json({ success: false, message: "Missing required fields." }, 400);
        }

        const storedPassword = await getSetting<string>("password");

        if (currentPassword !== storedPassword) {
            return c.json({ success: false, message: "Current password is incorrect." }, 401);
        }

        if (newPassword.length < 8) {
            return c.json({ success: false, message: "Password must be at least 8 characters." }, 400);
        }

        await setSetting("password", newPassword);
        return c.json({ success: true, message: "Password updated successfully." });
    });

    app.get("/api/protected/tasks", async (c) => {
        const tasks = await prisma.tasks.findMany({ orderBy: { id: "asc" } });
        return c.json(tasks);
    });

    app.put("/api/protected/tasks/:id", async (c) => {
        const id = Number(c.req.param("id"));
        const { cron, enabled } = await c.req.json();

        if (cron !== undefined && !cronValidate(cron)) {
            return c.json({ success: false, message: "Invalid cron expression." }, 400);
        }

        const task = await prisma.tasks.update({
            where: { id },
            data: {
                ...(cron !== undefined && { cron }),
                ...(enabled !== undefined && { enabled }),
            },
        });
        await syncJobs();
        return c.json({ success: true, task });
    });

    app.use("/*", serveStatic({ root: "../client/dist" }));
    app.get("/*", serveStatic({ path: "../client/dist/index.html" }));

    const server = Bun.serve({
        port: 3000,
        fetch: app.fetch,
    });

    console.log(`Server running at http://localhost:${server.port}`);
}