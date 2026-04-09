# FixMate: Comprehensive Society Management System

## Project Title & Overview

FixMate is a robust society management platform designed to streamline residential community operations through digital transformation. The system provides an integrated solution for managing complaints, inventory, payments, and user authentication within residential societies. It offers role-based access control for residents, staff, and administrators, ensuring efficient coordination and transparent communication across all stakeholders.

The application addresses the complex challenges of modern residential society management by automating routine tasks, facilitating complaint resolution, managing inventory supplies, and processing payments seamlessly. With its user-friendly interface and comprehensive feature set, FixMate enhances operational efficiency while maintaining security and data integrity through advanced authentication mechanisms and session management.

## Technology Stack

- **Backend Framework**: Node.js with Express.js
- **Database**: MongoDB with Mongoose ODM
- **Authentication**: bcrypt for password hashing, JWT for session management
- **Session Management**: express-session with MongoDB store
- **Template Engine**: EJS for server-side rendering
- **File Upload**: Multer with local disk storage
- **Payment Gateway**: Razorpay integration
- **Email Services**: Nodemailer for SMTP communications
- **Security**: CORS, rate limiting, input validation
- **Testing**: Jest with Supertest for API testing
- **Frontend**: TailwindCSS for styling

## System Modules

### Authentication & Authorization Module
Handles user registration, login, and role-based access control across three user types: residents, staff, and administrators. Implements secure password hashing, session management, and first-login password reset functionality with email notifications.

### Complaint Management Module
Manages the complete lifecycle of resident complaints from submission to resolution. Features status tracking (Pending, Assigned, InProgress, Resolved), priority classification, staff assignment, and proof of completion with image uploads and work logs.

### Inventory Management Module
Provides comprehensive tracking of society supplies including plumbing, electrical, and carpentry items. Features stock level monitoring, low-stock alerts, supplier management, and approval workflows for inventory procurement.

### Payment Processing Module
Integrates Razorpay for handling both personal maintenance payments and service-related transactions. Supports multiple payment types, automated status updates, and generates payment receipts with proper financial record-keeping.

## Key Logic Snippets

### Database Connection Setup
```javascript
mongoose.connect(DB_PATH).then(async () => {
  console.log("[Database Name] :", mongoose.connection.name);
  console.log("Connected to MongoDB");
  app.listen(PORT, () => {
    console.log(`Server is running at http://localhost:${PORT}`);
  });
}).catch(err => {
  console.log("Error :" + err);
});
```

### Session Management Configuration
```javascript
const store = new MongoDbStore({
  uri: DB_PATH,
  collection: 'sessions',
});

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
```

### Authentication Middleware
```javascript
function generateTempPassword() {
  const upper = "ABCDEFGHJKLMNPQRSTUVWXYZ";
  const lower = "abcdefghijkmnpqrstuvwxyz";
  const digits = "23456789";
  const special = "@$!%*?&";
  const all = upper + lower + digits + special;

  let pass =
    upper[Math.floor(Math.random() * upper.length)] +
    lower[Math.floor(Math.random() * lower.length)] +
    digits[Math.floor(Math.random() * digits.length)] +
    special[Math.floor(Math.random() * special.length)];

  for (let i = 0; i < 4; i++) {
    pass += all[Math.floor(Math.random() * all.length)];
  }

  return pass.split("").sort(() => Math.random() - 0.5).join("");
}
```

## Database Schema

### Auth Collection
```
{
  _id: ObjectId,
  email: String (unique, required),
  password: String (required, select: false),
  role: String (enum: ["user", "staff", "admin"]),
  isFirstLogin: Boolean (default: true),
  createdAt: Date (immutable)
}
```

### User Collection
```
{
  _id: ObjectId,
  authId: ObjectId (ref: "Auth", unique, required),
  name: String (required),
  age: Number (required, min: 0),
  phone: String (required),
  aadhaar: String (unique, required),
  flatNumber: String,
  photo: String,
  createdAt: Date (immutable)
}
```

### Complain Collection
```
{
  _id: ObjectId,
  image_url: String (required),
  title: String (required),
  category: String (default: "General"),
  status: String (enum: ["Pending", "Assigned", "EstimatePending", "EstimateApproved", "InProgress", "Resolved"]),
  priority: String (enum: ["Low", "Medium", "High", "Emergency"]),
  description: String (required),
  resident: ObjectId (ref: "User", required),
  assignedStaff: ObjectId (ref: "Staff"),
  workType: String (enum: ["Personal", "CommonArea"]),
  estimatedCost: Number,
  estimateStatus: String (enum: ["Pending", "Approved", "Rejected"]),
  proofImage: String,
  worklog: String,
  actualCost: Number,
  materialsUsed: Array,
  createdAt: Date
}
```

### Inventory Collection
```
{
  _id: ObjectId,
  name: String (unique, required),
  category: String (enum: ["Plumbing", "Electrical", "Carpentry", "Cleaning", "Security", "General"]),
  unit: String (default: "pcs"),
  quantity: Number (default: 0, min: 0),
  minQuantity: Number (default: 5),
  description: String,
  unitPrice: Number,
  supplier: String,
  approvedBy: String,
  approvedDate: Date,
  updatedAt: Date
}
```

### Payment Collection
```
{
  _id: ObjectId,
  type: String (enum: ["personal", "maintenance"]),
  resident: ObjectId (ref: "User"),
  flatNumber: String,
  amount: Number (required),
  dueDate: Date,
  status: String (enum: ["Pending", "Paid", "Overdue"]),
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  complaint: ObjectId (ref: "Complain"),
  worker: ObjectId (ref: "Staff"),
  workerName: String,
  purpose: String,
  refId: String (unique, sparse),
  month: Number,
  year: Number,
  paidAt: Date,
  timestamps: true
}
```

## Conclusion

FixMate successfully addresses the critical need for digital transformation in residential society management by providing a comprehensive, secure, and user-friendly platform. The system demonstrates significant impact through streamlined complaint resolution, efficient inventory management, and transparent payment processing, ultimately enhancing resident satisfaction and operational efficiency.

**Future Scope:**
- Implementation of real-time notifications using WebSocket technology
- Development of mobile applications for enhanced accessibility
- Integration with IoT devices for automated facility monitoring
- Advanced analytics dashboard for predictive maintenance and resource optimization
- Multi-language support to serve diverse residential communities
