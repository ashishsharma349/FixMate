const express = require("express");
const cookieParser = require('cookie-parser');
const path = require('path');
const app = express();
const seedAdmin = require("./seedAdmin");

const userRouter = require('./routes/userRoutes');
const adminRouter = require('./routes/adminRoutes');
const authRouter = require('./routes/authRouter');
const profileRouter = require('./routes/profileRouter');
const inventoryRouter = require('./routes/inventoryRoutes');
const seedInventory = require("./seedInventory");
const paymentRouter = require('./routes/paymentRoutes');

const session = require('express-session');
const MongoDbStore = require("connect-mongodb-session")(session);
const cors = require("cors");
const mongoose = require("mongoose");
const sessionHeaderMiddleware = require("./middleware/sessionHeader");
const rateLimit = require("express-rate-limit");

const allowedOrigins = [
  'http://127.0.0.1:5501',
  'http://localhost:5501',
  'http://localhost:5500',
  'http://127.0.0.1:5500',
  'http://localhost:5173'
];

app.use(cors({
  origin: function (origin, callback) {
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      callback(new Error('Not allowed by CORS'));
    }
  },
  credentials: true
}));

app.set('view engine', 'ejs');
app.set("views", "./views");
require('dotenv').config();

const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.MONGO_URI;
const SESSION_SECRET = process.env.SESSION_SECRET || "fixmate_secret";

const store = new MongoDbStore({
  uri: DB_PATH,
  collection: 'sessions',
});

// ── Session Header middleware: reads X-Session-Id header and injects as cookie
// This MUST run BEFORE express-session so it picks up the right session per-tab
app.use(sessionHeaderMiddleware(SESSION_SECRET));

app.use(session({
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: store,
  cookie: {
    httpOnly: true,
    sameSite: "lax",
    secure: false,
    maxAge: 1000 * 60 * 60 * 24 * 7
  }
}));

// ── Rate Limiting ─────────────────────────────────────────────────────────────
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // limit each IP to 100 requests per windowMs
  message: { error: "Too many requests from this IP, please try again later." },
  standardHeaders: true, // Return rate limit info in the `RateLimit-*` headers
  legacyHeaders: false, // Disable the `X-RateLimit-*` headers
});

// Apply rate limiting to all requests
app.use(limiter);

// Stricter rate limiting for auth routes
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // limit each IP to 5 auth requests per windowMs
  message: { error: "Too many authentication attempts, please try again later." },
  standardHeaders: true,
  legacyHeaders: false,
});

// Apply stricter rate limiting to auth routes
app.use("/api/auth", authLimiter);
app.use("/login", authLimiter);
app.use("/register", authLimiter);

app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(express.static("dist"));
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// ── Check login state ─────────────────────────────────────────────────────────
app.use("/check-login", (req, res) => {
  res.set("Cache-Control", "no-store");
  if (req.session.user) {
    res.json({
      isLoggedIn: true,
      role: req.session.user.role,
      isFirstLogin: req.session.user.isFirstLogin
    });
  } else {
    res.json({ isLoggedIn: false, role: null });
  }
});

app.use(authRouter);
app.use("/users", userRouter);
app.use("/admin", adminRouter);
app.use("/profile", profileRouter);
app.use("/inventory", inventoryRouter);
app.use("/payments", paymentRouter);

// ── Global error handler ──────────────────────────────────────────────────────
app.use((err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error for debugging
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path}:`, {
    error: err.message,
    stack: err.stack,
    body: req.body,
    params: req.params,
    query: req.query,
    user: req.session?.user?.id || 'anonymous'
  });

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = "Resource not found (Invalid ID format)";
    error = { message, statusCode: 400 };
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = "Duplicate field value entered";
    error = { message, statusCode: 400 };
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message).join(', ');
    error = { message, statusCode: 400 };
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    const message = "Invalid token";
    error = { message, statusCode: 401 };
  }

  if (err.name === 'TokenExpiredError') {
    const message = "Token expired";
    error = { message, statusCode: 401 };
  }

  // CORS errors
  if (err.message && err.message.includes('Not allowed by CORS')) {
    const message = "CORS: Origin not allowed";
    error = { message, statusCode: 403 };
  }

  // Rate limit errors
  if (err.status === 429) {
    const message = "Too many requests, please try again later";
    error = { message, statusCode: 429 };
  }

  // Multer file upload errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    const message = "File size too large";
    error = { message, statusCode: 400 };
  }

  if (err.code === 'LIMIT_FILE_COUNT') {
    const message = "Too many files uploaded";
    error = { message, statusCode: 400 };
  }

  // Default error
  const statusCode = error.statusCode || err.statusCode || 500;
  const message = error.message || "Internal server error";

  res.status(statusCode).json({ 
    error: message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

mongoose.connect(DB_PATH).then(async () => {
  console.log("[Database Name] :", mongoose.connection.name);
  console.log("Connected to MongoDB");
  seedAdmin();
  seedInventory();
  app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}).catch(err => {
  console.log("Error :" + err);
});


// UPI ID	Result
// success@razorpay	✅ Payment succeeds
// failure@razorpay  ❌ Payment fails