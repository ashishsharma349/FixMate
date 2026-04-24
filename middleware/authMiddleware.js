exports.isLoggedIn = (req, res, next) => {
  if (req.session && req.session.isLoggedIn && req.session.user) {
    return next();
  }
  return res.status(401).json({ error: "Unauthorized. Please log in." });
};

// Middleware: only allow admin
exports.isAdmin = (req, res, next) => {
  if (req.session && req.session.user && req.session.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ error: "Forbidden. Admins only." });
};