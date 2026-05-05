import { Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./Context/AuthContext";

// Admin — full screen, no shared header
import AdminDashboard from "./Components/admin/AdminDashboard";

// Shared components
import Header from "./Components/header";
import Login from "./Components/login";
import CreateUser from "./Components/Signup";
import ChangePassword from "./Components/ChangePassword";
import Profile from "./Components/user_profile";
import Logout from "./Components/Logout";
import HomePage from "./Components/HomePage";

// User-specific
import ComplaintForm from "./Components/user/ComplainForm";
import AllComplains from "./Components/user/AllComplains";
import ComplainDetailCard from "./Components/UI/ComplainDetailCard";
import MyPayments from "./Components/user/MyPayments";

// Staff-specific
import Task from "./Components/Staff/Task";

// Announcements
import NoticePage from "./Components/announcements/NoticePage";


function App() {
  const { isLoggedIn, role } = useContext(AuthContext);

  // Show loading spinner while session is being verified
  if (isLoggedIn === null) {
    return (
      <div className="flex items-center justify-center h-screen bg-slate-50">
        <div className="animate-spin w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full" />
      </div>
    );
  }

  // ── Admin: full-screen dashboard, no Header rendered ────────────────────────
  if (isLoggedIn && role === "admin") {
    return (
      <Routes>
        {/* Any path → admin dashboard (single page handles all admin ops) */}
        <Route path="*" element={<AdminDashboard />} />
      </Routes>
    );
  }

  // ── Not logged in: only allow login route ───────────────────────────────────
  if (!isLoggedIn) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        {/* Redirect everything else to login */}
        <Route path="*" element={<Navigate to="/login" replace />} />
      </Routes>
    );
  }

  // ── Logged in as user or staff: render with shared Header ───────────────────
  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Navigate to="/" replace />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/change-password" element={<ChangePassword />} />
        <Route path="/profile" element={<Profile />} />
        <Route path="/notices" element={<NoticePage />} />


        {/* User routes */}
        <Route path="/FileComplain" element={role === "user" ? <ComplaintForm /> : <Navigate to="/" replace />} />
        <Route path="/All-Complains" element={role === "user" ? <AllComplains /> : <Navigate to="/" replace />} />
        <Route path="/my-payments" element={role === "user" ? <MyPayments /> : <Navigate to="/" replace />} />
        <Route path="/ComplainDetail/:id" element={<ComplainDetailCard />} />

        {/* Staff routes */}
        <Route path="/Assigned-Tasks" element={role === "staff" ? <Task /> : <Navigate to="/" replace />} />

        {/* Fallback */}
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

export default App;