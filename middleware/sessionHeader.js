/**
 * Session Header Middleware
 * ─────────────────────────
 * Enables multi-tab login by reading session ID from X-Session-Id header
 * instead of relying on cookies (which are shared across all tabs).
 *
 * How it works:
 * 1. Frontend stores sessionId in sessionStorage (per-tab)
 * 2. Every API call sends X-Session-Id header
 * 3. This middleware injects it as a cookie before express-session processes it
 * 4. express-session loads the correct session from the store
 */
const cookieSignature = require("cookie-signature");

module.exports = function sessionHeaderMiddleware(secret) {
  return (req, res, next) => {
    const headerSessionId = req.headers["x-session-id"];
    if (!headerSessionId) return next(); // fallback to cookie-based session

    // Sign the session ID the same way express-session does
    const signed = cookieSignature.sign(headerSessionId, secret);
    // Inject as cookie so express-session picks it up automatically
    req.headers.cookie = `connect.sid=s%3A${encodeURIComponent(signed)}`;
    next();
  };
};
