// import React, { useState, useEffect, useMemo } from "react";

// const ComplaintAssignmentPage = () => {
//   // Data
//   const [complaints, setComplaints] = useState([]);
//   const [staffList, setStaffList] = useState([]);

//   // Local state
//   const [selectedStaffId, setSelectedStaffId] = useState(null);
//   const [selectedComplaints, setSelectedComplaints] = useState([]);

//   const [complaintFilters, setComplaintFilters] = useState({
//     priority: "All",
//     category: "All",
//   });

//   const [staffFilters, setStaffFilters] = useState({
//     department: "All",
//     availability: "All",
//   });

//   const [loading, setLoading] = useState(true);
//   const [error, setError] = useState(null);

//   // Fetch data
//   useEffect(() => {
//     const fetchData = async () => {
//       try {
//         setLoading(true);

//         const staffRes = await fetch("http://localhost:3000/users/All-Staff",{credentials: "include" });
//         const staffData = await staffRes.json();
//         setStaffList(Array.isArray(staffData) ? staffData : []);

//         const compRes = await fetch("http://localhost:3000/users/All-Complains",{credentials: "include"});
//         const compData = await compRes.json();

//         const complaintArray = Array.isArray(compData?.complains)
//           ? compData.complains
//           : [];

//         setComplaints(complaintArray);
//         console.log("[Staff Data :]",staffData);
//         console.log("[Complain Data :]",compData);
//       } catch (err) {
//         console.error(err);
//         setError("Failed to load data");
//       } finally {
//         setLoading(false);
//       }
//     };

//     fetchData();
//   }, []);

//   // =====================
//   // FILTER LOGIC
//   // =====================

//   const filteredComplaints = useMemo(() => {
//     return complaints.filter((c) => {
//       const priorityMatch =
//         complaintFilters.priority === "All" ||  //if All do nothing else filter
//         c.priority === complaintFilters.priority;

//       const categoryMatch =
//         complaintFilters.category === "All" ||
//         c.category === complaintFilters.category;

//       return priorityMatch && categoryMatch;
//     });
//   }, [complaints, complaintFilters]);

//   const filteredStaff = useMemo(() => {
//     return staffList.filter((s) => {
//       const deptMatch =
//         staffFilters.department === "All" ||
//         s.department === staffFilters.department;

//       const availabilityMatch =
//         staffFilters.availability === "All" ||
//         (staffFilters.availability === "Available" && s.isAvailable) ||
//         (staffFilters.availability === "Busy" && !s.isAvailable);

//       return deptMatch && availabilityMatch;
//     });
//   }, [staffList, staffFilters]);

//   // =====================
//   // Actions
//   // =====================

//   const handleAssignClick = (id) => setSelectedStaffId(id);

//   const handleCheckboxToggle = (complaintId) => {
//     setSelectedComplaints((prev) =>
//       prev.includes(complaintId)
//         ? prev.filter((id) => id !== complaintId)
//         : [...prev, complaintId]
//     );
//   };

//   const handleDoneSubmit = async () => {
//     if (!selectedStaffId || selectedComplaints.length === 0) {
//       alert("Please select a staff member and at least one complaint.");
//       return;
//     }

//     try {
//       const response = await fetch("http://localhost:3000/users/Assign-Complain", {
//         method: "PATCH",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           staffId: selectedStaffId,
//           complaintIds: selectedComplaints,
//         }),
//       });

//       if (!response.ok) throw new Error("Assignment failed");
      
//       // setComplaints(prev =>
//       // prev.filter(c => !selectedComplaints.includes(c._id))
//       // );    
//       alert("Assigned successfully!");
//       setSelectedComplaints([]);
//     } catch (err) {
//       console.error(err);
//       alert("Assignment failed");
//     }
//   };

//   if (loading) return <div className="p-6 text-center">Loading...</div>;
//   if (error) return <div className="p-6 text-red-600 text-center">{error}</div>;

