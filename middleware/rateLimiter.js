/**
 * Sliding Window Log Rate Limiter
 * ────────────────────────────────
 * Stores a log of request timestamps per IP. On each request,
 * removes entries older than the window, then checks if the
 * count exceeds the limit.
 */

function slidingWindowLimiter({ windowMs = 15 * 60 * 1000, max = 5, message } = {}) {
  const ipLogs = new Map(); // IP → [timestamp, timestamp, ...]

  // Periodic cleanup: remove stale IPs every 5 minutes
  setInterval(() => {
    const now = Date.now();
    for (const [ip, timestamps] of ipLogs) {
      const filtered = timestamps.filter((t) => now - t < windowMs);
      if (filtered.length === 0) {
        ipLogs.delete(ip);
      } else {
        ipLogs.set(ip, filtered);
      }
    }
  }, 5 * 60 * 1000);

  return (req, res, next) => {
    const ip = req.ip || req.connection.remoteAddress;
    const now = Date.now();

    // Get or create log for this IP
    let timestamps = ipLogs.get(ip) || [];

    // Remove entries outside the sliding window
    timestamps = timestamps.filter((t) => now - t < windowMs);

    if (timestamps.length >= max) {
      const oldestInWindow = timestamps[0];
      const retryAfterMs = windowMs - (now - oldestInWindow);
      const retryAfterSec = Math.ceil(retryAfterMs / 1000);

      res.set("Retry-After", String(retryAfterSec));
      return res.status(429).json(
        message || {
          error: "Too many attempts. Please try again later.",
          retryAfterSeconds: retryAfterSec,
        }
      );
    }

    // Log this request
    timestamps.push(now);
    ipLogs.set(ip, timestamps);
    next();
  };
}

module.exports = slidingWindowLimiter;
