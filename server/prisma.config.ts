import { defineConfig, env } from "prisma/config";

const isDev = process.env.NODE_ENV !== "production";

const PROD_DATABASE_URL = "postgresql://arrstackmanager:weC0xWiNGqNxkbmP2MM5Bj0gW1NYo0cZ@localhost:5432/arrstackmanager?schema=public";

export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations"
    },
    datasource: {
        url: isDev ? env("DATABASE_URL") : PROD_DATABASE_URL,
    },
});
