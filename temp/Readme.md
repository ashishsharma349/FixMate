# FixMate 🔧

A **society / apartment maintenance management system** — residents file complaints, admins assign staff, staff complete work, and payments are tracked end-to-end.

---

## Tech Stack

| Layer | Technology |
|-------|-----------|
| Backend | Node.js, Express.js |
| Database | MongoDB + Mongoose |
| Auth | express-session (tab-isolated via X-Session-Id header) |
| Payments | Razorpay |
| Email | Nodemailer (Gmail) |
| File Uploads | Multer (local disk) |
| Frontend | React + Vite (in `/frontend`) |
| Styling | Tailwind CSS |
| Charts | Recharts |

---

## Roles

| Role | Access |
|------|--------|
| **Admin** | Full control — creates accounts, assigns complaints, approves budgets, manages inventory, views reports |
| **Resident** | Files complaints with photo, tracks status, pays monthly maintenance bills |
| **Staff** | Views assigned tasks, submits cost estimates, submits completion proof |

---

## Complaint Lifecycle

```
Pending → Assigned → EstimatePending → EstimateApproved → InProgress → Resolved
```

- **Personal** work (resident's flat): estimate auto-approved, resident pays via Razorpay
- **CommonArea** work (society property): admin approves estimate, society fund covers cost

---

## Project Structure

```
FyProject/
├── app.js                  ← Entry point
├── seedAdmin.js            ← Auto-seeds admin on startup
├── seedInventory.js        ← Auto-seeds default inventory
├── model/                  ← Mongoose schemas
│   ├── Auth.js             ← Login credentials
│   ├── User.js             ← Resident profiles
│   ├── staff.js            ← Staff profiles
│   ├── Complain.js         ← Complaints (full lifecycle)
│   ├── Payment.js          ← Personal bills + maintenance fund
│   └── Inventory.js        ← Society stock items
├── controller/             ← Business logic
├── routes/                 ← URL → controller mapping
├── middleware/             ← Auth guards, session header, validator
├── config/                 ← Multer, Razorpay setup
├── utils/                  ← Mailer, path helper
└── frontend/               ← React app (Vite)
```

---

## API Reference

### Auth
| Method | URL | Description |
|--------|-----|-------------|
| POST | `/login` | Login — returns sessionId |
| POST | `/logout` | Destroy session |
| POST | `/create-user` | Admin creates user/staff account |
| POST | `/change-password` | Change temp password on first login |
| GET | `/check-login` | Check session state |

### Complaints (`/users`)
| Method | URL | Description |
|--------|-----|-------------|
| POST | `/users/complains` | File a complaint (with photo) |
| GET | `/users/All-Complains` | View complaints |
| PATCH | `/users/Assign-Complain` | Assign staff to complaint |
| GET | `/users/Task` | Staff: view assigned tasks |
| POST | `/users/submit-estimate` | Staff: submit cost estimate |
| POST | `/users/complete-task` | Staff: submit completion proof |
| PATCH | `/users/revoke-complaint` | Resident: revoke staff (Personal only) |

### Admin (`/admin`) — Admin only
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/admin/dashboard-stats` | Dashboard data |
| GET | `/admin/complaints` | All complaints |
| POST | `/admin/assign-complaint` | Assign + set workType |
| POST | `/admin/handle-estimate` | Approve/reject estimate |
| POST | `/admin/resolve-complaint` | Resolve complaint |
| CRUD | `/admin/users/*` | Manage residents |
| CRUD | `/admin/staff/*` | Manage staff |
| GET | `/admin/reports-data` | Analytics |

### Payments (`/payments`)
| Method | URL | Description |
|--------|-----|-------------|
| POST | `/payments/generate-monthly` | Generate bills for all residents |
| POST | `/payments/create-order` | Create Razorpay order |
| POST | `/payments/verify` | Verify Razorpay payment |
| GET | `/payments/my-payments` | Resident: view own bills |
| GET | `/payments/list` | Admin: all payments |

### Inventory (`/inventory`) — Admin only
| Method | URL | Description |
|--------|-----|-------------|
| GET | `/inventory` | All items (filter by search/category) |
| POST | `/inventory` | Add item |
| PUT | `/inventory/:id` | Update item |
| DELETE | `/inventory/:id` | Delete item |
| POST | `/inventory/restock` | Add stock quantity |
| GET | `/inventory/low-stock` | Items below minimum threshold |

---

## Multi-Tab Login

Each browser tab stores its own `sessionId` in `sessionStorage`. Every API call sends `X-Session-Id` header. The `sessionHeader.js` middleware injects it as a cookie so `express-session` loads the correct session per tab.

---

## Environment Variables (`.env`)

```env
MONGO_URI=mongodb+srv://...
SESSION_SECRET=your_secret
PORT=3000

ADMIN_EMAIL=admin@gmail.com
ADMIN_PASSWORD=YourPassword

MAIL_USER=your@gmail.com
MAIL_PASS=gmail_app_password

RAZORPAY_KEY_ID=rzp_test_...
RAZORPAY_KEY_SECRET=...
```

> `MAIL_PASS` = Gmail App Password (not your real password). Enable 2FA → Google Account → Security → App Passwords.

---

## Running Locally

```bash
npm install
npm start          # runs nodemon app.js + tailwind watch
```

> For deep architecture documentation, see [project_overview.md](./project_overview.md)

---

## Razorpay Test Credentials

| UPI ID | Result |
|--------|--------|
| `success@razorpay` | ✅ Payment succeeds |
| `failure@razorpay` | ❌ Payment fails |