require('dotenv').config();
const express = require("express");
const cookieParser = require('cookie-parser');
const path = require('path');
const logger = require("./utils/logger");
const morganMiddleware = require("./middleware/morganMiddleware");
const app = express();

app.use(morganMiddleware);

const userRouter = require('./routes/userRoutes');
const adminRouter = require('./routes/adminRoutes');
const authRouter = require('./routes/authRouter');
const profileRouter = require('./routes/profileRouter');
const inventoryRouter = require('./routes/inventoryRoutes');
const paymentRouter = require('./routes/paymentRoutes');
const announcementRouter = require('./routes/announcementRouter');

const { verifyToken } = require('./middleware/jwtMiddleware');
const authController = require('./controller/auth');

const cors = require('cors');
const mongoose = require('mongoose');
const helmet = require('helmet');
const slidingWindowLimiter = require('./middleware/rateLimiter');



const allowedOrigins = process.env.ALLOWED_ORIGINS 
  ? process.env.ALLOWED_ORIGINS.split(',').map(o => o.trim())
  : [
      'http://localhost:5173',
      'http://localhost:5174',
      'http://localhost:5500',
      'http://localhost:5501',
      'http://127.0.0.1:5500',
      'http://127.0.0.1:5501'
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



app.use(helmet());

app.set('view engine', 'ejs');





const PORT = process.env.PORT || 3000;
const DB_PATH = process.env.MONGO_URI;







// ── Sliding Window Rate Limiter on auth routes ───────────────────────────────
const authLimiter = slidingWindowLimiter({ windowMs: 15 * 60 * 1000, max: 5 });
app.use("/login", authLimiter);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use(cookieParser());

app.use(express.static("dist"));

app.use("/uploads", express.static(path.join(__dirname, "uploads")));



// ── Check login state (JWT) ───────────────────────────────────────────────────
app.get("/check-login", verifyToken, (req, res) => {
  res.set("Cache-Control", "no-store");
  res.json({
    isLoggedIn: true,
    role: req.user.role,
    isFirstLogin: req.user.isFirstLogin,
  });
});


// ── Token refresh endpoint ────────────────────────────────────────────────────
app.post("/auth/refresh", authController.handlePost_refresh);



app.use(authRouter);
app.use("/users", userRouter);
app.use("/admin", adminRouter);
app.use("/profile", profileRouter);
app.use("/inventory", inventoryRouter);
app.use("/payments", paymentRouter);
app.use("/api", announcementRouter);





// ── Global error handler ──────────────────────────────────────────────────────

app.use((err, req, res, next) => {

  let error = { ...err };

  error.message = err.message;



  // Log error for debugging
  logger.error(`${req.method} ${req.path} - ${err.message}`, {
    stack: err.stack,
    body: req.body,
    params: req.params,
    query: req.query,
    user: req.user?.id || 'anonymous'
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



module.exports = app;






// UPI ID	Result

// success@razorpay	✅ Payment succeeds
// failure@razorpay  ❌ Payment fails