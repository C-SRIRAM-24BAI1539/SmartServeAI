import { prisma } from "../../config/database.js";

export function getHealth(req, res) {
  res.status(200).json({
    success: true,
    message: "SmartServe AI API is running.",
    timestamp: new Date().toISOString(),
  });
}

export async function getDatabaseHealth(req, res) {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      success: true,
      message: "Database connection is healthy.",
      database: "PostgreSQL",
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    res.status(503).json({
      success: false,
      message: "Database connection failed.",
    });
  }
}