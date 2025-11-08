import "./config/env.js"; // Load environment variables first
import app from "./app.js";
import { env } from "./config/env.js";
import logger from "./config/logger.js";

// Graceful shutdown handler
const shutdown = async (signal: string): Promise<void> => {
  logger.info(`Received ${signal}. Starting graceful shutdown...`);

  try {
    logger.info("Graceful shutdown completed");
    process.exit(0);
  } catch (error) {
    logger.error("Error during shutdown:", error);
    process.exit(1);
  }
};

// Handle graceful shutdown
process.on("SIGTERM", () => shutdown("SIGTERM"));
process.on("SIGINT", () => shutdown("SIGINT"));

// Handle uncaught exceptions
process.on("uncaughtException", (error) => {
  logger.error("Uncaught Exception:", error);
  process.exit(1);
});

process.on("unhandledRejection", (reason, promise) => {
  logger.error("Unhandled Rejection at:", { promise, reason });
  process.exit(1);
});

// Start the application
const startApp = async (): Promise<void> => {
  try {
    logger.info("Starting Backend API Server...");
    logger.info(`Environment: ${env.NODE_ENV}`);
    logger.info(`Port: ${env.PORT}`);

    // Start Express server
    const server = app.listen(env.PORT, () => {
      logger.info(`Express server running on port ${env.PORT}`);
      logger.info(`API available at http://localhost:${env.PORT}/api`);
    });

    logger.info("Application started successfully!");

    // Handle server shutdown
    const originalShutdown = shutdown;
    const enhancedShutdown = async (signal: string): Promise<void> => {
      server.close((err) => {
        if (err) {
          logger.error("Error closing Express server:", err);
        } else {
          logger.info("Express server stopped");
        }
      });
      await originalShutdown(signal);
    };

    // Update shutdown handlers
    process.removeAllListeners("SIGTERM");
    process.removeAllListeners("SIGINT");
    process.on("SIGTERM", () => enhancedShutdown("SIGTERM"));
    process.on("SIGINT", () => enhancedShutdown("SIGINT"));
  } catch (error) {
    logger.error("Failed to start application:", error);
    process.exit(1);
  }
};

startApp();
