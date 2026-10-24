import { PrismaClient } from "@prisma/client";
import { PrismaNeon } from "@prisma/adapter-neon";
import { env } from "./env.js";

const adapter = new PrismaNeon({
  connectionString: env.databaseUrl,
});

export const prisma = new PrismaClient({
  adapter,
});