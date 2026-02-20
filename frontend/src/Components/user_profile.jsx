// import { useContext } from "react";
// import { AuthContext } from "../Context/AuthContext";

// function Profile(){

// return <>
//         <h1>Dashboard</h1>
//         <p>To be continued</p>
//     </>
// }

// export default Profile;

import { useEffect, useState, useContext, useRef } from "react";
import { Link } from "react-router-dom";
import { AuthContext } from "../Context/AuthContext";

// ─── Stat Card (admin only) ───────────────────────────────────────────────────
function StatCard({ label, value, color }) {
  return (
    <div className={`p-6 rounded-3xl text-white ${color} flex flex-col gap-1 shadow-md`}>
      <span className="text-3xl font-black">{value}</span>
      <span className="text-xs font-bold uppercase tracking-widest opacity-80">{label}</span>
    </div>
  );
}

// ─── Main Profile Component ───────────────────────────────────────────────────
function Profile() {
  const { role } = useContext(AuthContext);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [photoUploading, setPhotoUploading] = useState(false);
  const [photoPreview, setPhotoPreview] = useState(null);
  const fileInputRef = useRef();

  useEffect(() => {
    fetch("http://localhost:3000/profile", { credentials: "include" })
      .then(res => res.json())
      .then(data => {
        setProfile(data);
        setLoading(false);
      })
      .catch(() => {
        setError("Could not load profile");
        setLoading(false);
      });
  }, []);

  const handlePhotoChange = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    // Show preview immediately
    setPhotoPreview(URL.createObjectURL(file));

    const formData = new FormData();
    formData.append("photo", file);
    setPhotoUploading(true);

    try {
      const res = await fetch("http://localhost:3000/profile/photo", {
        method: "POST",
        credentials: "include",
        body: formData,
      });
      const data = await res.json();
      if (data.success) {
        setProfile(prev => ({ ...prev, photo: data.photo }));
      } else {
        setError("Photo upload failed");
      }
    } catch {
      setError("Photo upload failed");
    } finally {
      setPhotoUploading(false);
    }
  };

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#1a365d]"></div>
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center text-red-500 font-semibold">{error}</div>
  );

  const photoSrc = photoPreview || profile?.photo || null;

  return (
    <div className="min-h-screen bg-gray-50 font-sans pb-16">

      {/* Header banner */}
      <div className="bg-[#25334d] h-36 w-full relative">
        <div className="absolute bottom-0 left-1/2 -translate-x-1/2 translate-y-1/2">
          {/* Profile photo */}
          <div className="relative group">
            <div className="w-28 h-28 rounded-full border-4 border-white shadow-xl overflow-hidden bg-slate-200 flex items-center justify-center">
              {photoSrc ? (
                <img src={photoSrc} alt="Profile" className="w-full h-full object-cover" />
              ) : (
                <span className="text-5xl">👤</span>
              )}
            </div>
            {/* Photo upload button - not for admin */}
            {role !== "admin" && (
              <button
                onClick={() => fileInputRef.current.click()}
                className="absolute bottom-0 right-0 w-8 h-8 bg-[#1a365d] rounded-full flex items-center justify-center shadow-md hover:bg-blue-700 transition"
                title="Change photo"
              >
                {photoUploading ? (
                  <span className="text-white text-xs animate-spin">↻</span>
                ) : (
                  <span className="text-white text-xs">📷</span>
                )}
              </button>
            )}
            <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handlePhotoChange} />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-2xl mx-auto px-4 mt-20 pt-4">

        {/* Name + role badge */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-black text-[#1a365d]">{profile.name}</h1>
          <span className={`inline-block mt-2 px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest
            ${profile.role === "admin" ? "bg-purple-100 text-purple-700" :
              profile.role === "staff" ? "bg-blue-100 text-blue-700" :
              "bg-green-100 text-green-700"}`}>
            {profile.role}
          </span>
        </div>

        {/* ── ADMIN STATS ── */}
        {profile.role === "admin" && profile.stats && (
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-8">
            <StatCard label="Total Residents" value={profile.stats.totalUsers} color="bg-blue-600" />
            <StatCard label="Total Staff" value={profile.stats.totalStaff} color="bg-indigo-600" />
            <StatCard label="Total Complaints" value={profile.stats.totalComplaints} color="bg-slate-600" />
            <StatCard label="Pending" value={profile.stats.pendingComplaints} color="bg-amber-500" />
            <StatCard label="Resolved" value={profile.stats.resolvedComplaints} color="bg-green-600" />
          </div>
        )}

        {/* ── INFO CARD ── */}
        <div className="bg-white rounded-[30px] shadow-sm border border-gray-100 p-6 mb-6">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Account Details</h2>
          <div className="space-y-4">

            <InfoRow label="Email" value={profile.email} />

            {profile.role !== "admin" && (
              <InfoRow label="Phone" value={profile.phone} />
            )}

            {profile.role === "user" && (
              <InfoRow label="Age" value={profile.age} />
            )}

            {profile.role === "staff" && (
              <>
                <InfoRow label="Department" value={profile.department} />
                <InfoRow label="Availability" value={profile.isAvailable ? "✅ Available" : "🔴 Busy"} />
                <InfoRow label="Rating" value={`${"⭐".repeat(profile.rating)} (${profile.rating}/5)`} />
              </>
            )}

            <InfoRow label="Member Since" value={new Date(profile.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "long", day: "numeric" })} />
          </div>
        </div>

        {/* ── ACTIONS ── */}
        <div className="bg-white rounded-[30px] shadow-sm border border-gray-100 p-6 space-y-3">
          <h2 className="text-xs font-black uppercase tracking-widest text-slate-400 mb-4">Actions</h2>

          <Link to="/change-password"
            className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition group">
            <div className="flex items-center gap-3">
              <span className="text-xl">🔒</span>
              <span className="font-bold text-slate-700">Change Password</span>
            </div>
            <span className="text-slate-400 group-hover:text-slate-600">→</span>
          </Link>

          {profile.role === "admin" && (
            <Link to="/create-user"
              className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition group">
              <div className="flex items-center gap-3">
                <span className="text-xl">👤</span>
                <span className="font-bold text-slate-700">Create User / Staff</span>
              </div>
              <span className="text-slate-400 group-hover:text-slate-600">→</span>
            </Link>
          )}

          {profile.role === "user" && (
            <Link to="/FileComplain"
              className="flex items-center justify-between p-4 rounded-2xl bg-gray-50 hover:bg-gray-100 transition group">
              <div className="flex items-center gap-3">
                <span className="text-xl">📋</span>
                <span className="font-bold text-slate-700">File a Complaint</span>
              </div>
              <span className="text-slate-400 group-hover:text-slate-600">→</span>
            </Link>
          )}

          <Link to="/logout"
            className="flex items-center justify-between p-4 rounded-2xl bg-red-50 hover:bg-red-100 transition group">
            <div className="flex items-center gap-3">
              <span className="text-xl">🚪</span>
              <span className="font-bold text-red-600">Logout</span>
            </div>
            <span className="text-red-400 group-hover:text-red-600">→</span>
          </Link>
        </div>
      </div>
    </div>
  );
}

function InfoRow({ label, value }) {
  return (
    <div className="flex justify-between items-center py-2 border-b border-gray-50 last:border-0">
      <span className="text-sm font-bold text-slate-400">{label}</span>
      <span className="text-sm font-semibold text-slate-700">{value}</span>
    </div>
  );
}

export default Profile;