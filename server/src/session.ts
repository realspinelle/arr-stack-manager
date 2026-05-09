// session.ts
import crypto from "crypto";

interface Session {
    token: string;
    createdAt: Date;
    expiresAt: Date;
}

const sessions = new Map<string, Session>();
const SESSION_DURATION_MS = 1000 * 60 * 60; // 1 hour

export function createSession(): string {
    const token = crypto.randomUUID();
    const now = new Date();
    sessions.set(token, {
        token,
        createdAt: now,
        expiresAt: new Date(now.getTime() + SESSION_DURATION_MS)
    });
    return token;
}

export function validateSession(token: string): boolean {
    const session = sessions.get(token);
    if (!session) return false;
    if (new Date() > session.expiresAt) {
        sessions.delete(token);
        return false;
    }
    return true;
}

export function deleteSession(token: string): void {
    sessions.delete(token);
}

// Cleanup expired sessions periodically
setInterval(() => {
    const now = new Date();
    for (const [token, session] of sessions.entries()) {
        if (now > session.expiresAt) {
            sessions.delete(token);
        }
    }
}, 1000 * 60 * 10); // Every 10 minutes