//   // =====================
//   // UI
//   // =====================

//   return (
//     <div className="flex h-screen bg-gray-100 p-6 gap-6">
//       {/* STAFF PANEL */}
//       <div className="w-1/3 bg-white rounded-xl shadow-md p-4 flex flex-col">
//         <h2 className="text-xl font-bold mb-3">Staff Members</h2>

//         {/* Staff Filters */}
//         <div className="flex gap-2 mb-3">
//           <select
//             className="border p-1 rounded text-sm"
//             value={staffFilters.department}
//             onChange={(e) =>
//               setStaffFilters((f) => ({ ...f, department: e.target.value }))
//             }
//           >
//             <option value="All">All Departments</option>
//             <option value="Electrical">Electrical</option>
//             <option value="Security">Security</option>
//           </select>

//           <select
//             className="border p-1 rounded text-sm"
//             value={staffFilters.availability}
//             onChange={(e) =>
//               setStaffFilters((f) => ({ ...f, availability: e.target.value }))
//             }
//           >
//             <option value="All">All</option>
//             <option value="Available">Available</option>
//             <option value="Busy">Busy</option>
//           </select>
//         </div>

//         <div className="space-y-4 overflow-y-auto">
//           {filteredStaff.map((staff) => (
//             <div
//               key={staff._id}
//               className={`p-4 border rounded-lg transition-all ${
//                 selectedStaffId === staff._id
//                   ? "border-blue-500 bg-blue-50"
//                   : "border-gray-200"
//               }`}
//             >
//               <div className="flex justify-between items-center">
//                 <div>
//                   <p className="font-semibold">{staff.name}</p>
//                   <p className="text-sm text-gray-500">{staff.department}</p>
//                   <span
//                     className={`text-xs ${
//                       staff.isAvailable ? "text-green-500" : "text-red-500"
//                     }`}
//                   >
//                     {staff.isAvailable ? "● Available" : "● Busy"}
//                   </span>
//                 </div>

//                 <button
//                   onClick={() => handleAssignClick(staff._id)}
//                   className="px-4 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 text-sm"
//                 >
//                   Assign
//                 </button>
//               </div>
//             </div>
//           ))}

//           {filteredStaff.length === 0 && (
//             <p className="text-gray-500 text-sm">No staff match filters.</p>
//           )}
//         </div>
//       </div>

//       {/* COMPLAINTS PANEL */}
//       <div className="w-2/3 bg-white rounded-xl shadow-md p-4 flex flex-col relative">
//         <div className="flex justify-between items-center mb-4">
//           <h2 className="text-xl font-bold">Complaints</h2>

//           {/* Complaint Filters */}
//           <div className="flex gap-2">
//             <select
//               className="border p-1 rounded text-sm"
//               value={complaintFilters.priority}
//               onChange={(e) =>
//                 setComplaintFilters((f) => ({
//                   ...f,
//                   priority: e.target.value,
//                 }))
//               }
//             >
//               <option value="All">All Priorities</option>
//               <option value="Low">Low</option>
//               <option value="Medium">Medium</option>
//               <option value="High">High</option>
//             </select>

//             <select
//               className="border p-1 rounded text-sm"
//               value={complaintFilters.category}
//               onChange={(e) =>
//                 setComplaintFilters((f) => ({
//                   ...f,
//                   category: e.target.value,
//                 }))
//               }
//             >
//               <option value="All">All Categories</option>
//               <option value="Electrical">Electrical</option>
//               <option value="Security">Security</option>
//               <option value="Water">Water</option>
//             </select>
//           </div>
//         </div>

//         <div className="flex-1 overflow-y-auto border-t">
//           {filteredComplaints.map((item) => (
//             <div
//               key={item._id}
//               className="flex items-center justify-between p-4 border-b hover:bg-gray-50"
//             >
//               <span className="text-gray-700">
//                 C-00{item._id.slice(-4)} — {item.title || item.description}
//                 <span className="ml-2 text-xs text-gray-500">
//                   [{item.priority}]
//                 </span>
//               </span>

