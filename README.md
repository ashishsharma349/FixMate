# FixMate — Society Complaint & Maintenance System

A full-stack web application for managing residential society complaints, staff assignments, inventory, finances, and maintenance fee collection. Built with the MERN stack as a final year project.

---

## Tech Stack

### Backend
- **Node.js & Express 5** — REST API server with async error handling
- **MongoDB Atlas & Mongoose** — Cloud-hosted NoSQL database with schema validation
- **JWT Authentication** — Stateless auth using access tokens (15 min) + refresh tokens (7 days, httpOnly cookie)
- **Bcrypt** — Password hashing with 10-round salt; no plain-text passwords stored
- **Helmet** — Sets secure HTTP headers (CSP, X-Frame-Options, HSTS, etc.)
- **Sliding Window Rate Limiter** — Custom middleware to block brute-force login attempts (5 per 15 min per IP)
- **Cloudinary** — Cloud storage for complaint images, proof-of-work photos, and bill receipts
- **Razorpay** — Payment gateway for online maintenance fee collection
- **Nodemailer** — Sends temporary passwords and system alerts via Gmail SMTP

### Frontend
- **React 19** with **Vite** — Fast dev server and optimized production builds
- **Tailwind CSS** — Utility-first styling
- **Recharts** — Admin dashboard charts (revenue vs expenses, complaint trends)
- **Lucide React** — Icon library

---

## Features

### Admin Dashboard
- Real-time stats: active complaints, staff workload, monthly revenue vs. expenses
- Create resident and staff accounts — system generates a temp password and emails it, user must change on first login
- Assign complaints to staff based on department and availability
- Set work type: "Personal" (billed to resident) or "Common Area" (billed to society fund)
- Inventory management with low-stock alerts and restock tracking (with bill image upload)
- Expense management — approve/reject repair costs, view society balance sheet
- Society-wide announcement broadcasts

### Staff Panel
- View assigned tasks with scheduling details
- Submit labour + inventory cost estimates
- Upload proof-of-work photos on task completion
- Log actual materials used (auto-deducted from inventory)

### Resident Portal
- File complaints with photo upload, category selection, and priority (Low / Medium / High)
- Track complaint status through the full lifecycle
- Approve or reject repair estimates for personal work
- Revoke staff assignment if unsatisfied (reopens the complaint)
- Pay monthly maintenance fees via Razorpay
- Double-entry payment verification for personal repairs — both staff and resident enter the amount paid; mismatches are flagged
- Rate staff after job completion

---

## Complaint Lifecycle

```
Pending → Assigned → EstimateSubmitted → EstimateApproved → InProgress → Resolved
                                                                  ↓
                                                          (Personal work only)
                                                          PaymentPending → Resolved
```

- **Personal work:** Resident approves estimates, pays staff directly. Both parties confirm the amount before the system marks it resolved.
- **Common area work:** Admin approves estimates. Cost is logged as a society expense on completion.

---

## Security

| Layer | Implementation |
|-------|---------------|
| Password Storage | Bcrypt hashing (10 salt rounds). Migration script included for existing accounts. |
| Authentication | JWT access + refresh token pair. Access token in sessionStorage (tab-isolated), refresh token in httpOnly cookie. |
| Token Refresh | Automatic silent refresh on 401 via centralized `apiFetch` utility — no user-facing logouts on token expiry. |
| Brute-Force Protection | Sliding window log rate limiter on `/login` — 5 attempts per 15 minutes per IP. |
| HTTP Headers | Helmet.js sets Content-Security-Policy, X-Frame-Options, Strict-Transport-Security, X-Content-Type-Options, and more. |
| CORS | Strict origin whitelist with credentials support. No wildcard origins. |
| Input Validation | express-validator on user and staff creation routes. |

---

## Project Structure

