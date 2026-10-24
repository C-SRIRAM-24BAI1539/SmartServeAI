
import dotenv from "dotenv";

dotenv.config();

const port = Number(process.env.PORT ?? 5000);
const databaseUrl = process.env.DATABASE_URL;
const jwtSecret = process.env.JWT_SECRET;
const jwtExpiresIn = process.env.JWT_EXPIRES_IN ?? "1d";

if (!Number.isInteger(port) || port < 1 || port > 65535) {
  throw new Error("PORT must be a valid port number.");
}

if (!databaseUrl) {
  throw new Error("DATABASE_URL is missing from the server environment.");
}

if (!jwtSecret || jwtSecret.length < 32) {
  throw new Error("JWT_SECRET must contain at least 32 characters.");
}

export const env = Object.freeze({
  port,
  clientUrl: process.env.CLIENT_URL ?? "http://localhost:5173",
  nodeEnv: process.env.NODE_ENV ?? "development",
  databaseUrl,
  jwtSecret,
  jwtExpiresIn,
});