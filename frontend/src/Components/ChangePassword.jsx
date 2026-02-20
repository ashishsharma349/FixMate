import { useState, useContext } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { AuthContext } from "../Context/AuthContext";

function ChangePassword() {
  const navigate = useNavigate();
  const { isLoggedIn, clearFirstLogin } = useContext(AuthContext);

  // ALL state hooks must come before any conditional return
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Guard AFTER all hooks
  if (!isLoggedIn) return <Navigate to="/login" />;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    if (formData.newPassword !== formData.confirmPassword) {
      setError("New passwords do not match");
      return;
    }

    const strongPassword = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
    if (!strongPassword.test(formData.newPassword)) {
      setError("Password must be 8+ chars with uppercase, lowercase, digit and special character");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("http://localhost:3000/change-password", {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
          confirmPassword: formData.confirmPassword,
        }),
      });

      const data = await res.json();

      if (data.success) {
        clearFirstLogin();
        navigate("/");
      } else {
        setError(data.error || "Could not change password");
      }
    } catch (err) {
      setError("Server error. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const inputStyle = "w-full p-4 rounded-xl bg-[#cbd5e1] text-slate-800 placeholder-slate-500 outline-none focus:ring-2 focus:ring-blue-400 transition-all";

  return (
    <div className="min-h-screen w-full flex items-center justify-center bg-gray-100 p-0 sm:p-4">
      <div className="relative w-full h-screen sm:h-auto sm:max-w-[420px] bg-white sm:rounded-[40px] shadow-2xl overflow-hidden flex flex-col">

        <div className="flex-[0.4] min-h-[150px] flex flex-col items-center justify-center relative bg-white px-6">
          <div className="absolute top-0 w-full opacity-20 pointer-events-none">
            <svg viewBox="0 0 500 200" xmlns="http://www.w3.org/2000/svg">
              <path d="M0,80 C150,180 350,20 500,80 L500,0 L0,0 Z" fill="#3b82f6"></path>
            </svg>
          </div>
          <div className="z-10 flex flex-col items-center text-center">
            <div className="w-14 h-14 bg-[#1a365d] rounded-full flex items-center justify-center mb-2 shadow-lg">
              <span className="text-white text-2xl">🔒</span>
            </div>
            <h1 className="text-2xl font-extrabold text-[#1a365d]">Set New Password</h1>
            <p className="text-xs text-amber-500 font-bold uppercase tracking-widest mt-1">First Login — Change Required</p>
          </div>
        </div>

        <div className="bg-[#25334d] rounded-t-[40px] p-8 flex-[1.6] flex flex-col shadow-[0_-10px_20px_rgba(0,0,0,0.1)] overflow-y-auto">
          <form onSubmit={handleSubmit} className="flex flex-col gap-4 w-full max-w-sm mx-auto">

            <div>
              <label className="text-sky-400 text-[10px] font-bold uppercase ml-1 mb-1 block">Temp / Current Password</label>
              <input type="password" name="currentPassword" placeholder="Password from your email"
                className={inputStyle} value={formData.currentPassword} onChange={handleChange} required />
            </div>

            <div>
              <label className="text-sky-400 text-[10px] font-bold uppercase ml-1 mb-1 block">New Password</label>
              <input type="password" name="newPassword" placeholder="Min 8 chars, upper, lower, digit, special"
                className={inputStyle} value={formData.newPassword} onChange={handleChange} required />
            </div>

            <div>
              <label className="text-sky-400 text-[10px] font-bold uppercase ml-1 mb-1 block">Confirm New Password</label>
              <input type="password" name="confirmPassword" placeholder="Repeat new password"
                className={inputStyle} value={formData.confirmPassword} onChange={handleChange} required />
            </div>

            {error && (
              <p className="text-red-300 text-xs text-center bg-red-900/20 py-2 px-3 rounded-lg">{error}</p>
            )}

            <button type="submit" disabled={loading}
              className="w-full mt-4 bg-white text-[#25334d] font-bold py-4 rounded-full shadow-lg hover:scale-[1.02] active:scale-[0.98] transition-all uppercase tracking-widest disabled:opacity-50">
              {loading ? "Saving..." : "Set Password"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}

export default ChangePassword;