```
FixMate/
├── app.js                     # Express server, middleware chain, DB connection
├── .env                       # Environment variables (not committed)
├── config/
│   └── multerconfig.js        # Cloudinary + Multer file upload config
├── controller/
│   ├── admin.js               # Dashboard stats, user CRUD, expense management
│   ├── auth.js                # Login, signup, token refresh, password change
│   ├── inventory.js           # Stock levels, restocking with bill tracking
│   └── user.js                # Complaints, task completion, payment verification
├── middleware/
│   ├── authMiddleware.js      # Backward-compat auth wrappers (isLoggedIn, isAdmin)
│   ├── jwtMiddleware.js       # verifyToken, requireRole, adminOnly, staffOrAdmin
│   ├── rateLimiter.js         # Sliding window log rate limiter
│   └── validator.js           # express-validator rules for user/staff creation
├── model/
│   ├── Auth.js                # Email, hashed password, role, isFirstLogin
│   ├── Complain.js            # Full complaint schema with estimate + payment fields
│   ├── Finance.js             # Income/expense records for society accounting
│   ├── Inventory.js           # Item stock with restock history
│   ├── Payment.js             # Razorpay payment records
│   ├── RefreshToken.js        # Stored refresh tokens for revocation support
│   ├── User.js                # Resident profile (name, phone, flat, aadhaar)
│   └── staff.js               # Staff profile (department, rating, task count)
├── routes/                    # Express route definitions per module
├── scripts/
│   └── migrate-passwords.js   # One-time: hash all existing plain-text passwords
├── frontend/                  # React 19 + Vite app
│   └── src/
│       ├── Components/        # Page components (Admin, Staff, Resident views)
│       ├── Context/           # AuthContext (JWT state management)
│       └── utils/api.js       # Centralized fetch with auto token refresh
└── utils/
    ├── mailer.js              # Nodemailer transporter config
    └── pathUtil.js            # Root directory helper
```

---

## Setup

### Prerequisites
- Node.js v18+
- MongoDB Atlas cluster (or local MongoDB)
- Cloudinary account
- Razorpay test/live keys
- Gmail with App Password for Nodemailer

### Environment Variables

Create a `.env` file in the project root:

```env
MONGO_URI=mongodb+srv://user:pass@cluster.mongodb.net/dbName
JWT_SECRET=your_access_token_secret
JWT_REFRESH_SECRET=your_refresh_token_secret
JWT_ACCESS_EXPIRY=15m
JWT_REFRESH_EXPIRY=7d
CLOUDINARY_API_KEY=your_key
CLOUDINARY_API_SECRET=your_secret
RAZORPAY_KEY_ID=rzp_test_xxx
RAZORPAY_KEY_SECRET=your_secret
MAIL_USER=your@gmail.com
MAIL_PASS=your_gmail_app_password
```

### Install & Run

```bash
git clone https://github.com/ashishsharma349/FixMate
cd FixMate
npm install
cd frontend && npm install && cd ..

# Start backend (nodemon) + Tailwind watcher
npm start
```

- Backend: `http://localhost:3000`
- Frontend: `http://localhost:5173`

### First Login

An admin account is seeded using `ADMIN_EMAIL` and `ADMIN_PASSWORD` from `.env`. Log in as admin and create residents/staff from the dashboard. New users receive a temporary password via email and must change it on first login.

---

## Design Decisions

1. **Stateless JWT over Sessions** — No server-side session store needed. Each browser tab holds its own access token in sessionStorage, so one tab logging out doesn't affect others. Refresh tokens in httpOnly cookies survive page refreshes.

2. **Deterministic Logic over AI** — Financial calculations, status transitions, and payment verification use hardcoded business rules. For a system handling real money, every code path must be auditable and predictable.

3. **Double-Entry Payment Verification** — For personal repairs, both the staff and resident independently report the amount paid. The system only marks the payment as verified when both amounts match. Mismatches are flagged for re-entry or admin intervention.

4. **Sliding Window Rate Limiting** — Chose a sliding window log algorithm over the standard fixed-window approach. Fixed-window has a known burst vulnerability at window boundaries; the sliding window tracks individual timestamps for accurate throttling.

5. **Cloudinary over Local Storage** — Complaint photos and proof-of-work images are stored on Cloudinary instead of a local `uploads/` folder. This prevents data loss on server restarts or redeployment.

---

## Testing

```bash
npm test
npm run test:coverage
```

Uses Jest and Supertest with `mongodb-memory-server` for isolated integration tests.

---

## Remaining for Production Deployment

- [ ] Set `secure: true` on refresh token cookies (requires HTTPS)
- [ ] Set `NODE_ENV=production` to suppress error stack traces
- [ ] Add Razorpay webhook handler as a fallback for client-side payment verification

---

Built by Ashish — 2025-26.