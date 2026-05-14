const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET || "fxm_acc_fallback";

/**
 * verifyToken — Extracts and verifies the access token from Authorization header.
 * On success, attaches decoded payload to req.user with shape:
 *   { id, email, role, profileId, isFirstLogin }
 */
function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    // Attach user payload — same shape as old req.session.user
    req.user = {
      id: decoded.id,
      email: decoded.email,
      role: decoded.role,
      profileId: decoded.profileId,
      isFirstLogin: decoded.isFirstLogin,
    };
    next();
  } catch (err) {
    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ error: "Token expired", expired: true });
    }
    return res.status(401).json({ error: "Invalid token" });
  }
}

/**
 * requireRole — Factory middleware that checks req.user.role against allowed roles.
 * Usage: requireRole("admin") or requireRole("admin", "staff")
 */
function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({ error: "Access denied. Not authenticated." });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({ error: `Forbidden. Requires: ${roles.join(" or ")}` });
    }
    next();
  };
}

// Convenience shortcuts
const adminOnly = requireRole("admin");
const staffOrAdmin = requireRole("admin", "staff");

module.exports = { verifyToken, requireRole, adminOnly, staffOrAdmin };
