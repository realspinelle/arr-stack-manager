import { defineConfig, env } from "prisma/config";

export default defineConfig({
    schema: "prisma/schema.prisma",
    migrations: {
        path: "prisma/migrations"
    },
    datasource: {
        url: env("DATABASE_URL") || "postgresql://arr-stack-manager:weC0xWiNGqNxkbmP2MM5Bj0gW1NYo0cZ@localhost:5432/arr-stack-manager?schema=public",
    },
});