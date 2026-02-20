// import { useState, useContext } from "react";
// import { Navigate } from "react-router-dom";
// import { AuthContext } from "../Context/AuthContext";

// // This is NOT a public signup page.
// // Only admin can access this to create resident/staff accounts.
// export default function CreateUser() {
//   const { isLoggedIn, role } = useContext(AuthContext);

//   const [formData, setFormData] = useState({
//     name: "", userType: "", age: "", email: "", contact: "", department: "",
//   });
//   const [errors, setErrors] = useState({});
//   const [success, setSuccess] = useState("");
//   const [loading, setLoading] = useState(false);

//   // Guard: only admin can access
//   if (!isLoggedIn || role !== "admin") return <Navigate to="/" />;

//   function handleChange(e) {
//     const { name, value } = e.target;
//     setFormData(prev => ({ ...prev, [name]: value }));
//   }

//   async function handleSubmit(e) {
//     e.preventDefault();
//     setErrors({});
//     setSuccess("");
//     setLoading(true);

//     try {
//       const res = await fetch("http://localhost:3000/admin/create-user", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify(formData),
//         credentials: "include",
//       });

//       const data = await res.json();

//       if (res.status === 409) {
//         setErrors({ email: "Email already registered" });
//       } else if (res.status === 400) {
//         const fieldErrors = {};
//         data.errors?.forEach(err => { fieldErrors[err.path] = err.msg; });
//         setErrors(fieldErrors);
//       } else if (res.ok) {
//         setSuccess(`✓ Account created! Temp password sent to ${formData.email}`);
//         setFormData({ name: "", userType: "", age: "", email: "", contact: "", department: "" });
//       } else {
//         setErrors({ general: data.error || "Something went wrong" });
//       }
//     } catch (err) {
//       setErrors({ general: "Server not reachable" });
//     } finally {
//       setLoading(false);
//     }
//   }

//   const inputStyle = "w-full p-3 rounded-xl bg-[#cbd5e1] text-slate-800 placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-400 transition-all text-sm";

//   return (
//     <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 p-0 sm:p-4 font-sans">
//       <div className="relative w-full h-screen sm:h-auto sm:max-w-[450px] bg-white sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col">

//         <div className="flex-[0.3] min-h-[130px] flex flex-col items-center justify-center relative bg-white px-6 py-4">
//           <div className="absolute top-0 w-full opacity-10 pointer-events-none">
//             <svg viewBox="0 0 500 200" xmlns="http://www.w3.org/2000/svg">
//               <path d="M0,80 C150,180 350,20 500,80 L500,0 L0,0 Z" fill="#3b82f6"></path>
//             </svg>
//           </div>
//           <div className="z-10 flex flex-col items-center">
//             <div className="w-14 h-14 bg-[#1a365d] rounded-full flex items-center justify-center mb-2 shadow-lg">
//               <span className="text-white text-2xl">👤</span>
//             </div>
//             <h1 className="text-2xl font-extrabold text-[#1a365d]">Create Account</h1>
//             <p className="text-xs text-slate-500 font-medium tracking-widest uppercase">Admin Panel</p>
//           </div>
//         </div>

//         <div className="bg-[#25334d] rounded-t-[40px] p-8 flex-[1.6] flex flex-col shadow-[0_-10px_20px_rgba(0,0,0,0.1)] overflow-y-auto">
//           <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full max-w-sm mx-auto">

//             <input className={inputStyle} name="name" placeholder="Full Name"
//               value={formData.name} onChange={handleChange} required />
//             {errors.name && <p className="text-red-300 text-[10px]">{errors.name}</p>}

//             <div className="flex gap-3">
//               <select className={`${inputStyle} flex-1`} name="userType"
//                 value={formData.userType} onChange={handleChange} required>
//                 <option value="">Account Type</option>
//                 <option value="user">Resident</option>
//                 <option value="staff">Staff</option>
//               </select>
//               {formData.userType === "user" && (
//                 <input type="number" className={`${inputStyle} w-24`} name="age"
//                   placeholder="Age" value={formData.age} onChange={handleChange} required />
//               )}
//             </div>
//             {errors.userType && <p className="text-red-300 text-[10px]">{errors.userType}</p>}

