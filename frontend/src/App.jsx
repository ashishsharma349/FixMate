// import { Routes, Route, Navigate } from "react-router-dom";
// import { useContext } from "react";
// import { AuthContext } from "./Context/AuthContext";

// import Header from "./Components/header";
// import Footer from "./Components/footer";
// import Login from "./Components/login";
// import Signup from "./Components/Signup";
// import Profile from "./Components/user_profile";
// import Logout from "./Components/Logout";
// import HomePage from "./Components/HomePage";
// import ComplaintForm from "./Components/user/ComplainForm";
// import AllComplains from "./Components/user/AllComplains";
// import ComplainDetailCard from "./Components/UI/ComplainDetailCard";
// import AssignStaff from "./Components/AssignStaff";
// import Task from "./Components/Staff/Task";

// function App() {
// const { isLoggedIn,role } = useContext(AuthContext);

// if (isLoggedIn === null) {
//   return <p>
//     Loading Content.....
//   </p>;
// }

//   return (
//     <>
//       <Header />
//       <Routes>
//         <Route path="/" element={<HomePage/>} />
//         <Route path="/login" element={<Login />} />
//         <Route path="/signup" element={<Signup />} />
//         <Route path="/logout" element={<Logout/>}/>
//         {/* <Route path="/AssignStaff" element={<AssignStaff/>}/> */}
//         <Route
//           path="/profile"
//           element={isLoggedIn ? <Profile /> : <Navigate to="/login" />}
//         />
//         <Route 
//         path="/FileComplain" 
//         element={isLoggedIn? <ComplaintForm/>: <Navigate to="/login" />}
//         />
//         <Route 
//         path="/All-Complains" 
//         element={isLoggedIn? <AllComplains/>: <Navigate to="/login" />}
//         />
//         <Route path="/ComplainDetail/:id" element={<ComplainDetailCard/>} />
//         <Route path="/AssignStaff" element={<AssignStaff/>}/>

//         <Route path="/Assigned-Tasks" element={<Task/>}/>

//       </Routes>

//       {/* <Footer /> */}
//     </>
//   );
// }

// export default App;


// // import { useState } from 'react'
// // // import reactLogo from './assets/react.svg'
// // // import viteLogo from '/vite.svg'
// // import './Components/user_profile';
// // import './App.css'
// // // import { AuthProvider } from './Context/AuthContext';
// // import Profile from './Components/user_profile';
// // import Header from './Components/header';
// // import Footer from './Components/footer';
// // import {useContext} from 'react';
// // import { AuthContext } from './Context/AuthContext';
// // import Login from './Components/login';

// // function App() {
// //   const {isLoggedIn}=useContext(AuthContext);

// //   return (
// // <>
// //     <Header/>
// //     {isLoggedIn? <Profile/> :<Login />}  
// //     {/* <Profile/> */}
// //     <Footer/>
// // </>
// //   )
// // }

// // export default App


import { Routes, Route, Navigate } from "react-router-dom";
import { useContext } from "react";
import { AuthContext } from "./Context/AuthContext";

import Header from "./Components/header";
import Login from "./Components/login";
import CreateUser from "./Components/Signup";
import ChangePassword from "./Components/ChangePassword";
import Profile from "./Components/user_profile";
import Logout from "./Components/Logout";
import HomePage from "./Components/HomePage";
import ComplaintForm from "./Components/user/ComplainForm";
import AllComplains from "./Components/user/AllComplains";
import ComplainDetailCard from "./Components/UI/ComplainDetailCard";
import AssignStaff from "./Components/AssignStaff";
import Task from "./Components/Staff/Task";

function App() {
  const { isLoggedIn } = useContext(AuthContext);

  if (isLoggedIn === null) {
    return <p>Loading...</p>;
  }

  return (
    <>
      <Header />
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/login" element={<Login />} />
        <Route path="/logout" element={<Logout />} />
        <Route path="/change-password" element={isLoggedIn ? <ChangePassword /> : <Navigate to="/login" />} />
        <Route path="/create-user" element={isLoggedIn ? <CreateUser /> : <Navigate to="/login" />} />
        <Route path="/profile" element={isLoggedIn ? <Profile /> : <Navigate to="/login" />} />
        <Route path="/FileComplain" element={isLoggedIn ? <ComplaintForm /> : <Navigate to="/login" />} />
        <Route path="/All-Complains" element={isLoggedIn ? <AllComplains /> : <Navigate to="/login" />} />
        <Route path="/ComplainDetail/:id" element={<ComplainDetailCard />} />
        <Route path="/AssignStaff" element={isLoggedIn ? <AssignStaff /> : <Navigate to="/login" />} />
        <Route path="/Assigned-Tasks" element={isLoggedIn ? <Task /> : <Navigate to="/login" />} />
      </Routes>
    </>
  );
}

export default App;