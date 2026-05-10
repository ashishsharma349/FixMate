# FixMate: Intelligent Society Management System

A production-grade, full-stack society management platform designed to streamline maintenance, complaints, inventory, and financial tracking for modern residential complexes.

## Tech Stack

### Backend
*   **Node.js & Express (v5.x):** Chosen for its asynchronous nature and rapid development cycle. Express 5 provides improved error handling and promise support.
*   **MongoDB & Mongoose:** NoSQL allows for flexible schemas for varied complaint types and evolving inventory structures.
*   **Express-Session & Connect-MongoDB-Session:** Implemented for secure, persistent server-side sessions, ensuring user state is maintained across server restarts.
*   **Bcrypt:** Industry-standard password hashing for robust authentication security.
*   **Razorpay SDK:** Seamless payment gateway integration for resident maintenance fees.
*   **Nodemailer:** Automated email notifications for temporary password generation and system alerts.

### Frontend
*   **React (v19):** Leveraging the latest React features for a highly responsive and componentized UI.
*   **Vite:** Used as the build tool for near-instant hot module replacement and optimized production builds.
*   **Tailwind CSS:** Utility-first CSS framework for rapid, consistent, and responsive styling.
*   **Recharts:** Dynamic data visualization for admin dashboards and financial reporting.
*   **Lucide React:** Modern, consistent iconography across the platform.

---

## Key Features

### Admin Management
*   **Real-time Analytics Dashboard:** Track active complaints, staff efficiency, and financial health (Income vs. Expenses) at a glance.
*   **Resident & Staff Onboarding:** Automated user creation with secure temporary password generation sent via email.
*   **Maintenance Fund Tracking:** Automated reconciliation of monthly society fees and repair expenses.
*   **Inventory Control:** Centralized tracking of maintenance supplies with low-stock alerts and automated material deduction upon repair completion.
*   **Expense Approval:** Digital bill management for restock and common area repairs.

### Maintenance & Staff
*   **Smart Complaint Assignment:** Assign staff based on department, availability, and specific time slots.
*   **Estimate Workflow:** Staff submit labour and inventory estimates; personal repairs are approved by residents, while common area repairs are approved by admin.
*   **Digital Proof of Work:** Mandatory photo upload upon task completion for transparency.
*   **Staff Performance Metrics:** Rating system based on resident feedback and task completion speed.

### Resident Experience
*   **Visual Complaint Filing:** Upload photos and descriptions of issues directly from the mobile-friendly dashboard.
*   **Trustless Payment Verification:** A unique double-entry system where both staff and resident must enter the paid amount to resolve "Personal" repairs, preventing financial fraud.
*   **Maintenance Fee Payment:** Integrated Razorpay flow for monthly society dues with historical tracking.
*   **Announcements:** Stay updated with society-wide broadcasts.

---

## Folder Structure

```text
FixMate/
├── app.js               # Entry point, middleware orchestration & DB connection
├── config/              # Environment & database configurations
├── controller/          # Business logic (Admin, User, Auth, Inventory, Payments)
├── frontend/            # Vite + React 19 source code
├── middleware/          # Auth guards, file uploaders, and session isolators
├── model/               # Mongoose schemas (User, Complain, Finance, Inventory)
├── routes/              # Express API route definitions
├── utils/               # Helper functions (Mailer, Path utils)
├── uploads/             # Local storage for images (Complaints/Bills)
└── tests/               # Jest & Supertest suites
```

---

## Key Design Decisions

1.  **Session Isolation:** Implemented a custom `sessionHeader` middleware that uses an `X-Session-Id` header to allow users to maintain separate sessions across browser tabs—critical for admin multitasking.
2.  **Automated Financial Reconciliation:** Inventory restocking and repair completions automatically generate "Pending" expenses in the finance module, ensuring the society's balance sheet is always accurate without manual entry.
3.  **Conflict-Free Payments:** For personal repairs, the system requires both parties to confirm the amount. If amounts mismatch, the system flags the conflict, forcing a re-entry or admin intervention.
4.  **Hardcoded vs. AI Logic:** Purposefully used deterministic logic for financial calculations and state transitions to ensure 100% auditability and compliance, avoiding the "black box" unpredictability of AI for core accounting.

---

## Installation & Setup

### Prerequisites
*   Node.js (v18+)
*   MongoDB Instance (Local or Atlas)
*   Cloudinary Account (Optional, for production image hosting)

### 1. Clone the Repository
```bash
git clone https://github.com/ashishsharma349/FixMate
cd FixMate
```

### 2. Environment Setup
Create a `.env` file in the root directory:
```env
MONGO_URI=your_mongodb_connection_string
SESSION_SECRET=your_secure_random_secret
PORT=3000
RAZORPAY_KEY_ID=your_key
RAZORPAY_KEY_SECRET=your_secret
EMAIL_USER=your_email
EMAIL_PASS=your_app_password
NODE_ENV=development
```

### 3. Install Dependencies
```bash
# Install Backend dependencies
npm install

# Install Frontend dependencies
cd frontend
npm install
cd ..
```

### 4. Run the Application
```bash
# Development mode (with Nodemon and Tailwind Watch)
npm run start
```

---

## Testing Section

The repository uses **Jest** and **Supertest** for automated validation.

*   **Unit Tests:** Controllers and utility functions.
*   **Integration Tests:** API endpoints and Mongoose model validation using `mongodb-memory-server`.

**Run tests:**
```bash
npm test
# Get coverage report
npm run test:coverage
```

---

## Production Checklist

- [ ] **Input Validation:** Ensure `express-validator` is active on all POST/PUT routes.
- [ ] **Rate Limiting:** Uncomment the `limiter` middleware in `app.js` to prevent Brute Force/DoS.
- [ ] **Security Headers:** Implement `helmet` for CSP and XSS protection.
- [ ] **Cloud Storage:** Transition `multer` from local `uploads/` to `multer-storage-cloudinary` for scalability.
- [ ] **Environment Variables:** Ensure `NODE_ENV` is set to `production` to hide stack traces.

---

## Roadmap

*   **Mobile App:** Flutter/React Native companion for staff notifications.
*   **Visitor Management:** QR-code based entry/exit logs.
*   **Smart Metering:** Integration with IoT water/electricity meters.
*   **AI Chatbot:** Automated FAQ and initial complaint categorization.

---

**FixMate** — *Maintenance Simplified, Community Amplified.*
