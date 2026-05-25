const morgan = require("morgan");
const logger = require("../utils/logger");

// Define stream to redirect Morgan HTTP logs to Winston
const stream = {
  write: (message) => logger.info(message.trim()),
};

// Skip logging HTTP requests when running tests
const skip = () => {
  const env = process.env.NODE_ENV || "development";
  return env === "test";
};

// Build the Morgan middleware
const morganMiddleware = morgan(
  ":method :url :status :res[content-length] - :response-time ms",
  { stream, skip }
);

module.exports = morganMiddleware;
