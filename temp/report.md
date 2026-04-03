# FixMate Backend — Testing & Validation Report

> **Date:** 2026-03-16  
> **Total Tests:** 87 | **Passed:** 83 (95.4%) | **Failed:** 4  
> **Server:** `http://localhost:3000` | **DB:** `demoDB` (MongoDB Atlas)

---

## Test Summary

| Category | Tests | Passed | Failed | Notes |
|---|---|---|---|---|
| Authentication | 10 | 10 | 0 | All auth flows working correctly |
| Admin Dashboard | 4 | 4 | 0 | Stats, monthly, reports all return data |
| Admin Complaints | 5 | 5 | 0 | CRUD + assignment validation correct |
| Admin User CRUD | 4 | 4 | 0 | Create/Read/Update/Delete all validated |
| Admin Staff CRUD | 4 | 4 | 0 | Create/Read/Update/Delete all validated |
| Admin Settings | 3 | 3 | 0 | ⚠ See password bug below |
| User Routes | 12 | 12 | 0 | Auth guards all working |
| Profile Routes | 4 | 4 | 0 | Profile read + photo upload validated |
| Inventory | 10 | 10 | 0 | CRUD, search, category filter, restock |
| Payments | 17 | 17 | 0 | Razorpay flow, monthly billing, maintenance |
| Edge Cases | 7 | 7 | 0 | Injection, CORS, malformed JSON |
| Validator Middleware | 3 | 0 | **3** | ⛔ Validation NOT applied |
| Password Consistency | 2 | 1 | **1** | 🔴 Critical password bug |
| Create User Flow | 1 | 1 | 0 | authRouter create works |
| Concurrency | 1 | 1 | 0 | 5 parallel requests OK |

---

## 🔴 Critical Bugs (Must Fix)

### 1. Admin Password — Plain Text vs Bcrypt Mismatch

| Item | Detail |
|---|---|
| **Files** | `seedAdmin.js`, `controller/auth.js`, `controller/admin.js` |
| **Severity** | 🔴 Critical |
| **Impact** | Admin **can NEVER change their password** via Settings |

**Root Cause:** 
- `seedAdmin.js` stores the admin password as **plain text** (`admin@123`)
- `controller/auth.js` → `handlePost_login` uses **plain text comparison** (`password !== authUser.password`)  
- `controller/admin.js` → `updateAdminProfile` uses **`bcrypt.compare()`** to verify the current password

Since the stored password is plain text, `bcrypt.compare("admin@123", "admin@123")` will **always return `false`**, making it impossible for the admin to change their password through the settings page.

**How to Fix:**
Choose ONE of:
- **Option A:** Change `seedAdmin.js` to hash the password with bcrypt before saving
- **Option B:** Change `updateAdminProfile` to use plain text comparison (less secure, but consistent with the rest of the auth system)
- **Option C (Recommended):** Migrate the entire auth system to use bcrypt consistently — update `seedAdmin.js`, `handlePost_login`, and `handlePost_changePassword` to all use hashed passwords

---

### 2. Validation Middleware Not Applied on Admin CRUD Routes

| Item | Detail |
|---|---|
| **Files** | `routes/adminRoutes.js`, `routes/authRouter.js`, `middleware/validator.js` |
| **Severity** | 🔴 Critical |
| **Impact** | Users/staff can be created with invalid emails, 2-char names, and invalid phone numbers |

**Root Cause:**
- The `validate` middleware with `createUserRules` is defined in `middleware/validator.js` but is **only applied** on `authRouter.js → /admin/create-user`
- The admin panel's CRUD routes in `routes/adminRoutes.js` → `/admin/create-user` and `/admin/create-staff` call `adminControllers.createUser` / `adminControllers.createStaff` without **any validation middleware**

**Test Results:**
```
❌ POST /admin/create-user → 201 — accepted email "notgmail@yahoo.com"
❌ POST /admin/create-user → 201 — accepted name "AB" (2 chars, min should be 3)
❌ POST /admin/create-user → 201 — accepted phone "12345" (should be 10-digit Indian number)
```

**How to Fix:**
Add the existing `createUserRules` + `validate` middleware to the admin CRUD routes:
```javascript
// In routes/adminRoutes.js:
const { createUserRules, validate } = require("../middleware/validator.js");

adminRoute.post("/create-user", createUserRules, validate, adminControllers.createUser);
adminRoute.post("/create-staff", createUserRules, validate, adminControllers.createStaff);
```

---

## 🟡 Medium-Severity Issues

### 3. Duplicate Route: Two Different `/admin/create-user` Handlers

| Item | Detail |
|---|---|
| **Files** | `routes/authRouter.js:11`, `routes/adminRoutes.js:27` |
| **Severity** | 🟡 Medium |
| **Impact** | Confusion — both routes hit different controllers with different behavior |

