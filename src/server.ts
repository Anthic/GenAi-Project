import http from "http";
import app from "./app";
import { env } from "./config/env";
import { database } from "./config/db";

const PORT = env.app.port;
const server = http.createServer(app);

// Graceful shutdown handler
const shutdown = async (signal: string): Promise<void> => {
  console.log(`\n[Server] ${signal} received. Shutting down gracefully...`);

  server.close(async () => {
    console.log("[Server] HTTP server closed");

    try {
      await database.disconnect();
      console.log("[Server] Shutdown complete");
      process.exit(0);
    } catch (err) {
      console.error("[Server] Error during shutdown:", err);
      process.exit(1);
    }
  });

  // Force kill if graceful shutdown takes too long
  setTimeout(() => {
    console.error("[Server] Forced shutdown after timeout");
    process.exit(1);
  }, 10_000);
};

// Unhandled errors — never let app crash silently
process.on("uncaughtException", (err: Error) => {
  console.error("[Process] Uncaught Exception:", err.message);
  process.exit(1);
});

process.on("unhandledRejection", (reason: unknown) => {
  console.error("[Process] Unhandled Rejection:", reason);
  process.exit(1);
});

process.on("SIGTERM", () => shutdown("SIGTERM")); // Docker / PM2 stop
process.on("SIGINT", () => shutdown("SIGINT")); // Ctrl+C

// Boot sequence
const bootstrap = async (): Promise<void> => {
  try {
    await database.connect();

    server.listen(PORT, () => {
      console.log(
        `[Server] Running on port ${PORT} | ENV: ${process.env.NODE_ENV}`,
      );
    });
  } catch (err) {
    console.error("[Server] Failed to start:", err);
    process.exit(1);
  }
};

bootstrap();
