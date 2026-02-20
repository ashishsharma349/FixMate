FixMate: Complaint & Maintenance Tracking System
FixMate is a streamlined web-based platform designed for modern building management. It facilitates seamless communication between Residents, Staff, and Administrators to report, track, and resolve maintenance issues efficiently.

Key Features
Admin Panel
Controlled Onboarding: Public signup is disabled. Only Admins can register new Residents and Staff members.

Automated Credentialing: Upon account creation, the system generates a secure temporary password and emails it directly to the user.

Building Dashboard: Monitor total residents, staff count, and live complaint statistics (Pending vs. Resolved) at a glance.

Resident Experience
Simple Reporting: Log building issues with descriptions and attachments.

Live Tracking: Real-time status updates on submitted complaints.

Profile Personalization: Upload and manage profile photos locally.

Staff Management
Task Assignment: Receive and manage maintenance requests.

Status Management: Update progress from "Pending" to "Completed."

Security & Performance
First-Login Wall: Users are prompted to change their temporary password immediately upon their first login.

Offline-Ready Media: Uses local storage for images, ensuring fast load times and reliability during demos even without internet access.

Tech Stack
Frontend: React.js, Vite, Tailwind CSS

Backend: Node.js, Express.js

Database: MongoDB

Auth: Express-Session, BCrypt

Mailing: Nodemailer (Gmail SMTP)

File Handling: Multer (Local Storage)

Project Structure
backend/config/: DB, Mailer, and Multer configurations

backend/controller/: Logic for Auth, Users, and Complaints

backend/middleware/: Authentication & Validation checks

backend/model/: MongoDB Schemas (Auth, User, Staff)

backend/routes/: API Route definitions

backend/uploads/: Local storage for profile photos/attachments

frontend/src/Components/: Reusable UI components (Login, Profile, etc.)

frontend/src/Context/: AuthState and Global Context

Installation & Setup
1. Backend Setup
Bash
cd backend
npm install
Create a .env file:

Plaintext
PORT=5000
MONGO_URI=your_mongodb_uri
MAIL_USER=your_gmail@gmail.com
MAIL_PASS=your_app_password
ADMIN_EMAIL=admin@fixmate.com
ADMIN_PASSWORD=admin123
2. Frontend Setup
Bash
cd frontend
npm install
npm run dev
Author
Ashish Sharma

GitHub: @ashishsharma349

Course: BCA Student, National Post Graduate College