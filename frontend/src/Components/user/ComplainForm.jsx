import React, { useState, useEffect } from 'react';

import { getAuthHeaders } from '../../utils/api';



const ComplaintForm = () => {

  const [formData, setFormData] = useState({

    title: '',
    category: 'Plumbing',
    priority: 'Medium',
    description: '',
    photo: null,
    flatNumber: '',
    residentName: '',
    residentPhone: '',
    scheduledSlot: 'Morning (9 AM - 12 PM)'
  });
  const [loadingProfile, setLoadingProfile] = useState(true);

  const [submitting, setSubmitting] = useState(false);



  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("http://localhost:3000/profile", {
          headers: getAuthHeaders(),
        });
        const data = await res.json();
        if (res.ok) {
          setFormData(prev => ({
            ...prev,
            flatNumber: data.flatNumber || '',
            residentName: data.name || '',
            residentPhone: data.phone || '',
          }));
        }
      } catch (err) {
        console.error("Profile fetch error:", err);
      } finally {
        setLoadingProfile(false);
      }
    };
    fetchProfile();
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
  };

  const handleFileChange = (e) => {
    setFormData({ ...formData, photo: e.target.files[0] });
  };



  const handleSubmit = async (e) => {

    e.preventDefault();



    if (!formData.photo) {

      alert("Please upload a photo of the issue before submitting.");

      return;

    }



    setSubmitting(true);

    const data = new FormData();

    data.append("title", formData.title);
    data.append("category", formData.category);
    data.append("priority", formData.priority);
    data.append("description", formData.description);
    data.append("photo", formData.photo);
    data.append("flatNumber", formData.flatNumber);
    data.append("residentName", formData.residentName);
    data.append("residentPhone", formData.residentPhone);
    data.append("scheduledSlot", formData.scheduledSlot);



    try {

      const res = await fetch("http://localhost:3000/users/complains", {

        method: "POST",

        body: data,

        headers: getAuthHeaders(),

      });

      const result = await res.json();

      if (!res.ok) throw new Error(result.error || "Failed to submit");

      alert("Complaint logged successfully!");

      setFormData({ title: '', category: 'Plumbing', priority: 'Medium', description: '', photo: null });

    } catch (err) {

      alert("Error: " + err.message);

    } finally {

      setSubmitting(false);

    }

  };



  const inputBase = "w-full p-3 rounded-xl bg-[#cbd5e1] text-slate-800 placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-400 transition-all text-sm";



  return (

    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 p-0 sm:p-4 font-sans">

      <div className="relative w-full h-screen sm:h-auto sm:max-w-[480px] bg-white sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col">

        <div className="flex-[0.2] min-h-[100px] flex items-center px-8 relative bg-white">
          <div className="z-10 flex items-center gap-3">
            <div className="relative group">
              <div className="w-16 h-16 flex items-center justify-center">
                <img src="/image.png" alt="FixMate" className="w-12 h-12 object-contain" />
              </div>
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-[#1a365d]">File Complaint</h1>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-[0.3em]">FixMate Portal</p>
            </div>
          </div>
          {loadingProfile && (
            <div className="absolute right-8 top-1/2 -translate-y-1/2">
              <div className="animate-spin w-4 h-4 border-2 border-blue-500 border-t-transparent rounded-full" />
            </div>
          )}
        </div>



        <div className="bg-[#25334d] rounded-t-[40px] p-8 flex-[1.8] flex flex-col shadow-[0_-10px_20px_rgba(0,0,0,0.1)] overflow-y-auto">

          <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm mx-auto">



            <div>

              <label className="text-sky-400 text-[10px] font-black uppercase ml-1 mb-1 block">Issue Title</label>

              <input className={inputBase} name="title" placeholder="Brief title (e.g. Leaking Pipe)" value={formData.title} onChange={handleChange} required />

            </div>



            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sky-400 text-[10px] font-black uppercase ml-1 mb-1 block">Category</label>
                <select className={inputBase} name="category" value={formData.category} onChange={handleChange}>
                  <option value="Plumbing">Plumbing</option>
                  <option value="Electrical">Electrical</option>
                  <option value="Carpentry">Carpentry</option>
                  <option value="Cleaning">Cleaning</option>
                  <option value="Security">Security</option>
                  <option value="General">General</option>
                </select>
              </div>
              <div>
                <label className="text-sky-400 text-[10px] font-black uppercase ml-1 mb-1 block">Priority</label>
                <select className={inputBase} name="priority" value={formData.priority} onChange={handleChange}>
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sky-400 text-[10px] font-black uppercase ml-1 mb-1 block">Flat Number</label>
                <input className={`${inputBase} opacity-70 cursor-not-allowed`} name="flatNumber" value={formData.flatNumber} readOnly />
              </div>
              <div>
                <label className="text-sky-400 text-[10px] font-black uppercase ml-1 mb-1 block">Mobile Number</label>
                <input className={`${inputBase} opacity-70 cursor-not-allowed`} name="residentPhone" value={formData.residentPhone} readOnly />
              </div>
            </div>

            <div>
              <label className="text-sky-400 text-[10px] font-black uppercase ml-1 mb-1 block">Preferred Time Slot</label>
              <select className={inputBase} name="scheduledSlot" value={formData.scheduledSlot} onChange={handleChange}>
                <option value="Morning (9 AM - 12 PM)">Morning (9 AM - 12 PM)</option>
                <option value="Afternoon (12 PM - 3 PM)">Afternoon (12 PM - 3 PM)</option>
                <option value="Evening (3 PM - 6 PM)">Evening (3 PM - 6 PM)</option>
                <option value="Night (6 PM - 9 PM)">Night (6 PM - 9 PM)</option>
              </select>
            </div>



            <div>

              <label className="text-sky-400 text-[10px] font-black uppercase ml-1 mb-1 block">Description</label>

              <textarea className={`${inputBase} h-28 resize-none`} name="description" placeholder="Describe the issue in detail..." value={formData.description} onChange={handleChange} required />

            </div>



            <div>

              <label className="text-sky-400 text-[10px] font-black uppercase ml-1 mb-2 block">
                Photo Evidence <span className="text-red-400">(Required)</span>
              </label>

              <label className={`block w-full p-5 rounded-2xl border-2 border-dashed text-center cursor-pointer transition-all ${formData.photo ? 'border-green-400 bg-green-900/20' : 'border-slate-500 bg-[#334463] hover:bg-[#3d5175]'}`}>

                <input type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

                {formData.photo ? (

                  <span className="text-green-300 text-sm font-semibold">{formData.photo.name}</span>

                ) : (

                  <span className="text-slate-400 text-sm font-medium">Tap to upload photo</span>

                )}

              </label>

            </div>



            <button type="submit" disabled={submitting}

              className="w-full mt-4 bg-white text-[#25334d] font-black py-4 rounded-full shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest disabled:opacity-50">

              {submitting ? "Submitting..." : "Submit Complaint"}

            </button>

          </form>

        </div>

      </div>

    </div>

  );

};



export default ComplaintForm;