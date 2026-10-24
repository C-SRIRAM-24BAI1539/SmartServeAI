import app from "./app.js";
import { env } from "./config/env.js";

const server = app.listen(env.port, () => {
  console.log(`SmartServe AI API running at http://localhost:${env.port}`);
});

function shutdown(signal) {
  console.log(`${signal} received. Closing server...`);

  server.close((error) => {
    if (error) {
      console.error("Failed to close server:", error);
      process.exitCode = 1;
    }
  });
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));