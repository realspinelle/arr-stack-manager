import { PrismaPg } from "@prisma/adapter-pg";
import { PrismaClient } from "../generated/prisma/client";

const isDev = process.env.NODE_ENV !== "production";

const PROD_DATABASE_URL = "postgresql://arrstackmanager:weC0xWiNGqNxkbmP2MM5Bj0gW1NYo0cZ@localhost:5432/arrstackmanager?schema=public";

const adapter = new PrismaPg({ connectionString: isDev ? process.env.DATABASE_URL : PROD_DATABASE_URL });
export const prisma = new PrismaClient({ adapter });