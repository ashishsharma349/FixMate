# FixMate — Deep Project Documentation

> A society/apartment management system where residents file complaints, admins assign staff, staff complete work, and payments are tracked — all with session-based authentication.

---

## Table of Contents

1. [Project Overview & Purpose](#1-project-overview--purpose)
2. [Tech Stack & Dependencies](#2-tech-stack--dependencies)
3. [Folder Structure at a Glance](#3-folder-structure-at-a-glance)
4. [How the App Boots (app.js)](#4-how-the-app-boots-appjs)
5. [Database Models (The Data Blueprint)](#5-database-models-the-data-blueprint)
6. [Middleware (Gatekeepers)](#6-middleware-gatekeepers)
7. [Config (Setup Files)](#7-config-setup-files)
8. [Utils (Helper Tools)](#8-utils-helper-tools)
9. [Routes (URL Map)](#9-routes-url-map)
10. [Controllers (The Logic Layer)](#10-controllers-the-logic-layer)
11. [Seed Files (Database Pre-fill)](#11-seed-files-database-pre-fill)
12. [Complete Data Flow: End-to-End Request Lifecycle](#12-complete-data-flow-end-to-end-request-lifecycle)
13. [The Complaint Lifecycle — Step by Step](#13-the-complaint-lifecycle--step-by-step)
14. [The Payment System — How Money Moves](#14-the-payment-system--how-money-moves)
15. [Session System — Multi-Tab Login](#15-session-system--multi-tab-login)
16. [Environment Variables (.env)](#16-environment-variables-env)
17. [Frontend Architecture (React + Vite)](#17-frontend-architecture-react--vite)
18. [Known Design Decisions & Quirks](#18-known-design-decisions--quirks)

---

## 1. Project Overview & Purpose

FixMate is a **residential society complaint management system**. It has three user roles:

| Role | Who they are | What they can do |
|------|-------------|-----------------|
| **Admin** | Society manager | Creates accounts, assigns complaints to staff, approves estimates, generates maintenance bills, views reports |
| **Resident (User)** | Flat owner / tenant | Files complaints with photos, tracks status, pays monthly maintenance bills via Razorpay |
| **Staff** | Plumber / Electrician / Cleaner etc. | Views assigned complaints, submits cost estimates, submits completion proof with photo |

The system tracks a complaint from `Pending → Assigned → EstimatePending → EstimateApproved → InProgress → Resolved`, handling both **personal** (flat-specific, resident pays) and **common area** (society-funded) work.

---

## 2. Tech Stack & Dependencies

| Package | What it does |
|---------|-------------|
| `express` | The web framework. Handles all HTTP routes |
| `mongoose` | Connects to MongoDB and defines structured data models (Schemas) |
| `express-session` | Manages server-side sessions (login state stored in MongoDB) |
| `connect-mongodb-session` | Stores express sessions in MongoDB (persistent across server restarts) |
| `cookie-parser` | Parses cookies from HTTP requests (needed for session reading) |
| `cors` | Allows the frontend (Vite dev server on :5173 or live server on :5501) to talk to this backend |
| `bcrypt` | Hashes admin passwords (residents/staff use plain text for demo) |
| `nodemailer` | Sends emails — used to email temp passwords to new users/staff |
| `multer` | Handles image file uploads (complaint photos, completion proof, profile photos) |
| `razorpay` | Indian payment gateway — used for residents to pay monthly maintenance |
| `crypto` | Node built-in — used to verify Razorpay payment signatures (HMAC-SHA256) |
| `ejs` | Template engine for server-rendered HTML views (used minimally) |
| `express-validator` | Validates incoming form data (email format, password strength, etc.) |
| `cookie-signature` | Used in the custom session header middleware to sign session IDs |
| `uuid` | Generates unique IDs (used for reference IDs) |
| `dotenv` | Loads `.env` file variables into `process.env` |

---

## 3. Folder Structure at a Glance

```
FyProject/
├── app.js                  ← Entry point. Boots the server, connects DB, wires all routes
├── seedAdmin.js            ← Auto-creates admin account on first startup
├── seedInventory.js        ← Pre-fills inventory with default items on first startup
│
├── model/                  ← Mongoose schemas (what the database looks like)
│   ├── Auth.js             ← Login credentials (email, password, role)
│   ├── User.js             ← Resident profile (name, age, flat, phone, aadhaar)
│   ├── staff.js            ← Staff profile (name, dept, phone, aadhaar, availability)
│   ├── Complain.js         ← The core complaint object with full lifecycle
│   ├── Payment.js          ← Both personal (maintenance bills) and maintenance payments
│   ├── Inventory.js        ← Society stock items (pipes, paint, tools, etc.)
│   ├── Announcement.js     ← (Defined but not fully wired to routes yet)
│   └── finance.js          ← (Defined but not fully wired to routes yet)
│
├── controller/             ← The actual business logic for each domain
│   ├── auth.js             ← Login, logout, createUser, changePassword
│   ├── user.js             ← Complaint filing, staff fetch, assignment, task completion
│   ├── admin.js            ← Dashboard stats, complaint management, user/staff CRUD, reports
│   ├── inventory.js        ← CRUD for inventory items, auto-deduct on task completion
│   ├── payment.js          ← (Mostly commented out, logic moved to paymentRoutes.js)
│   ├── profile.js          ← Fetches user or staff profile info
│   └── staff.js            ← (Minimal — mostly handled in user.js and admin.js)
│
├── routes/                 ← Maps URL paths to controller functions
│   ├── authRouter.js       ← POST /login, POST /logout, POST /change-password
│   ├── userRoutes.js       ← /users/* — complaints, tasks, photo upload
│   ├── adminRoutes.js      ← /admin/* — all admin operations
│   ├── inventoryRoutes.js  ← /inventory/* — CRUD + low stock
│   ├── paymentRoutes.js    ← /payments/* — Razorpay + billing (logic is IN the route file)
│   ├── profileRouter.js    ← /profile/* — get my profile info
│   └── auth.js             ← (Legacy/unused route file)
│
├── middleware/             ← Functions that run BETWEEN request and controller
│   ├── authMiddleware.js   ← isLoggedIn() and isAdmin() guards
│   ├── sessionHeader.js    ← Enables multi-tab login via X-Session-Id header
│   └── validator.js        ← express-validator rules for createUser and changePassword
│
├── config/                 ← Third-party service configuration
│   ├── multerconfig.js     ← Sets up file upload (local disk, /uploads folder)
│   └── razorpay_config.js  ← Razorpay instance factory (used in paymentRoutes.js)
│
├── utils/                  ← Reusable helper modules
│   ├── mailer.js           ← Sends welcome email with temp password via Gmail/Nodemailer
│   └── pathUtil.js         ← Exports __dirname of the project root (legacy helper)
│
├── views/                  ← EJS templates (server-rendered HTML, minimal usage)
├── uploads/                ← Where uploaded images are stored on disk
├── dist/                   ← Built frontend static files (served as static)
└── .env                    ← All secrets and config (NOT committed to Git)
```

---

## 4. How the App Boots (`app.js`)

This is the **starting point** of the entire application. Here is what happens line by line when you run `node app.js`:

### Step 1 — Import everything
Every router and middleware file is imported at the top.

### Step 2 — CORS setup
```js
app.use(cors({ origin: allowedOrigins, credentials: true }));
```
**Why?** Your frontend (Vite on port 5173 or Live Server on 5501) is on a different port than the backend (3000). By default, browsers block cross-port requests. CORS explicitly allows these origins to send cookies and requests. `credentials: true` is critical — without it, session cookies would not be sent.

### Step 3 — Session Header Middleware (runs BEFORE express-session)
```js
app.use(sessionHeaderMiddleware(SESSION_SECRET));
```
**Why before session?** This middleware intercepts the `X-Session-Id` request header and injects it as a cookie, so `express-session` picks up the correct session for each browser tab. See [Section 15](#15-session-system--multi-tab-login).

### Step 4 — express-session
```js
app.use(session({ store: mongoStore, secret: SESSION_SECRET, ... }));
```
Sessions are stored in MongoDB (not memory). This means even if the server restarts, users stay logged in. Session cookies last **7 days** (`maxAge`).

### Step 5 — Body parsers and static files
```js
app.use(express.urlencoded({ extended: true }));  // form data
app.use(cookieParser());                            // read cookies
app.use(express.static("dist"));                   // serve frontend build
app.use("/uploads", express.static("uploads"));    // serve uploaded images
```

### Step 6 — /check-login endpoint
The frontend calls this on page load to know: Is the user logged in? What is their role? Should they be forced to change their password? It responds with `{ isLoggedIn, role, isFirstLogin }`.

### Step 7 — Mount all routers
```js
app.use(authRouter);             // POST /login, POST /logout, etc.
app.use("/users", userRouter);   // complaint filing, task completion
app.use("/admin", adminRouter);  // all admin operations
app.use("/profile", profileRouter);
app.use("/inventory", inventoryRouter);
app.use("/payments", paymentRouter);
```

### Step 8 — Connect to MongoDB, then start server
```js
mongoose.connect(DB_PATH).then(async () => {
  seedAdmin();      // create admin account if not exists
  seedInventory();  // pre-fill inventory items if empty
  app.listen(PORT);
});
```
The server only starts **after** the database connection is confirmed.

---

## 5. Database Models (The Data Blueprint)

Each model file defines a **Mongoose Schema** — the structure of a MongoDB collection.

---

### `Auth.js` — The Login Table

```
Auth {
  email:        String (unique)  — the login email
  password:     String (hidden)  — plain text for user/staff (select: false hides it by default)
  role:         "user" | "staff" | "admin"
  isFirstLogin: Boolean          — true until user changes their temp password
  createdAt:    Date
}
```

**Why a separate Auth model?** Profile info (name, flat, department) is stored separately in `User.js` or `staff.js`. This split keeps authentication clean. When you log in, you look up `Auth`. To get profile details, you look up `User` or `Staff` using the `authId` foreign key.

`password` has `select: false` — Mongoose **never returns it** by default. To read it, you must explicitly do `.select("+password")`. This prevents passwords from accidentally leaking.

---

### `User.js` — Resident Profile

```
User {
  authId:     ObjectId → Auth  — links to the login account
  name, age, phone, aadhaar (unique), flatNumber, photo, createdAt
}
```

**The relationship:** `User.authId → Auth._id`. When a user logs in via `Auth`, their `User` profile is fetched using this link.

---

### `staff.js` — Staff Profile

```
Staff {
  authId:      ObjectId → Auth
  name, phone, aadhaar (unique), photo
  department:  "Plumbing" | "Electrical" | "Carpentry" | "Cleaning" | "Security"
  isAvailable: Boolean   — true = free to take new tasks, false = currently assigned
  rating:      Number (1–5)
}
```

`isAvailable` is the key field. When admin assigns a complaint, it's set to `false`. When resolved, it goes back to `true`.

---

### `Complain.js` — The Core Model

This is the heart of the system. Every complaint goes through a **state machine**:

```
Pending → Assigned → EstimatePending → EstimateApproved → InProgress → Resolved
```

```
Complain {
  image_url, title, category, description   — basic info (photo REQUIRED)
  status:         "Pending" | "Assigned" | "EstimatePending" | "EstimateApproved" | "InProgress" | "Resolved"
  priority:       "Low" | "Medium" | "High" | "Emergency"
  resident:       ObjectId → User    — who filed it
  assignedStaff:  ObjectId → Staff   — who is working on it

  workType:       "Personal" | "CommonArea" | null
    // Personal   = resident's flat issue, resident pays via Razorpay
    // CommonArea = society property issue, society pays from fund

  estimatedCost:  Number   — staff submits their labour estimate
  estimateStatus: "Pending" | "Approved" | "Rejected" | null
    // Personal work → auto-Approved (no admin step needed)
    // CommonArea   → goes to admin for approval

  proofImage, worklog, actualCost   — submitted by staff on completion
  materialsUsed:  Array    — [{name, qty}] items used from inventory
  revokedAt, revokeReason           — if resident cancelled the staff assignment
}
```

**Why workType matters:** It controls the entire financial and approval flow.

---

### `Payment.js` — Two Types of Payments

One model handles two completely different payment scenarios:

```
Payment {
  type: "personal" | "maintenance"

  // Personal payment (resident paying monthly maintenance bill):
  resident, flatNumber, amount, dueDate, status ("Pending"|"Paid"|"Overdue")
  razorpayOrderId, razorpayPaymentId, razorpaySignature
  month, year   — which month's bill

  // Maintenance payment (society paying staff for CommonArea work):
  complaint, worker, workerName, purpose

  // Shared:
  refId:   String (unique)  — e.g. "PER-00001" or "MAN-00003"
  paidAt:  Date
}
```

---

### `Inventory.js` — Society Stock

```
Inventory {
  name (unique), category, unit ("pcs"|"kg"|"L"|"m"|"rolls")
  quantity:    Number   — current stock count
  minQuantity: Number   — below this = low stock alert (default 5)
  unitPrice, supplier, updatedAt  — auto-updated on every save via pre-save hook
}
```

---

## 6. Middleware (Gatekeepers)

Middleware runs **between** the request arriving and the controller handling it.

### `authMiddleware.js`

```js
exports.isLoggedIn = (req, res, next) => {
  if (req.session?.isLoggedIn && req.session?.user) return next();
  return res.status(401).json({ error: "Unauthorized. Please log in." });
};

exports.isAdmin = (req, res, next) => {
  if (req.session?.user?.role === "admin") return next();
  return res.status(403).json({ error: "Forbidden. Admins only." });
};
```

**How they're used:** `router.get("/something", isLoggedIn, isAdmin, controller)` — request goes through guards first, then controller.

---

### `sessionHeader.js` — The Multi-Tab Problem Solver

**The Problem:** Browser cookies are shared across all tabs. If you open Admin in Tab 1 and Resident in Tab 2, they'd share the same session — wrong!

**The Solution:** Frontend stores `sessionId` in **`sessionStorage`** (per-tab). On every API call it sends `X-Session-Id: <sessionId>`. This middleware intercepts that header and **injects it as a cookie** before `express-session` processes it.

```js
const headerSessionId = req.headers["x-session-id"];
if (!headerSessionId) return next(); // fallback to normal cookie
const signed = cookieSignature.sign(headerSessionId, secret);
req.headers.cookie = `connect.sid=s%3A${encodeURIComponent(signed)}`;
next();
```

**Why before express-session?** Because express-session reads `req.headers.cookie` during initialization. If this ran after, it would be too late.

---

### `validator.js` — Input Validation Rules

- `createUserRules` — name length, valid Gmail, userType, Indian mobile number, age (users), department (staff)
- `changePasswordRules` — 8+ chars with uppercase, lowercase, digit, special char. Confirm must match.
- `validate()` — collects errors and returns 400 JSON if any exist

---

## 7. Config (Setup Files)

### `multerconfig.js` — File Upload Setup

```js
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadDir),  // save to /uploads
  filename: (req, file, cb) => {
    const uniqueName = Date.now() + "_" + Math.random().toString(36).substring(2, 8) + ext;
    cb(null, uniqueName); // e.g. "1709834521234_ab3f7.jpg"
  }
});
```

**Why unique filenames?** If two users upload `photo.jpg`, without unique names the second file overwrites the first.

**File filter:** Only `jpg`, `jpeg`, `png` accepted.

> **Note:** The commented-out code shows the original plan was to use **Cloudinary** (cloud image storage). It was switched to local disk storage. Switch back to Cloudinary for production deployment.

---

## 8. Utils (Helper Tools)

### `mailer.js` — Email Sender

Uses `nodemailer` with Gmail to send welcome emails when new users or staff are created.

**How it connects:** Called from `controller/auth.js → handlePost_createUser()` after successfully creating Auth + User/Staff records.

**Gmail setup required:** `.env` needs `MAIL_USER` (Gmail address) and `MAIL_PASS` (Gmail App Password). Enable 2FA and create an App Password in Google Account → Security → App Passwords.

---

## 9. Routes (URL Map)

### `authRouter.js`

| Method | URL | What it does |
|--------|-----|--------------|
| POST | `/login` | Validate credentials, create session |
| POST | `/logout` | Destroy session, clear cookie |
| POST | `/create-user` | Admin creates user or staff account |
| POST | `/change-password` | User changes their temp password |

---

### `userRoutes.js` — Mounted at `/users`

| Method | URL | What it does |
|--------|-----|--------------|
| POST | `/users/complains` | Resident files complaint (with photo via multer) |
| GET | `/users/All-Complains` | Resident sees own / Admin sees all |
| GET | `/users/All-Staff` | Staff list for assignment dropdowns |
| PATCH | `/users/Assign-Complain` | Assign complaint to staff |
| GET | `/users/Task` | Staff fetches their assigned tasks |
| POST | `/users/profile/photo` | Upload profile photo |
| POST | `/users/submit-estimate` | Staff submits cost estimate |
| POST | `/users/complete-task` | Staff submits completion proof + materials |
| PATCH | `/users/revoke-complaint` | Resident cancels staff (Personal work only) |

---

### `adminRoutes.js` — Mounted at `/admin`

The **entire router** checks `role === "admin"` — every single request is protected.

| Method | URL | What it does |
|--------|-----|--------------|
| GET | `/admin/dashboard-stats` | Complaint counts, recent items, low-stock alerts |
| GET | `/admin/monthly-stats` | Complaints per month (chart data) |
| GET | `/admin/complaints` | All complaints list |
| POST | `/admin/assign-complaint` | Assign complaint to staff + set workType |
| POST | `/admin/handle-estimate` | Approve or reject staff cost estimate |
| POST | `/admin/resolve-complaint` | Mark complaint as Resolved |
| GET/POST/PUT/DELETE | `/admin/users/*` | Full CRUD for residents |
| GET/POST/PUT/DELETE | `/admin/staff/*` | Full CRUD for staff |
| GET | `/admin/reports-data` | Full analytics data |
| PUT | `/admin/settings/profile` | Admin updates own email/password |

---

### `paymentRoutes.js` — Mounted at `/payments`

| Method | URL | Who | What it does |
|--------|-----|-----|--------------|
| GET | `/payments/list` | Admin | All payments |
| GET | `/payments/my-payments` | Resident | Their own bills |
| GET | `/payments/monthly-revenue` | Admin | Revenue chart data |
| POST | `/payments/generate-monthly` | Admin | Creates this month's bills for ALL residents |
| POST | `/payments/create-order` | Resident | Creates Razorpay order |
| POST | `/payments/verify` | Resident | Verifies Razorpay signature → marks as Paid |
| POST | `/payments/maintenance` | Admin | Manually logs maintenance payment |
| POST | `/payments/mark-paid` | Admin | Confirms cash payment |
| PUT/DELETE | `/payments/:id` | Admin | Edit/delete payment record |

---

## 10. Controllers (The Logic Layer)

### `controller/auth.js`

**`handlePost_login`**
1. Find `Auth` by email (`.select("+password")` to include hidden field)
2. Compare password (plain text for demo)
3. Fetch matching `User` or `Staff` profile
4. Store in `req.session.user`: `{ id, email, role, profileId, isFirstLogin }`
5. Call `req.session.save()` → persist to MongoDB before responding
6. Return `{ success, role, isFirstLogin, sessionId }` — frontend stores `sessionId` in `sessionStorage`

**`handlePost_createUser`** (Admin creates accounts)
1. Validate fields
2. Check email not already in `Auth`
3. Generate random 8-char temp password (upper + lower + digit + special)
4. Create `Auth` record
5. Create `User` or `Staff` profile linked to Auth
6. **Rollback:** If step 5 fails, delete the Auth created in step 4 (prevents orphaned records)
7. Send welcome email with temp password

**`handlePost_changePassword`**
1. Verify current password
2. Update to new password
3. Set `isFirstLogin = false` in DB and in session

---

### `controller/user.js`

**`handlePost_fileUpload`** — Multer already processed the file. Builds `Complain` object with `resident: req.session.user.id`.

**`ShowComplains`** — Admins see ALL (`filter = {}`). Residents see only theirs (`filter = { resident: sessionUser.id }`). Uses `.populate()` to replace ObjectId with actual names.

**`submitEstimate`** — If `workType === "Personal"` → auto-approved. If `"CommonArea"` → set to Pending for admin approval.

**`completeTask`** — Requires proof image. For CommonArea + materials: calls `deductMaterials()` from inventory.js. For CommonArea: auto-creates a `maintenance` Payment record.

**`revokeStaff`** — Only for Personal work, only before work starts. Resets complaint to Pending, frees up staff.

---

### `controller/admin.js`

**`getDashboardStats`** — Runs 4 count queries in **parallel** using `Promise.all` for performance.

**`assignComplaint`** — Admin sets both `assignedStaff` AND `workType`. `workType` controls the entire downstream flow.

**`handleEstimate`** — Approved → `EstimateApproved`. Rejected → back to `Assigned` (staff must re-submit).

**`resolveComplaint`** — Sets `"Resolved"`, frees up staff (`isAvailable: true`).

**`getReportsData`** — 6 count queries + 4 aggregation pipelines. Income = sum of `personal` paid payments. Expense = sum of `maintenance` paid payments.

---

### `controller/inventory.js`

**`deductMaterials(materialsUsed)`** — Internal function (not an HTTP route). Called by `completeTask()` for CommonArea work:
```js
await Inventory.findOneAndUpdate(
  { name: mat.name },
  { $inc: { quantity: -Math.abs(mat.qty) }, $max: { quantity: 0 } }
  // $max: { quantity: 0 } ensures stock never goes below 0
);
```

**`getLowStock`** — Returns items where `quantity < minQuantity`. Used by admin dashboard for alerts.

---

## 11. Seed Files (Database Pre-fill)

### `seedAdmin.js`
Runs every startup. Checks if admin exists first (idempotent). Creates admin from `ADMIN_EMAIL` + `ADMIN_PASSWORD` in `.env`.

### `seedInventory.js`
Same pattern. Pre-fills ~30 default inventory items across all categories if inventory is empty.

---

## 12. Complete Data Flow: End-to-End Request Lifecycle

```
Browser sends HTTP Request (with X-Session-Id header)
      │
      ├─ 1. CORS check
      ├─ 2. sessionHeaderMiddleware → inject session as cookie
      ├─ 3. express-session → load session from MongoDB → req.session.user populated
      ├─ 4. Body parsing → req.body available
      ├─ 5. Route matching → correct router selected
      ├─ 6. Route middleware → isLoggedIn? isAdmin? multer? validate?
      ├─ 7. Controller → business logic → MongoDB queries
      └─ 8. res.json({...}) → response sent back
```

---

## 13. The Complaint Lifecycle — Step by Step

```
RESIDENT: Files complaint (POST /users/complains)
    status = "Pending", assignedStaff = null

ADMIN: Assigns staff (POST /admin/assign-complaint)
    Body: { complaintId, staffId, workType: "Personal" | "CommonArea" }
    status = "Assigned", staff.isAvailable = false

STAFF: Submits cost estimate (POST /users/submit-estimate)
    IF Personal  → estimateStatus = "Approved" (auto), status = "EstimateApproved"
    IF CommonArea → estimateStatus = "Pending", status = "EstimatePending"

[ADMIN only for CommonArea]: Approves/Rejects estimate (POST /admin/handle-estimate)
    Approved → status = "EstimateApproved"
    Rejected → status = "Assigned" (staff re-estimates)

STAFF: Submits completion proof (POST /users/complete-task)
    status = "InProgress"
    CommonArea + materials → deductMaterials() on Inventory
    CommonArea → auto-create maintenance Payment record

ADMIN: Resolves complaint (POST /admin/resolve-complaint)
    status = "Resolved", staff.isAvailable = true

[OPTIONAL] RESIDENT: Revoke staff for Personal work (PATCH /users/revoke-complaint)
    Only if status is Assigned/EstimatePending/EstimateApproved
    → status = "Pending", assignedStaff = null, staff.isAvailable = true
```

---

## 14. The Payment System — How Money Moves

### Flow A: Personal Maintenance Bills (Resident Pays via Razorpay)

```
1. ADMIN: POST /payments/generate-monthly
   → Creates Pending Payment for EVERY resident (refId: "PER-00001")

2. RESIDENT: POST /payments/create-order { paymentId }
   → Calls Razorpay API → creates order → stores razorpayOrderId

3. FRONTEND: Opens Razorpay checkout popup
   → Resident pays → callback returns { order_id, payment_id, signature }

4. RESIDENT: POST /payments/verify { razorpay_order_id, razorpay_payment_id, razorpay_signature }
   → Backend: HMAC-SHA256(orderId + "|" + paymentId, SECRET_KEY) === signature?
   → Valid → status = "Paid"
   → Invalid → 400 error
```

### Flow B: Maintenance Fund (Society Pays for CommonArea Work)

Auto-created when staff completes CommonArea task. Records expense in the finance reports.

### Testing Razorpay (Test Mode)
- `success@razorpay` → Payment succeeds ✅
- `failure@razorpay` → Payment fails ❌

---

## 15. Session System — Multi-Tab Login

```
LOGIN RESPONSE:
  Backend returns { ..., sessionId: req.sessionID }
  Frontend: sessionStorage.setItem("fixmate_sid", sessionId)   ← per-tab!

EVERY API CALL:
  Frontend adds: X-Session-Id: <sessionId from sessionStorage>

SERVER (sessionHeader.js):
  Signs the sessionId → injects as cookie
  express-session loads the CORRECT session for this tab

RESULT:
  Tab 1 (admin session) always loads admin session ✓
  Tab 2 (resident session) always loads resident session ✓
```

---

## 16. Environment Variables (.env)

```env
MONGO_URI=mongodb+srv://username:password@cluster/fixmate
SESSION_SECRET=your_random_long_secret
PORT=3000

ADMIN_EMAIL=admin@example.com
ADMIN_PASSWORD=YourAdminPassword123

MAIL_USER=your.gmail@gmail.com
MAIL_PASS=gmail_app_password         # NOT your real Gmail password

EMAIL_USER=your.gmail@gmail.com      # Also used in admin.js
EMAIL_PASS=gmail_app_password

RAZORPAY_KEY_ID=rzp_test_xxxxxxxxxxxx
RAZORPAY_KEY_SECRET=your_razorpay_secret
```

> `MAIL_PASS` is a Gmail **App Password**. Enable 2-Step Verification → Google Account → Security → App Passwords → Generate.

---

## 17. Frontend Architecture (React + Vite)

The frontend is built with **React**, bundled by **Vite**, and styled using **Tailwind CSS**. It is decoupled from the backend and communicates purely via REST APIs.

### 1. State Management (`Context/AuthContext.jsx`)
Instead of Redux, the app uses React's native **Context API** for global state. `AuthContext` wraps the entire app and holds:
- `isLoggedIn` (boolean or null while loading)
- `role` ("user", "staff", "admin")
- `isFirstLogin` (boolean)

On initial load, `useEffect` inside `AuthContext` automatically calls `/check-login` to verify the user's active session and restore their state across page reloads.

### 2. Routing Logic (`App.jsx`)
`react-router-dom` handles all page navigation with strict role-based access control:
- **Pending verification (`isLoggedIn === null`):** Shows a full-screen loading spinner.
- **Admin role:** Returns a dedicated, full-screen `<AdminDashboard />` without the common header.
- **Not logged in:** Restricts access to the `/login` route. All other paths redirect to `/login`.
- **User / Staff roles:** Renders a shared `<Header />` layout. Users can access `/FileComplain`, `/All-Complains`, etc., while Staff can only access `/Assigned-Tasks`. If a user tries to access a staff route, they are redirected to `/`.

### 3. API Communication (`utils/api.js`)
All outgoing API calls are routed through custom fetch wrappers (`apiFetch` and `jsonAuthHeaders`). 
- **Session Handling:** These wrappers retrieve the `fixmate_sid` from `sessionStorage` and attach it as the `X-Session-Id` HTTP header.
- **Storage Strategy:** The session ID is stored in both `sessionStorage` (for multi-tab isolation) and `localStorage` (as a persistent fallback).
- **Error Handling:** Centralized error throwing inside `apiFetch` simplifies the `try/catch` blocks inside React components.

### 4. Key UI Components
- **`AdminDashboard.jsx`**: Acts as a mini single-page application for the admin. It manages its own internal views (Overview, Complaints, Users, Staff, Inventory, Payments) swapping them out based on sidebar clicks rather than URL route changes.
- **`header.jsx`**: Shared navigation bar for Residents and Staff. It dynamically renders links based on the `role` provided by `AuthContext`.
- **`usePolling.js` (Custom Hook)**: Used by components like the Staff's task board to auto-refresh data from the backend every 15 seconds without requiring manual page reloads.

---

## 18. Known Design Decisions & Quirks

### 1. Plain-text passwords (for demo)
User/staff passwords are stored as plain text for easy demo/testing. Admin passwords use bcrypt. **Hash all passwords before production.**

### 2. Dual email functions
- `utils/mailer.js → sendTempPasswordMail()` — used by `controller/auth.js`
- Inline `sendTempPasswordEmail()` in `controller/admin.js`

They do the same thing but are written separately. Merge into `utils/mailer.js` when refactoring.

### 3. `payment.js` controller is all commented out
All payment logic lives directly in `routes/paymentRoutes.js` (unusual pattern — typically business logic goes in controllers).

### 4. Cloudinary → Local disk
`config/multerconfig.js` has commented Cloudinary code. Current code saves to `/uploads` locally. Switch back to Cloudinary for cloud deployment.

### 5. `completeTask` sets status to "InProgress" — not "Resolved"
After staff submits proof, status is `"InProgress"` not `"Resolved"`. Admin must explicitly resolve it — gives admin a chance to review the proof first.

### 6. `workType` controls everything
Set by admin at assignment time. Determines:
- Whether estimate needs admin approval
- Whether materials are deducted from inventory
- Whether a maintenance payment is auto-created
- Whether resident pays (Personal) or society fund covers it (CommonArea)

### 7. Reports Income vs Expense
- **Income** = sum of `personal` payments with `status = "Paid"` (money IN from residents)
- **Expense** = sum of `maintenance` payments with `status = "Paid"` (money OUT for work)

---

*FixMate Project — Deep Architecture Documentation*
*Last updated: March 2026*
