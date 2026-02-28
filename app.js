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