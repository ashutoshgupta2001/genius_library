import { v4 as uuidv4 } from "uuid";
import { createNamespace } from "cls-hooked";
import { createLogger, format, transports } from "winston";

// Create a namespace for storing the unique identifier
const session = createNamespace("request-session");

// Create a logger instance
const logger = createLogger({
  level: "info", // You can change this to 'debug', 'warn', or 'error'
  format: format.combine(
    format.timestamp({ format: "YYYY-MM-DD HH:mm:ss" }),
    format.printf(({ timestamp, level, message, stack }) => {
      const requestId = session.get("requestId") || "no-id";

      // If the message is an instance of Error, log the stack trace
      if (message instanceof Error) {
        return `[${timestamp}] [${requestId}] ${level.toUpperCase()}: ${
          message.message
        }\n${stack}`;
      }

      // For normal messages, just log them
      return `[${timestamp}] [${requestId}] ${level.toUpperCase()}: ${message}`;
    })
  ),
  transports: [
    new transports.Console(),
    new transports.File({ filename: "app.log" }),
  ],
});

// Middleware to create a unique ID for each request
function assignRequestId(req, res, next) {
  session.run(() => {
    const requestId = uuidv4();
    session.set("requestId", requestId);
    logger.info("Request ID assigned: " + requestId);
    next();
  });
}

export { assignRequestId, logger, session };
