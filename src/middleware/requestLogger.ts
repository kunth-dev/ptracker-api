import type { NextFunction, Request, Response } from "express";
import logger from "../config/logger.js";

/**
 * Middleware to log incoming HTTP requests and outgoing responses
 */
export const requestLogger = (req: Request, res: Response, next: NextFunction): void => {
  const startTime = Date.now();
  let logged = false;

  // Log incoming request
  logger.info("Incoming request", {
    method: req.method,
    url: req.originalUrl || req.url,
    ip: req.ip,
    userAgent: req.get("User-Agent"),
  });

  // Helper function to log response (only once)
  const logResponse = () => {
    if (!logged) {
      const duration = Date.now() - startTime;
      logger.info("Outgoing response", {
        method: req.method,
        url: req.originalUrl || req.url,
        statusCode: res.statusCode,
        duration: `${duration}ms`,
      });
      logged = true;
    }
  };

  // Capture the original res.json and res.send to log response
  const originalJson = res.json.bind(res);
  const originalSend = res.send.bind(res);

  // Override res.json to log response
  res.json = (body: unknown): Response => {
    logResponse();
    return originalJson(body);
  };

  // Override res.send to log response (for non-JSON responses)
  res.send = (body: unknown): Response => {
    logResponse();
    return originalSend(body);
  };

  next();
};