**Details:**
- `authRouter` mounts at `/` → `POST /admin/create-user` → `authController.handlePost_createUser` (plain text passwords, sends email via `utils/mailer.js`)
- `adminRouter` mounts at `/admin` → `POST /admin/create-user` → `adminControllers.createUser` (bcrypt-hashed passwords, sends email via inline nodemailer with `process.env.EMAIL_USER`)

Since `authRouter` is registered first in `app.js` (line 89), it will capture the request first. The admin route version is **unreachable dead code**.

**How to Fix:** Remove the duplicate route from either `authRouter.js` or `adminRoutes.js`. Keep one, consistent approach.

---

### 4. Admin Email Config Uses Wrong Env Variables

| Item | Detail |
|---|---|
| **File** | `controller/admin.js:15` |
| **Severity** | 🟡 Medium |
| **Impact** | Emails from admin CRUD actions silently fail |

**Details:**
The `sendTempPasswordEmail` function in `controller/admin.js` uses `process.env.EMAIL_USER` and `process.env.EMAIL_PASS`, but the `.env` file defines `MAIL_USER` and `MAIL_PASS`. The mailer function will silently fail because the env variables are `undefined`.

**How to Fix:** Change to `process.env.MAIL_USER` and `process.env.MAIL_PASS` in `controller/admin.js`.

---

### 5. Inventory `deductMaterials` — `$max` and `$inc` Conflict

| Item | Detail |
|---|---|
| **File** | `controller/inventory.js:82-90` |
| **Severity** | 🟡 Medium |
| **Impact** | Inventory quantity can potentially go negative |

**Details:**
```javascript
await Inventory.findOneAndUpdate(
  { name: mat.name },
  {
    $inc: { quantity: -Math.abs(mat.qty) },   // deduct
    $set: { updatedAt: new Date() },
    $max: { quantity: 0 },                    // "never go below 0"
  }
);
```
The `$inc` and `$max` operators on the same field in a single update may not work as intended — MongoDB applies them in order, and `$max: { quantity: 0 }` sets quantity to `max(current_value, 0)` *before* `$inc` runs, not after. This means negative values are still possible.

**How to Fix:** Use a two-step approach or a MongoDB aggregation pipeline update:
```javascript
await Inventory.findOneAndUpdate(
  { name: mat.name, quantity: { $gte: mat.qty } },
  { $inc: { quantity: -Math.abs(mat.qty) }, $set: { updatedAt: new Date() } }
);
```

---

### 6. `Complain.resident` References `Auth._id`, Not `User._id`

| Item | Detail |
|---|---|
| **Files** | `controller/user.js:24`, `model/Complain.js:21` |
| **Severity** | 🟡 Medium |
| **Impact** | `populate("resident")` won't resolve correctly for complaints filed by residents |

**Details:**
- `Complain.resident` is set to `req.session.user.id` (which is `Auth._id`)
- But the schema says `resident: { type: ObjectId, ref: "User" }`
- When admin calls `populate("resident", "name phone email flatNumber")`, it looks in the `User` collection for `Auth._id`, which won't match `User._id`

This means populated resident fields on complaints will be `null` unless the Auth and User `_id`s happen to align.

**How to Fix:** Store the User profile's `_id` (not `Auth._id`) in `Complain.resident`. In the auth controller, after login, you already store `profileId` in the session. Use `req.session.user.profileId` when creating complaints.

---

### 7. NoSQL Injection Vulnerability on Login

| Item | Detail |
|---|---|
| **File** | `controller/auth.js:33` |
| **Severity** | 🟡 Medium |
| **Impact** | Potential auth bypass |

**Details:**
The login handler directly passes `req.body.email` to `Auth.findOne({ email })`. While the test showed the current payload returned 401, MongoDB's `findOne` with an object like `{ "$gt": "" }` can potentially match records. Since Express 5 doesn't auto-parse nested objects by default from JSON, the current risk is lower, but the code lacks explicit input sanitization.

**How to Fix:** Add explicit type checking:
```javascript
if (typeof email !== 'string' || typeof password !== 'string')
  return res.status(400).json({ error: "Invalid input" });
```

---

## 🔵 Low-Severity / Code Quality Issues

### 8. Dead Code Files

| File | Issue |
|---|---|
| `controller/payment.js` | Entirely commented out (60 lines of dead code) |
| `controller/staff.js` | Duplicates `fetch_task` from `controller/user.js` but is **never imported** |
| `routes/auth.js` | Contains a single orphan function `generateRefreshToken()` — never used |
| `model/finance.js` | Model `Finance` is defined but **never used** anywhere |
| `model/Announcement.js` | Model `Announcement` is defined but **never used** anywhere |
| `config/razorpay_config.js` | Exports `createRazorpayInstance()` using wrong env vars (`RAZORPAY_ID` vs `RAZORPAY_KEY_ID`), and is never imported |

**How to Fix:** Delete or archive these files to reduce confusion.

---

### 9. Inventory Model Field Name Inconsistency

