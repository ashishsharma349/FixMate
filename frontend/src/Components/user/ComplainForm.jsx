// import React, { useEffect, useState } from 'react';

// const ComplaintForm = () => {
//   const [formData, setFormData] = useState({
//     title: '',
//     category: 'Plumbing',
//     priority: 'Medium',
//     description: '',
//     photo: null
//   });

//   const handleChange = (e) => {
//     const { name, value } = e.target;
//     setFormData({ ...formData, [name]: value });
//   };

//   const handleFileChange = (e) => {
//     setFormData({ ...formData, photo: e.target.files[0] });
//   };
  
// const handleSubmit = (e) => {
//   e.preventDefault();

//   const data = new FormData(); // must be FormData for file
//   data.append("title", formData.title);
//   data.append("category", formData.category);
//   data.append("priority", formData.priority);
//   data.append("description", formData.description);
//   if (formData.photo) data.append("photo", formData.photo);
//  try{
//   console.log("[React Data state :]",formData.title);
//   console.log("[React image state :]",formData.photo);
//   console.log("[Data Uploaded :]",data.get("title"));
//   console.log("[File Uploaded :]",data.get("photo"));

//   fetch("http://localhost:3000/users/complains", {
//     method: "POST",
//     body: data,

//     credentials: "include", 
//   })
//     .then((res) => res.json())
//     .then((result) => {
//       console.log("Complaint logged:", result);
//       alert("Complaint logged successfully!");
//       // setFormData({
//       //   title: "",
//       //   category: "Plumbing",
//       //   priority: "Medium",
//       //   description: "",
//       //   image: null,
//       // });
//     })
  
//   }
//   catch(err){
//     console.log("Error  :",err);
//   }
// };


//   return (
//     <div className="min-h-screen bg-gray-50 py-12 px-4">
//       <div className="max-w-2xl mx-auto bg-white shadow-md rounded-lg p-8 border border-gray-200">
//         <h2 className="text-2xl font-bold mb-6 text-gray-800 border-b pb-4">Log a New Complaint</h2>
        
//         <form onSubmit={handleSubmit} className="space-y-6" >
//           <div>
//             <label className="block text-sm font-semibold text-gray-700 mb-1">Issue Title</label>
//             <input 
//               type="text" 
//               name="title"
//               required
//               placeholder="e.g., Leaking pipe in kitchen"
//               className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
//               onChange={handleChange}
//             />
//           </div>


//           <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
//             <div>
//               <label className="block text-sm font-semibold text-gray-700 mb-1">Category</label>
//               <select 
//                 name="category"
//                 className="w-full p-2 border border-gray-300 rounded bg-white"
//                 onChange={handleChange}
//               >
//                 <option>Plumbing</option>
//                 <option>Electrical</option>
//                 <option>Elevator</option>
//                 <option>Security</option>
//                 <option>Others</option>
//               </select>
//             </div>
//             <div>
//               <label className="block text-sm font-semibold text-gray-700 mb-1">Priority Level</label>
//               <select 
//                 name="priority"
//                 className="w-full p-2 border border-gray-300 rounded bg-white"
//                 onChange={handleChange}
//               >
//                 <option>Low</option>
//                 <option>Medium</option>
//                 <option>High</option>
//                 <option>Emergency</option>
//               </select>
//             </div>
//           </div>

          
//           <div>
//             <label className="block text-sm font-semibold text-gray-700 mb-1">Description</label>
//             <textarea 
//               name="description"
//               required
//               rows="4"
//               placeholder="Provide more details about the issue..."
//               className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 outline-none"
//               onChange={handleChange}
//             ></textarea>
//           </div>

         
//           <div>
//             <label className="block text-sm font-semibold text-gray-700 mb-1">Attach Photo (Optional)</label>
//             <input 
//               type="file" 
//               accept="image/*"
//               className="w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
//               onChange={handleFileChange}
//             />
//           </div>

//           <button 
//             type="submit" 
//             className="w-full bg-blue-600 text-white font-bold py-3 rounded hover:bg-blue-700 transition duration-200"
//           >
//             Submit Complaint
//           </button>
//         </form>
//       </div>
//     </div>
//   );
// };