//             <input type="email" className={inputStyle} name="email" placeholder="Email"
//               value={formData.email} onChange={handleChange} required />
//             {errors.email && <p className="text-red-300 text-[10px]">{errors.email}</p>}

//             <input type="tel" className={inputStyle} name="contact" placeholder="Contact Number"
//               value={formData.contact} onChange={handleChange} required />
//             {errors.contact && <p className="text-red-300 text-[10px]">{errors.contact}</p>}

//             {formData.userType === "staff" && (
//               <select className={inputStyle} name="department"
//                 value={formData.department} onChange={handleChange} required>
//                 <option value="">Select Department</option>
//                 <option value="Plumbing">Plumbing</option>
//                 <option value="Electrical">Electrical</option>
//                 <option value="Carpentry">Carpentry</option>
//                 <option value="Cleaning">Cleaning</option>
//                 <option value="Security">Security</option>
//               </select>
//             )}
//             {errors.department && <p className="text-red-300 text-[10px]">{errors.department}</p>}

//             {errors.general && (
//               <p className="text-red-300 text-xs text-center bg-red-900/20 py-2 rounded-lg">{errors.general}</p>
//             )}
//             {success && (
//               <p className="text-green-300 text-xs text-center bg-green-900/20 py-2 px-3 rounded-lg font-medium">{success}</p>
//             )}

//             <button type="submit" disabled={loading}
//               className="w-full mt-4 bg-white text-[#25334d] font-bold py-3 rounded-full shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest disabled:opacity-50">
//               {loading ? "Creating..." : "Create Account"}
//             </button>
//           </form>
//         </div>
//       </div>
//     </div>
//   );
// }

import { useState, useContext } from "react";
import { Navigate } from "react-router-dom";
import { AuthContext } from "../Context/AuthContext";