| Item | Detail |
|---|---|
| **Files** | `model/Inventory.js`, `controller/inventory.js`, `seedInventory.js` |

- Model defines `minQuantity` (line 9)
- Controller `addItem` and `updateItem` reference `minimum` from `req.body`
- Seed data uses `minimum`
- Dashboard low-stock query uses `$expr: { $lte: ["$quantity", "$minQuantity"] }`
- Controller `getLowStock` uses `$expr: { $lt: ["$quantity", "$minimum"] }` — **wrong field name**

The `addItem` controller stores `minimum` in the database, but the model field is called `minQuantity`. Since Mongoose doesn't enforce strict field names by default, both fields can coexist, causing the low-stock query to reference a field that may not exist.

**How to Fix:** Standardize on one field name (`minQuantity`) everywhere and update seed data + controllers.

---

### 10. `GET /users/All-Staff` Has No Authentication

| Item | Detail |
|---|---|
| **File** | `routes/userRoutes.js:26` |
| **Severity** | 🔵 Low |

This route exposes the full staff list (names, departments, phone numbers, emails) publicly without any authentication. This is likely intentional for complaint assignment, but could be a privacy concern.

---

### 11. Multiple Commented-Out Code Blocks

Many files contain large blocks of commented-out legacy code:
- `model/Auth.js` — lines 1–27
- `model/staff.js` — lines 1–43
- `middleware/validator.js` — lines 1–37
- `utils/mailer.js` — lines 1–39
- `config/multerconfig.js` — lines 1–23

**Recommendation:** Remove commented-out code and rely on git history instead.

---

### 12. Missing Error Handling for Invalid ObjectIDs

| Item | Detail |
|---|---|
| **Files** | All controllers using `findById`, `findByIdAndUpdate`, `findByIdAndDelete` |
| **Severity** | 🔵 Low |

When an invalid (non-ObjectId format) string is passed as a path parameter (e.g., `PUT /admin/users/not-valid`), Mongoose throws a `CastError` that results in an unformatted **500 error**. There's no global error handler to catch these and return a clean 400 response.

**How to Fix:** Add a global error handler in `app.js`:
```javascript
app.use((err, req, res, next) => {
  if (err.name === 'CastError') return res.status(400).json({ error: "Invalid ID format" });
  res.status(500).json({ error: "Internal server error" });
});
```

---

## ✅ What's Working Well

| Feature | Status | Notes |
|---|---|---|
| Admin login/logout | ✅ | Session-based, X-Session-Id header for multi-tab |
| Check login state | ✅ | Returns role and isFirstLogin correctly |
| Change password (auth) | ✅ | Plain text comparison works for user/staff |
| Dashboard stats | ✅ | Returns total, inProgress, pending, estimates |
| Monthly complaint chart | ✅ | Aggregation pipeline returns correct data |
| Reports data | ✅ | Complaints + staff + fund + inventory stats |
| Complaint CRUD | ✅ | Create, read, assign, resolve all working |
| Estimate workflow | ✅ | Personal auto-approve, CommonArea needs admin |
| User CRUD | ✅ | Create, list, update, delete with auth |
| Staff CRUD | ✅ | Create, list, update, delete with auth |
| Inventory CRUD | ✅ | Add, update, delete, search, filter, restock |
| Low stock alerts | ✅ | Dashboard query working |
| Profile get | ✅ | Returns role-specific data (user/staff/admin) |
| Profile photo upload | ✅ | Multer local storage with file filter |
| Payment listing | ✅ | Maintenance + personal separated |
| Monthly bill generation | ✅ | Creates bills for all residents, skips duplicates |
| Razorpay order creation | ✅ | Creates order, reuses existing order ID |
| Payment verification | ✅ | HMAC signature verification |
| Maintenance payments | ✅ | Auto-created on task completion |
| Auth guards | ✅ | All protected routes properly guarded |
| CORS | ✅ | Whitelisted origins + credentials |
| Session management | ✅ | Multi-tab via X-Session-Id header |
| Seed data | ✅ | Admin + 26 inventory items auto-seeded |
| Concurrency | ✅ | 5 parallel requests handled |

---

## Priority Fix Order

1. **🔴 Password mismatch** — Admin can't change password (critical auth bug)
2. **🔴 Validation bypass** — Invalid data accepted on admin CRUD routes
3. **🟡 Duplicate create-user** — Remove one of the two routes
4. **🟡 Wrong env vars** — Fix `EMAIL_USER` → `MAIL_USER` in admin controller
5. **🟡 Resident ID mismatch** — `Complain.resident` stores `Auth._id` instead of `User._id`
6. **🟡 Inventory field name** — Standardize `minQuantity` vs `minimum`
7. **🔵 Remove dead code** — 6 unused/dead files
8. **🔵 Add global error handler** — Clean 400 for invalid ObjectIDs
9. **🔵 Remove commented code** — 5 files with legacy blocks
10. **🔵 Input sanitization** — Type-check login inputs
