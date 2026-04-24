# FixMate - Project Report
## Metadata
- Student/Developer: Not specified in codebase
- Project Guide/Supervisor: Not specified in codebase
- Academic/Development Session: Not specified in codebase
- Institution/Organization: Not specified in codebase

## 1. Introduction and Objectives
- Statement of Proposed System: FixMate is a residential society management system that automates complaint filing, staff assignment, inventory tracking, and payment processing through a web-based platform with role-based access control for administrators, residents, and staff members.

- Problem with Existing System: Manual society management processes including paper-based complaint tracking, inefficient staff assignment, lack of centralized inventory management, and manual payment collection processes that result in delays, miscommunication, and poor accountability.

- Objectives:
  - Implement digital complaint lifecycle management with status tracking
  - Provide role-based user authentication and authorization
  - Enable efficient staff assignment and task management
  - Automate inventory tracking and low-stock alerts
  - Integrate digital payment processing via Razorpay
  - Generate comprehensive reports and analytics
  - Ensure multi-tab session management for different user roles

- Project Description: A client-server web application using React frontend with Node.js/Express backend and MongoDB database. The system follows a B2C2B interaction model where residents (consumers) interact with the society management system, which coordinates with staff (business service providers). Core user flow: Resident files complaint with photo > Admin assigns staff with work type classification > Staff submits estimate and completion proof > Admin reviews and resolves > Payment processing based on work type.

## 2. System Analysis
- Requirement Analysis:
  - Functional Requirements:
    - User authentication with role-based access (admin, resident, staff)
    - Complaint filing with image upload and category classification
    - Complaint lifecycle management (Pending, Assigned, EstimatePending, EstimateApproved, InProgress, Resolved)
    - Staff assignment and availability tracking
    - Cost estimation and approval workflow
    - Inventory management with automatic deduction
    - Payment processing for personal and common area work
    - Multi-tab session management
    - Email notifications for user creation
    - Dashboard analytics and reporting
  - Non-Functional Requirements:
    - Session persistence across server restarts
    - Rate limiting for authentication endpoints (5 requests per 15 minutes)
    - CORS support for cross-origin frontend communication
    - Input validation for user creation and password changes
    - File upload restrictions to jpg/jpeg/png formats
    - Error handling and logging for debugging
    - Responsive design for mobile and desktop access

- Risk Analysis:
  - Security: Plain-text password storage for non-admin users (demo mode)
  - Scalability: Local file storage may not scale for production deployment
  - Data Integrity: Limited transaction handling for inventory deduction
  - Dependency: External service dependency on Razorpay and Gmail SMTP
  - Session Management: Complex multi-tab session handling may have edge cases

## 3. Preliminary Investigation
The project addresses residential society management through a comprehensive web-based solution. Initial scope investigation reveals a need for digital transformation of traditional society management processes. The system proposal includes three user roles with distinct responsibilities: administrators for oversight and management, residents for service requests, and staff for service delivery. The system proposal emphasizes automated workflows, real-time status tracking, and integrated payment processing to replace manual processes.

## 4. Project Feasibility
- Technical Feasibility: Node.js/Express stack with MongoDB provides proven technology foundation. React frontend with Vite build tools ensures modern development experience. All dependencies are open-source with active community support. Local deployment feasible on standard web servers.

- Operational Feasibility: User interface designed for intuitive navigation with role-based access control. Minimal training required due to familiar web interface patterns. Session management supports simultaneous multi-role access from different browser tabs.

- Economic Feasibility: Entire technology stack uses open-source components eliminating licensing costs. Razorpay integration provides cost-effective payment processing. Local file storage reduces infrastructure expenses compared to cloud solutions.

- Schedule Feasibility: Not specified in codebase - no development timeline or milestone documentation found.

