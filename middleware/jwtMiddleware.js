const jwt = require("jsonwebtoken");

const JWT_SECRET = process.env.JWT_SECRET;


function verifyToken(req, res, next) {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res.status(401).json({ error: "Access denied. No token provided." });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
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
const adminOnly = [verifyToken, requireRole("admin")];
const staffOrAdmin = [verifyToken, requireRole("admin", "staff")];

module.exports = { verifyToken, requireRole, adminOnly, staffOrAdmin };
