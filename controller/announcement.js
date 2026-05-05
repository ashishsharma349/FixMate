const Announcement = require("../model/Announcement");

// Create Announcement (Admin Only)
exports.handlePost_createAnnouncement = async (req, res) => {
    try {
        const { title, content, targetAudience, priority } = req.body;
        
        if (!title || !content) {
            return res.status(400).json({ error: "Title and content are required" });
        }

        const announcement = await Announcement.create({
            title,
            content,
            targetAudience: targetAudience || 'All',
            priority: priority || 'Medium',
            createdBy: req.session.user.id
        });

        res.status(201).json({
            success: true,
            announcement
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to create announcement" });
    }
};

// Get Announcements (Based on role)
exports.handleGet_allAnnouncements = async (req, res) => {
    try {
        const userRole = req.session.user.role;
        let filter = { targetAudience: 'All' };
        
        if (userRole === 'admin') {
            filter = {}; // Admin sees everything
        } else if (userRole === 'user') {
            filter = { targetAudience: { $in: ['All', 'Residents'] } };
        } else if (userRole === 'staff') {
            filter = { targetAudience: { $in: ['All', 'Staff'] } };
        }

        const announcements = await Announcement.find(filter).sort({ createdAt: -1 });
        
        res.status(200).json({
            success: true,
            announcements
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to fetch announcements" });
    }
};

// Delete Announcement (Admin Only)
exports.handleDelete_announcement = async (req, res) => {
    try {
        const { id } = req.params;
        await Announcement.findByIdAndDelete(id);
        res.status(200).json({
            success: true,
            message: "Announcement deleted"
        });
    } catch (err) {
        res.status(500).json({ error: "Failed to delete announcement" });
    }
};