// export default ComplaintForm;
import React, { useState } from 'react';

const ComplaintForm = () => {
  const [formData, setFormData] = useState({
    title: '',
    category: 'Plumbing',
    priority: 'Medium',
    description: '',
    photo: null
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, photo: e.target.files[0] });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    const data = new FormData();
    data.append("title", formData.title);
    data.append("category", formData.category);
    data.append("priority", formData.priority);
    data.append("description", formData.description);
    if (formData.photo) data.append("photo", formData.photo);

    try {
      fetch("http://localhost:3000/users/complains", {
        method: "POST",
        body: data,
        credentials: "include",
      })
      .then((res) => res.json())
      .then((result) => {
        alert("Complaint logged successfully!");
      });
    } catch (err) {
      console.log("Error:", err);
    }
  };

  const inputBase = "w-full p-3 rounded-xl bg-[#cbd5e1] text-slate-800 placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-400 transition-all text-sm";

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 p-0 sm:p-4 font-sans">
      <div className="relative w-full h-screen sm:h-auto sm:max-w-[480px] bg-white sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col">
        
        {/* Branding Header - Logo Updated to Match Home Page */}
        <div className="flex-[0.2] min-h-[100px] flex items-center px-8 relative bg-white">
          <div className="z-10 flex items-center gap-3">
            {/* New Building Logo Badge */}
            <div className="w-11 h-11 bg-white rounded-full flex items-center justify-center shadow-md overflow-hidden border border-slate-200">
              <img src="/logo.png" alt="FixMate Logo" className="w-full h-full object-contain" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-[#1a365d] leading-none">FixMate</h1>
              <p className="text-[10px] text-slate-500 font-bold uppercase tracking-wider">Report Issue</p>
            </div>
          </div>
        </div>

        {/* Form Content Area */}
        <div className="bg-[#25334d] rounded-t-[40px] p-8 flex-1 flex flex-col shadow-[0_-10px_20px_rgba(0,0,0,0.1)] overflow-y-auto">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full">
            
            <div>
              <label className="text-sky-400 text-[10px] font-bold uppercase ml-1 mb-1 block">Issue Title</label>
              <input 
                type="text" 
                name="title"
                placeholder="e.g., Leaking pipe in kitchen"
                className={inputBase}
                onChange={handleChange}
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sky-400 text-[10px] font-bold uppercase ml-1 mb-1 block">Category</label>
                <select name="category" className={inputBase} onChange={handleChange}>
                  <option>Plumbing</option>
                  <option>Electrical</option>
                  <option>Elevator</option>
                  <option>Security</option>
                </select>
              </div>
              <div>
                <label className="text-sky-400 text-[10px] font-bold uppercase ml-1 mb-1 block">Priority</label>
                <select name="priority" className={inputBase} onChange={handleChange}>
                  <option>Low</option>
                  <option>Medium</option>
                  <option>High</option>
                  <option>Emergency</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-sky-400 text-[10px] font-bold uppercase ml-1 mb-1 block">Description</label>
              <textarea 
                name="description"
                rows="3"
                placeholder="Details of the issue..."
                className={`${inputBase} resize-none`}
                onChange={handleChange}
                required
              ></textarea>
            </div>

            <div>
              <label className="text-sky-400 text-[10px] font-bold uppercase ml-1 mb-1 block">Photo Evidence</label>
              <div className="relative group cursor-pointer">
                <input 
                  type="file" 
                  name="photo"
                  accept="image/*"
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-20"
                  onChange={handleFileChange}
                />
                <div className="w-full p-4 border-2 border-dashed border-slate-500 rounded-xl flex items-center justify-center gap-2 text-slate-400 group-hover:border-sky-400 group-hover:text-sky-400 transition-all">
                  <span className="text-lg">📷</span>
                  <span className="text-xs font-medium">{formData.photo ? formData.photo.name : "Tap to Upload Photo"}</span>
                </div>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full mt-4 bg-white text-[#25334d] font-bold py-4 rounded-full text-md shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest"
            >
              Submit Complaint
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ComplaintForm;