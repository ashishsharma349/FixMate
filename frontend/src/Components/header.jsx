
// import HeaderContainer from "./UI/HeaderContainer";
// import { Link, Route } from "react-router-dom";
// import { useContext } from "react";
// import { AuthContext } from "../Context/AuthContext";
// function Header(){

// const {isLoggedIn,role}= useContext(AuthContext);

// //design karna ha
// return <div> 
// <HeaderContainer>

//  {/* User Ko jo Dikhana Ha */}
//  {
//     isLoggedIn && role==="user" && (
//     <>
//     <Link to="/" style={navItemStyle}> Profile
//     </Link>
//     <Link to="/FileComplain" style={navItemStyle}> Register Complain
//     </Link>
//     <Link to="/All-Complains" style={navItemStyle}> All Complains
//     </Link>
//     <Link to="/See Status" style={navItemStyle}> Resolved Complains
//     </Link>
//      </>
//     )
// }
//  {/* Jo staff ko dikhana ha*/
//         isLoggedIn && role==="staff" && (
//         <>
//         <Link to="/" style={navItemStyle}>
//         Profile
//         </Link>
//         <Link to="/Assigned-Tasks" style={navItemStyle}>
//         Assigned Tasks
//         </Link>
//         <Link to="/Confirm-task" style={navItemStyle}>
//         Confirm-task
//         </Link>
//         </>
//     )
//  }
//   {/* Jo admin ko dikhana ha*/
//         isLoggedIn && role==="admin" && (
//         <>
//         <Link to="/" style={navItemStyle}>
//         Profile
//         </Link>
//         <Link to="/AssignStaff" style={navItemStyle}> AssignStaff
//         </Link>
//         </>
//     )
//  } 

//   {isLoggedIn ? <Link to="/logout" style={navItemStyle}>
//     Logout
//   </Link>:<Link to="/login" style={navItemStyle}>
//     Login
//   </Link>}
// </HeaderContainer>
// </div>
// }

// const navItemStyle = {
//   padding: "8px 14px",
//   whiteSpace: "nowrap",        
//   textDecoration: "none",
//   color: "#1f2937",            
//   fontSize: "14px",
//   fontWeight: 500,
//   borderRadius: "6px",
//   transition: "background 0.2s ease",
// };

// const navContainerStyle = {
//   display: "flex",
//   alignItems: "center",
//   gap: "16px",                 
// };

// export default Header;

import HeaderContainer from "./UI/HeaderContainer";
import { Link } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "../Context/AuthContext";

function Header() {
  const { isLoggedIn, role } = useContext(AuthContext);

  return (
    <div>
      <HeaderContainer>

        {/* Resident nav */}
        {isLoggedIn && role === "user" && (
          <>
            <Link to="/profile" style={navItemStyle}>Profile</Link>
            <Link to="/FileComplain" style={navItemStyle}>Register Complaint</Link>
            <Link to="/All-Complains" style={navItemStyle}>All Complaints</Link>
          </>
        )}

        {/* Staff nav */}
        {isLoggedIn && role === "staff" && (
          <>
            <Link to="/profile" style={navItemStyle}>Profile</Link>
            <Link to="/Assigned-Tasks" style={navItemStyle}>Assigned Tasks</Link>
          </>
        )}

        {/* Admin nav */}
        {isLoggedIn && role === "admin" && (
          <>
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