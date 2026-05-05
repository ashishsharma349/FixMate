import React from 'react';
import AnnouncementBoard from './AnnouncementBoard';

const NoticePage = () => {
    return (
        <div className="min-h-screen bg-slate-50 pb-20">
            <div className="max-w-4xl mx-auto px-6 py-12">
                <div className="mb-10">
                    <h1 className="text-4xl font-black text-[#1a365d] tracking-tight mb-2">Notice Board</h1>
                    <p className="text-slate-500 font-medium text-sm italic">Stay updated with the latest community announcements and management notices.</p>
                </div>
                
                <div className="bg-white rounded-[3rem] p-10 shadow-xl shadow-blue-900/5 border border-slate-100">
                    <AnnouncementBoard />
                </div>
            </div>
        </div>
    );
};

export default NoticePage;