## 5. Methodology & Technology Stack
- Framework/Platform: Express.js 5.1.0 for backend API development, React 19.2.0 with Vite 7.2.4 for frontend, EJS for minimal server-side rendering
- Backend Language: JavaScript (Node.js runtime)
- Database: MongoDB with Mongoose 9.0.2 ODM for data modeling and validation
- Architecture Pattern: Model-View-Controller (MVC) with RESTful API design, middleware-based request processing
- State Management: Server-side session storage in MongoDB with client-side React Context API, multi-tab session isolation using sessionStorage

## 6. Software & Hardware Requirements
- Server/Dev Environment: Node.js runtime, MongoDB database server, Gmail SMTP for email, development IDE support, browser compatibility with Chrome/Firefox/Edge, Vite dev server on port 5173 or Live Server on port 5501
- Client Requirements: Modern web browser with JavaScript enabled, internet connection, minimum screen resolution 1024x768 for responsive design
- Hardware Specs: Standard web server with minimum 2GB RAM, 20GB storage space, broadband internet connection for payment processing and email services

## 7. System Design
- SDLC Model Used: Not specified in codebase - appears to follow iterative development based on folder structure and component organization
- Design Approach: Bottom-up approach with modular architecture - separate controllers, models, routes, and middleware components enabling independent development and testing
- DFD Summary: Level 0 DFD shows external entities (Admin, Resident, Staff) interacting with the FixMate system. Level 1 DFD details data flow: Client requests pass through CORS and session middleware, route to appropriate controllers, access MongoDB models, and return JSON responses. Image uploads flow through Multer to local storage.
- ERD Summary: Core entities include Auth (authentication), User (resident profiles), Staff (service providers), Complain (service requests), Inventory (supplies), and Payment (financial records). Relationships: Auth 1:1 User/Staff, User 1:N Complain, Staff 1:N Complain, Complain 1:N Payment, Inventory N:N Complain through materialsUsed array.

## 8. Project Modules
- Admin Panel:
  - Dashboard statistics: `/admin/dashboard-stats` (controller/admin.js)
  - Monthly analytics: `/admin/monthly-stats` (controller/admin.js)
  - Complaint management: `/admin/complaints` (controller/admin.js)
  - User CRUD operations: `/admin/users/*` (controller/admin.js)
  - Staff CRUD operations: `/admin/staff/*` (controller/admin.js)
  - Reports generation: `/admin/reports-data` (controller/admin.js)
  - Settings management: `/admin/settings/profile` (controller/admin.js)

- User Panel:
  - Complaint filing: POST `/users/complains` (controller/user.js)
  - Complaint tracking: GET `/users/All-Complains` (controller/user.js)
  - Profile management: POST `/users/profile/photo` (controller/user.js)
  - Payment viewing: GET `/payments/my-payments` (routes/paymentRoutes.js)
  - Password change: POST `/change-password` (controller/auth.js)

- Staff Panel:
  - Task assignment viewing: GET `/users/Task` (controller/user.js)
  - Estimate submission: POST `/users/submit-estimate` (controller/user.js)
  - Task completion: POST `/users/complete-task` (controller/user.js)
  - Profile management: GET `/profile` (controller/profile.js)

## 9. Development Timeline (Gantt)
Not specified in codebase - no development timeline, milestones, or project schedule documentation found.

## 10. Data Dictionary & Database Design
- Tables/Collections:
  - Auth: User authentication credentials with email, password, role, isFirstLogin flag (model/Auth.js)
  - User: Resident profiles with authId reference, name, age, phone, aadhaar, flatNumber, photo (model/User.js)
  - Staff: Service provider profiles with authId reference, name, phone, aadhaar, department, isAvailable, rating (model/staff.js)
  - Complain: Service requests with image_url, title, category, status, priority, resident reference, assignedStaff reference, workType, estimatedCost, proofImage, worklog, actualCost, materialsUsed (model/Complain.js)
  - Inventory: Society supplies with name, category, unit, quantity, minQuantity, unitPrice, supplier, approvedBy (model/Inventory.js)
  - Payment: Financial records with type (personal/maintenance), resident reference, amount, status, Razorpay fields, complaint reference, worker reference (model/Payment.js)
  - Announcement: System announcements (model/Announcement.js - defined but not fully implemented)
  - Finance: Financial records (model/finance.js - defined but not fully implemented)

