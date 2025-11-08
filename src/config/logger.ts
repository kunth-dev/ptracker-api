import path from "node:path";
import winston from "winston";
import { env } from "./env.js";

// Define log format
const logFormat = winston.format.combine(
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.errors({ stack: true }),
  winston.format.splat(),
  winston.format.json(),
);

// Console format for development
const consoleFormat = winston.format.combine(
  winston.format.colorize(),
  winston.format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
  winston.format.printf(({ timestamp, level, message, ...metadata }) => {
    let msg = `${timestamp} [${level}]: ${message}`;

    // Add metadata if present (excluding timestamp and level)
    const metaKeys = Object.keys(metadata).filter(
      (key) => key !== "timestamp" && key !== "level" && key !== "message",
    );

    if (metaKeys.length > 0) {
      msg += ` ${JSON.stringify(metadata)}`;
    }

    return msg;
  }),
);

// Create the logger instance
const logger = winston.createLogger({
  level: env.NODE_ENV === "production" ? "info" : "debug",
  format: logFormat,
  defaultMeta: { service: "crypton-backend" },
  transports: [
    // Console transport
    new winston.transports.Console({
      format: env.NODE_ENV === "production" ? logFormat : consoleFormat,
    }),
    // File transport for all logs
    new winston.transports.File({
      filename: path.join("logs", "combined.log"),
      format: logFormat,
    }),
    // File transport for errors only
    new winston.transports.File({
      filename: path.join("logs", "error.log"),
      level: "error",
      format: logFormat,
    }),
  ],
});

// Export logger instance
export default logger;