// This is NOT a public signup page.
// Only admin can access this to create resident/staff accounts.
export default function CreateUser() {
  const { isLoggedIn, role } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    name: "",
    userType: "",
    age: "",
    email: "",
    contact: "",
    aadhaar: "", // Added Aadhaar field
    department: "",
  });
  
  const [errors, setErrors] = useState({});
  const [success, setSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  // Guard: only admin can access
  if (!isLoggedIn || role !== "admin") return <Navigate to="/" />;

  function handleChange(e) {
    const { name, value } = e.target;
    
    // Custom logic for Aadhaar and Contact to only allow numbers
    if (name === "aadhaar" || name === "contact") {
      const numericValue = value.replace(/\D/g, "");
      setFormData(prev => ({ ...prev, [name]: numericValue }));
      return;
    }

    setFormData(prev => ({ ...prev, [name]: value }));
  }

  async function handleSubmit(e) {
    e.preventDefault();
    setErrors({});
    setSuccess("");
    
    // Basic Aadhaar Validation before sending to server
    if (formData.aadhaar.length !== 12) {
      setErrors({ aadhaar: "Aadhaar must be exactly 12 digits" });
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("http://localhost:3000/admin/create-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
        credentials: "include",
      });

      const data = await res.json();

      if (res.status === 409) {
        setErrors({ email: "Email or Aadhaar already registered" });
      } else if (res.status === 400) {
        const fieldErrors = {};
        data.errors?.forEach(err => { fieldErrors[err.path] = err.msg; });
        setErrors(fieldErrors);
      } else if (res.ok) {
        setSuccess(`✓ Account created! Temp password sent to ${formData.email}`);
        setFormData({ name: "", userType: "", age: "", email: "", contact: "", aadhaar: "", department: "" });
      } else {
        setErrors({ general: data.error || "Something went wrong" });
      }
    } catch (err) {
      setErrors({ general: "Server not reachable" });
    } finally {
      setLoading(false);
    }
  }

  const inputStyle = "w-full p-3 rounded-xl bg-[#cbd5e1] text-slate-800 placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-400 transition-all text-sm";

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 p-0 sm:p-4 font-sans">
      <div className="relative w-full h-screen sm:h-auto sm:max-w-[450px] bg-white sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col">

        {/* Header Section */}
        <div className="flex-[0.3] min-h-[130px] flex flex-col items-center justify-center relative bg-white px-6 py-4">
          <div className="absolute top-0 w-full opacity-10 pointer-events-none">
            <svg viewBox="0 0 500 200" xmlns="http://www.w3.org/2000/svg">
              <path d="M0,80 C150,180 350,20 500,80 L500,0 L0,0 Z" fill="#3b82f6"></path>
            </svg>
          </div>
          <div className="z-10 flex flex-col items-center">
            <div className="w-14 h-14 bg-[#1a365d] rounded-full flex items-center justify-center mb-2 shadow-lg">
              <span className="text-white text-2xl">👤</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#1a365d]">Create Account</h1>
            <p className="text-xs text-slate-500 font-medium tracking-widest uppercase">Admin Panel</p>
          </div>
        </div>

        {/* Form Section */}
        <div className="bg-[#25334d] rounded-t-[40px] p-8 flex-[1.6] flex flex-col shadow-[0_-10px_20px_rgba(0,0,0,0.1)] overflow-y-auto">
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 w-full max-w-sm mx-auto">

            {/* Name */}
            <input className={inputStyle} name="name" placeholder="Full Name"
              value={formData.name} onChange={handleChange} required />
            {errors.name && <p className="text-red-300 text-[10px]">{errors.name}</p>}

            {/* Type & Age */}
            <div className="flex gap-3">
              <select className={`${inputStyle} flex-1`} name="userType"
                value={formData.userType} onChange={handleChange} required>
                <option value="">Account Type</option>
                <option value="user">Resident</option>
                <option value="staff">Staff</option>
              </select>
              {formData.userType === "user" && (
                <input type="number" className={`${inputStyle} w-24`} name="age"
                  placeholder="Age" value={formData.age} onChange={handleChange} required />
              )}
            </div>

            {/* Email */}
            <input type="email" className={inputStyle} name="email" placeholder="Email Address"
              value={formData.email} onChange={handleChange} required />
            {errors.email && <p className="text-red-300 text-[10px]">{errors.email}</p>}

            {/* Contact */}
            <input type="tel" maxLength="10" className={inputStyle} name="contact" placeholder="Contact Number (10 digits)"
              value={formData.contact} onChange={handleChange} required />
            {errors.contact && <p className="text-red-300 text-[10px]">{errors.contact}</p>}

            {/* Aadhaar Card Field */}
            <input 
              type="text" 
              maxLength="12" 
              className={inputStyle} 
              name="aadhaar" 
              placeholder="Aadhaar Number (12 digits)"
              value={formData.aadhaar} 
              onChange={handleChange} 
              required 
            />
            {errors.aadhaar && <p className="text-red-300 text-[10px]">{errors.aadhaar}</p>}

            {/* Department (Staff Only) */}
            {formData.userType === "staff" && (
              <select className={inputStyle} name="department"
                value={formData.department} onChange={handleChange} required>
                <option value="">Select Department</option>
                <option value="Plumbing">Plumbing</option>
                <option value="Electrical">Electrical</option>
                <option value="Carpentry">Carpentry</option>
                <option value="Cleaning">Cleaning</option>
                <option value="Security">Security</option>
              </select>
            )}

            {/* Feedback Messages */}
            {errors.general && (
              <p className="text-red-300 text-xs text-center bg-red-900/20 py-2 rounded-lg">{errors.general}</p>
            )}
            {success && (
              <p className="text-green-300 text-xs text-center bg-green-900/20 py-2 px-3 rounded-lg font-medium">{success}</p>
            )}

            <button type="submit" disabled={loading}
              className="w-full mt-4 bg-white text-[#25334d] font-bold py-3 rounded-full shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest disabled:opacity-50">
              {loading ? "Creating..." : "Create Account"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}