- Stored Procedures/Functions: Not implemented in current codebase - uses Mongoose query methods and aggregation pipelines

- Key Relationships & Indexes:
  - Auth._id -> User.authId (1:1 relationship)
  - Auth._id -> Staff.authId (1:1 relationship)
  - User._id -> Complain.resident (1:N relationship)
  - Staff._id -> Complain.assignedStaff (1:N relationship)
  - Complain._id -> Payment.complaint (1:N relationship)
  - Staff._id -> Payment.worker (1:N relationship)
  - Unique indexes on Auth.email, User.aadhaar, Staff.aadhaar, Inventory.name
  - Compound indexes on Payment.month/year for monthly billing queries

## 11. Input & Output Specification
- Main Forms:
  - User Creation: POST `/create-user` with name, email, userType, contact, age (users), department (staff)
  - Complaint Filing: POST `/users/complains` with title, category, description, priority, image file
  - Login: POST `/login` with email, password
  - Password Change: POST `/change-password` with currentPassword, newPassword, confirmPassword
  - Estimate Submission: POST `/users/submit-estimate` with complaintId, estimatedCost
  - Task Completion: POST `/users/complete-task` with complaintId, proofImage, worklog, actualCost, materialsUsed

- API Endpoints: RESTful endpoints returning JSON responses with consistent error handling format `{ error: message }` or success responses with data

- Validation Rules: Name (3-30 chars), Gmail email format, Indian mobile numbers (10 digits starting with 6-9), age (1-120), department validation, password strength (8+ chars with uppercase, lowercase, digit, special character)

- Error Handling: Global error handler in app.js processes Mongoose validation errors, JWT errors, CORS errors, rate limiting, and file upload errors with appropriate HTTP status codes

## 12. Data Flow Diagram (DFD) Description
Data flow follows standard request-response pattern: Browser sends HTTP request with X-Session-Id header -> CORS validation -> Session header middleware injects session ID as cookie -> Express-session loads session from MongoDB -> Route matching -> Authentication middleware validation -> Controller business logic -> MongoDB queries via Mongoose models -> Response JSON with data or error messages. File uploads flow through Multer middleware before reaching controllers.

## 13. Entity Relationship Diagram (ERD) Description
Primary entities follow Third Normal Form with proper separation of concerns. Authentication separated from profile data through Auth-User/Staff relationships. Complaint entity serves as central hub linking residents, staff, and payments. Inventory maintains independent stock records with material usage tracked in complaints. Cardinality: Auth (1) to User/Staff (1), User (1) to Complaints (N), Staff (1) to Assigned Complaints (N), Complaint (1) to Payments (N). Referential integrity maintained through ObjectId references.

## 14. Coding Implementation
- Key Architectural Files:
  - app.js: Application entry point with middleware setup, route mounting, database connection
  - routes/: URL mapping to controller functions with middleware integration
  - controllers/: Business logic implementation with database operations
  - models/: Mongoose schema definitions with validation rules
  - middleware/: Request processing pipeline components
  - config/: Third-party service configurations (Multer, Razorpay)

- Reusable Components:
  - authMiddleware.js: isLoggedIn() and isAdmin() guard functions
  - sessionHeader.js: Multi-tab session management
  - validator.js: Input validation rules and error processing
  - mailer.js: Email notification service
  - multerconfig.js: File upload configuration

- Error Logging: Comprehensive error logging in app.js global handler with timestamp, method, path, error message, stack trace, request body, parameters, and user ID

- Exception Handling: Try-catch blocks in controllers, global error handler for unhandled exceptions, validation error processing, database error handling

- Code Standards: ES6+ JavaScript syntax, modular file organization, consistent naming conventions, JSDoc comments in some files

