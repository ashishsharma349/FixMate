const { verifyToken, requireRole } = require("./jwtMiddleware");

// Re-export verifyToken as isLoggedIn for backward compatibility with existing route files
exports.isLoggedIn = verifyToken;

// isAdmin: verifyToken + admin role check (array of middleware)
exports.isAdmin = [verifyToken, requireRole("admin")];