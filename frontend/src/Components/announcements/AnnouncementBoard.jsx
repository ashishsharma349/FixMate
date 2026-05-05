import React, { useEffect, useState, useContext } from 'react';
import { apiFetch } from '../../utils/api';
import { AuthContext } from '../../Context/AuthContext';

const AnnouncementBoard = () => {
    const { role } = useContext(AuthContext);
    const [announcements, setAnnouncements] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchAnnouncements = async () => {
        try {
            const data = await apiFetch("/api/announcements");
            setAnnouncements(data.announcements || []);
        } catch (err) {
            console.error("Failed to fetch announcements:", err);
        } finally {
            setLoading(false);
        }
    };

    const deleteAnnouncement = async (id) => {
        if (!window.confirm("Delete this announcement?")) return;
        try {
            await apiFetch(`/api/announcements/${id}`, { method: "DELETE" });
            setAnnouncements(announcements.filter(a => a._id !== id));
        } catch (err) {
            console.error("Delete error:", err);
        }
    };

    useEffect(() => {
        fetchAnnouncements();
    }, []);

    if (loading) return <div className="p-4 text-center text-slate-400 font-bold uppercase tracking-widest text-[10px]">Loading Notices...</div>;

    return (
        <div className="space-y-4">
            <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-black text-slate-800 uppercase tracking-wider">Notice Board</h3>
                <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">{announcements.length} Active</span>
            </div>

            {announcements.length === 0 ? (
                <div className="bg-slate-50 border-2 border-dashed border-slate-200 rounded-3xl p-8 text-center">
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest">No new announcements</p>
                </div>
            ) : (
                <div className="grid gap-4 max-h-[500px] overflow-y-auto pr-2 scrollbar-hide">
                    {announcements.map((a) => {
                        const priorityStyles = {
                            High: "border-red-200 bg-red-50/30",
                            Medium: "border-blue-200 bg-blue-50/30",
                            Low: "border-slate-100 bg-white"
                        };
                        const priorityBadge = {
                            High: "bg-red-500 text-white",
                            Medium: "bg-blue-500 text-white",
                            Low: "bg-slate-400 text-white"
                        };
                        
                        return (
                            <div key={a._id} className={`border rounded-[2rem] p-6 shadow-sm hover:shadow-md transition-shadow relative group ${priorityStyles[a.priority] || priorityStyles.Medium}`}>
                                <div className="flex items-start justify-between mb-3">
                                    <span className={`text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${priorityBadge[a.priority] || priorityBadge.Medium}`}>
                                        {a.priority || 'Medium'}
                                    </span>
                                    <span className="text-[10px] text-slate-400 font-bold">{new Date(a.createdAt).toLocaleDateString()}</span>
                                </div>
                                <h4 className="text-base font-extrabold text-slate-900 mb-2 leading-tight">{a.title}</h4>
                                <p className="text-xs text-slate-600 leading-relaxed font-medium whitespace-pre-wrap">{a.content}</p>
                                
                                {role === 'admin' && (
                                    <button 
                                        onClick={() => deleteAnnouncement(a._id)}
                                        className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 text-red-400 hover:text-red-600 transition-all p-1"
                                        title="Delete Announcement"
                                    >
                                        <span className="text-lg">×</span>
                                    </button>
                                )}
                            </div>
                        );
                    })}
                </div>
            )}
        </div>
    );
};

export default AnnouncementBoard;