## 15. Implementation & Maintenance
- Testing Strategy: Jest testing framework with Supertest for API testing. Test files include basic.test.js and real.test.js with system health checks, endpoint testing, and API status verification. Coverage threshold set at 20% for branches, functions, lines, and statements.

- Deployment/Conversion: Environment variables configured through .env file. Database seeding scripts (seedAdmin.js, seedInventory.js) for initial data setup. Static files served from dist directory. Local file storage in uploads directory. No CI/CD pipeline found in codebase.

- Maintenance Plan: Error logging for debugging, session persistence for user experience, inventory tracking for resource management, email notifications for user communication. No automated backup or monitoring strategies documented.

## 16. System Security Measures
- Auth Mechanism: Session-based authentication with MongoDB session store, role-based access control (admin, user, staff), session expiration after 7 days
- Password Hashing: bcrypt used for admin passwords only (users/staff use plain text for demo)
- Input Sanitization: express-validator for input validation, file type restrictions (jpg/jpeg/png), mobile number format validation, Gmail email format validation
- CAPTCHA: Not implemented in current codebase
- CSRF/XSS Protection: CORS configuration with allowed origins, rate limiting on authentication endpoints, session cookie security settings (httpOnly, sameSite)
- Session Management: Signed session IDs, multi-tab session isolation using X-Session-Id header, MongoDB session storage for persistence
- RBAC: Role-based middleware guards (isLoggedIn, isAdmin), role-specific route protection, user role stored in session

## 17. Cost & Resource Analysis
- Open-source vs Licensed Dependencies: All backend dependencies are open-source (MIT/Apache licenses). Frontend uses open-source React ecosystem. No licensing costs identified.
- Hosting Costs: Local deployment minimizes hosting costs. MongoDB Atlas required for production database. Razorpay charges transaction fees (2-3% per payment). No cloud storage costs due to local file storage.
- Scalability Trade-offs: Local file storage limits scalability but reduces costs. Session storage in MongoDB increases database load but enables persistence. Plain-text passwords reduce security but simplify demo deployment.
- Resource Sharing: Single database serves all user roles, shared session store, centralized file storage, common email service for all notifications

## 18. Limitations & Future Scope
- Current Limitations:
  - Plain-text password storage for non-admin users (security risk)
  - Local file storage not suitable for production scaling
  - Limited real-time features (no WebSocket implementation)
  - No mobile application for field staff
  - Commented-out Cloudinary integration indicates incomplete cloud migration
  - Limited error recovery mechanisms
  - No automated backup or disaster recovery

- Future Enhancements:
  - Password hashing implementation for all user types
  - Cloud storage migration (Cloudinary integration)
  - Real-time notifications using WebSocket
  - Mobile application development for staff
  - Advanced analytics dashboard with predictive insights
  - Automated backup and monitoring systems
  - Multi-language support for diverse communities
  - Integration with IoT devices for facility monitoring

## 19. Glossary
- FixMate: Society management system name
- Auth: Authentication model storing login credentials
- Complain: Service request entity (note: spelling as used in codebase)
- Razorpay: Indian payment gateway integration
- Multer: Node.js middleware for file uploads
- Mongoose: MongoDB object modeling library
- Session ID: Unique identifier for user session management
- WorkType: Classification of work as "Personal" or "CommonArea"
- EstimatePending: Status awaiting cost estimate approval
- sessionStorage: Browser storage for per-tab session management

## 20. Bibliography/References
- Express.js Framework: https://expressjs.com/
- React Library: https://reactjs.org/
- MongoDB Database: https://www.mongodb.com/
- Mongoose ODM: https://mongoosejs.com/
- Razorpay Payment Gateway: https://razorpay.com/
- Node.js Runtime: https://nodejs.org/
- Jest Testing Framework: https://jestjs.io/
- Tailwind CSS: https://tailwindcss.com/
- Vite Build Tool: https://vitejs.dev/
- bcrypt Password Hashing: https://www.npmjs.com/package/bcrypt
- Multer File Upload: https://www.npmjs.com/package/multer
- Nodemailer Email Service: https://nodemailer.com/
