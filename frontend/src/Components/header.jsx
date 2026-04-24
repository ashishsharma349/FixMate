import HeaderContainer from "./UI/HeaderContainer";
import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../Context/AuthContext";

const logoMark = (
  <span className="inline-flex shrink-0 items-center justify-center h-10 w-10">
    <img src="/image.png" alt="" className="h-full w-full object-contain" aria-hidden />
  </span>
);

function Header() {
  const { isLoggedIn, role } = useContext(AuthContext);

  const homeNavStyle = { ...navItemStyle, display: "inline-flex", alignItems: "center", gap: "0.5rem" };

  return (
    <div>
      <HeaderContainer>

        {/* Resident nav */}
        {isLoggedIn && role === "user" && (
          <>
            <Link to="/" style={homeNavStyle}>{logoMark}Home</Link>
            <Link to="/profile" style={navItemStyle}>Profile</Link>
            <Link to="/FileComplain" style={navItemStyle}>Register Complaint</Link>
            <Link to="/All-Complains" style={navItemStyle}>All Complaints</Link>
            <Link to="/my-payments" style={navItemStyle}>💳 My Payments</Link>
          </>
        )}

        {/* Staff nav */}
        {isLoggedIn && role === "staff" && (
          <>
            <Link to="/" style={homeNavStyle}>{logoMark}Home</Link>
            <Link to="/profile" style={navItemStyle}>Profile</Link>
            <Link to="/Assigned-Tasks" style={navItemStyle}>Assigned Tasks</Link>
          </>
        )}

        {/* Admin nav */}
        {isLoggedIn && role === "admin" && (
          <>
            <Link to="/" style={homeNavStyle}>{logoMark}Home</Link>
            <Link to="/profile" style={navItemStyle}>Profile</Link>
            <Link to="/AssignStaff" style={navItemStyle}>Assign Staff</Link>
            <Link to="/create-user" style={navItemStyle}>Create User</Link>
          </>
        )}

        {/* Login / Logout */}
        {isLoggedIn
          ? <Link to="/logout" style={navItemStyle}>Logout</Link>
          : <Link to="/login" style={navItemStyle}>Login</Link>
        }

      </HeaderContainer>
    </div>
  );
}

const navItemStyle = {
  padding: "8px 14px",
  whiteSpace: "nowrap",
  textDecoration: "none",
  color: "#1f2937",
  fontSize: "14px",
  fontWeight: 500,
  borderRadius: "6px",
  transition: "background 0.2s ease",
};

export default Header;