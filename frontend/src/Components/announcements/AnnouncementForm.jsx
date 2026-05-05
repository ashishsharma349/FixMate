import React, { useState } from 'react';
import { API, getAuthHeaders } from '../../utils/api';

const AnnouncementForm = ({ onCreated }) => {
    const [formData, setFormData] = useState({
        title: '',
        content: '',
        targetAudience: 'All',
        priority: 'Medium'
    });

    const [submitting, setSubmitting] = useState(false);

    const handleSubmit = async (e) => {
        e.preventDefault();
        setSubmitting(true);
        try {
            const res = await fetch(`${API}/api/announcements`, {
                method: "POST",
                headers: {
                    "Content-Type": "application/json",
                    ...getAuthHeaders()
                },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (res.ok) {
                alert("Announcement posted successfully!");
                setFormData({ title: '', content: '', targetAudience: 'All', priority: 'Medium' });

                if (onCreated) onCreated();
            } else {
                alert(data.error);
            }
        } catch (err) {
            alert("Failed to post announcement");
        } finally {
            setSubmitting(false);
        }
    };

    const inputClasses = "w-full p-3 rounded-2xl bg-slate-100 border border-slate-200 text-slate-800 placeholder-slate-400 focus:ring-2 focus:ring-blue-400 outline-none transition-all text-sm font-medium";

    return (
        <div className="bg-white rounded-[2.5rem] p-8 shadow-sm border border-slate-100">
            <h3 className="text-xl font-black text-slate-900 mb-6 flex items-center gap-3">
                <span className="w-10 h-10 bg-blue-600 rounded-2xl flex items-center justify-center text-white text-lg shadow-lg shadow-blue-200">📢</span>
                Post New Notice
            </h3>

            <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Notice Title</label>
                    <input 
                        className={inputClasses}
                        placeholder="e.g. Water Tank Cleaning"
                        value={formData.title}
                        onChange={e => setFormData({...formData, title: e.target.value})}
                        required
                    />
                </div>

                <div className="grid grid-cols-1 gap-4">
                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Target Audience</label>
                        <select 
                            className={inputClasses}
                            value={formData.targetAudience}
                            onChange={e => setFormData({...formData, targetAudience: e.target.value})}
                        >
                            <option value="All">Everyone</option>
                            <option value="Residents">Residents Only</option>
                            <option value="Staff">Staff Only</option>
                        </select>
                    </div>

                    <div>
                        <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Priority Level</label>
                        <select 
                            className={inputClasses}
                            value={formData.priority}
                            onChange={e => setFormData({...formData, priority: e.target.value})}
                        >
                            <option value="Low">Low Priority</option>
                            <option value="Medium">Medium Priority</option>
                            <option value="High">High Priority</option>
                        </select>
                    </div>

                </div>

                <div>
                    <label className="text-[10px] font-black text-slate-400 uppercase tracking-widest ml-1 mb-1 block">Detailed Message</label>
                    <textarea 
                        className={`${inputClasses} h-32 resize-none`}
                        placeholder="Write your announcement here..."
                        value={formData.content}
                        onChange={e => setFormData({...formData, content: e.target.value})}
                        required
                    />
                </div>

                <button 
                    type="submit" 
                    disabled={submitting}
                    className="w-full bg-[#1a365d] text-white py-4 rounded-full font-black uppercase text-xs tracking-widest hover:bg-slate-700 transition-all shadow-xl shadow-blue-900/10 disabled:opacity-50"
                >
                    {submitting ? "POSTING..." : "POST ANNOUNCEMENT"}
                </button>
            </form>
        </div>
    );
};

export default AnnouncementForm;