//               <input
//                 type="checkbox"
//                 className="w-5 h-5"
//                 checked={selectedComplaints.includes(item._id)}
//                 onChange={() => handleCheckboxToggle(item._id)}
//               />
//             </div>
//           ))}

//           {filteredComplaints.length === 0 && (
//             <p className="p-4 text-gray-500 text-sm">
//               No complaints match filters.
//             </p>
//           )}
//         </div>

//         <button
//           onClick={handleDoneSubmit}
//           className="absolute bottom-6 right-6 bg-green-600 text-white px-8 py-3 rounded-full shadow-lg hover:bg-green-700 font-bold"
//         >
//           Done
//         </button>
//       </div>
//     </div>
//   );
// };

// export default ComplaintAssignmentPage;
import React, { useState, useEffect, useMemo } from "react";

const ComplaintAssignmentPage = () => {
  const [complaints, setComplaints] = useState([]);
  const [staffList, setStaffList] = useState([]);
  const [selectedStaffId, setSelectedStaffId] = useState(null);
  const [selectedComplaints, setSelectedComplaints] = useState([]);
  const [complaintFilters, setComplaintFilters] = useState({ priority: "All", category: "All" });
  const [staffFilters, setStaffFilters] = useState({ department: "All", availability: "All" });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        const staffRes = await fetch("http://localhost:3000/users/All-Staff", { credentials: "include" });
        const staffData = await staffRes.json();
        setStaffList(Array.isArray(staffData) ? staffData : []);

        const compRes = await fetch("http://localhost:3000/users/All-Complains", { credentials: "include" });
        const compData = await compRes.json();
        setComplaints(Array.isArray(compData?.complains) ? compData.complains : []);
      } catch (err) {
        setError("Failed to load management data");
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const filteredComplaints = useMemo(() => {
    return complaints.filter((c) => (complaintFilters.priority === "All" || c.priority === complaintFilters.priority) &&
      (complaintFilters.category === "All" || c.category === complaintFilters.category));
  }, [complaints, complaintFilters]);

  const filteredStaff = useMemo(() => {
    return staffList.filter((s) => (staffFilters.department === "All" || s.department === staffFilters.department) &&
      (staffFilters.availability === "All" || (staffFilters.availability === "Available" && s.isAvailable) || (staffFilters.availability === "Busy" && !s.isAvailable)));
  }, [staffList, staffFilters]);

  const handleCheckboxToggle = (id) => {
    setSelectedComplaints(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const handleDoneSubmit = async () => {
    if (!selectedStaffId || selectedComplaints.length === 0) {
      alert("Select a staff member and tasks first.");
      return;
    }
    try {
      const response = await fetch("http://localhost:3000/users/Assign-Complain", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ staffId: selectedStaffId, complaintIds: selectedComplaints }),
      });
      if (!response.ok) throw new Error("Assignment failed");
      alert("Tasks assigned successfully!");
      setSelectedComplaints([]);
    } catch (err) {
      alert("Error updating assignment");
    }
  };

  if (loading) return <div className="h-screen flex items-center justify-center font-bold text-[#1a365d]">Initializing Management Console...</div>;

  return (
    <div className="min-h-screen bg-[#f8fafc] p-4 lg:p-8 font-sans">
      <div className="max-w-7xl mx-auto flex flex-col lg:flex-row gap-8 h-[calc(100vh-100px)]">
        
        {/* LEFT: STAFF DIRECTORY */}
        <div className="w-full lg:w-[400px] flex flex-col bg-white rounded-[40px] shadow-xl border border-gray-100 overflow-hidden">
          <div className="p-6 bg-white border-b">
            <h2 className="text-xl font-black text-[#1a365d] mb-4 flex items-center gap-2">
              <span className="text-blue-500">👷</span> Staff Directory
            </h2>
            <div className="grid grid-cols-2 gap-2">
              <select className="bg-gray-50 p-2 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none border-none"
                value={staffFilters.department} onChange={(e) => setStaffFilters(f => ({ ...f, department: e.target.value }))}>
                <option value="All">All Depts</option>
                <option value="Electrical">Electrical</option>
                <option value="Plumbing">Plumbing</option>
              </select>
              <select className="bg-gray-50 p-2 rounded-xl text-[10px] font-black uppercase tracking-widest outline-none border-none"
                value={staffFilters.availability} onChange={(e) => setStaffFilters(f => ({ ...f, availability: e.target.value }))}>
                <option value="All">Availability</option>
                <option value="Available">Available</option>
                <option value="Busy">Busy</option>
              </select>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredStaff.map((staff) => (
              <div key={staff._id} onClick={() => setSelectedStaffId(staff._id)}
                className={`p-4 rounded-3xl cursor-pointer transition-all border-2 ${selectedStaffId === staff._id ? "border-blue-600 bg-blue-50 shadow-md" : "border-transparent bg-gray-50 hover:bg-gray-100"}`}>
                <div className="flex justify-between items-center">
                  <div>
                    <p className="font-extrabold text-[#1a365d]">{staff.name}</p>
                    <p className="text-[10px] font-bold text-slate-400 uppercase">{staff.department}</p>
                  </div>
                  <div className={`w-3 h-3 rounded-full ${staff.isAvailable ? "bg-green-500" : "bg-red-400"} shadow-sm`} />
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* RIGHT: COMPLAINT QUEUE */}
        <div className="flex-1 flex flex-col bg-[#25334d] rounded-[40px] shadow-2xl relative overflow-hidden">
          <div className="p-8 pb-4">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-black text-white tracking-tight">Complaint Queue</h2>
              <div className="flex gap-3">
                <select className="bg-[#334463] text-white p-2 rounded-xl text-[10px] font-bold uppercase outline-none border-none"
                  value={complaintFilters.priority} onChange={(e) => setComplaintFilters(f => ({ ...f, priority: e.target.value }))}>
                  <option value="All">All Priority</option>
                  <option value="High">High</option>
                  <option value="Medium">Medium</option>
                </select>
              </div>
            </div>
          </div>

          <div className="flex-1 overflow-y-auto px-8 pb-32 space-y-4">
            {filteredComplaints.map((item) => (
              <div key={item._id} onClick={() => handleCheckboxToggle(item._id)}
                className={`p-5 rounded-3xl flex items-center justify-between transition-all cursor-pointer ${selectedComplaints.includes(item._id) ? "bg-blue-600 text-white" : "bg-[#334463] text-slate-300 hover:bg-[#3d5175]"}`}>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black uppercase tracking-widest opacity-60">Ticket #{item._id.slice(-4)}</span>
                  <p className="font-bold text-lg leading-tight">{item.title}</p>
                  <span className={`text-[10px] font-black mt-1 ${item.priority === 'High' ? 'text-orange-400' : 'text-sky-400'}`}>{item.priority} Priority</span>
                </div>
                <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center transition-all ${selectedComplaints.includes(item._id) ? "bg-white border-white" : "border-slate-500"}`}>
                  {selectedComplaints.includes(item._id) && <span className="text-blue-600 font-bold">✓</span>}
                </div>
              </div>
            ))}
          </div>

          {/* FLOAT ACTION BUTTON */}
          <div className="absolute bottom-8 left-0 right-0 px-8">
            <button onClick={handleDoneSubmit}
              className="w-full bg-white text-[#25334d] py-5 rounded-full font-black uppercase tracking-[0.2em] shadow-2xl hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-3">
              Deploy Assignment {selectedComplaints.length > 0 && `(${selectedComplaints.length})`}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ComplaintAssignmentPage;