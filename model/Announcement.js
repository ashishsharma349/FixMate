const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const AnnouncementSchema = new Schema({
    title: { type: String, required: true },
    content: { type: String, required: true },
    targetAudience: {
        type: String,
        enum: ['All', 'Residents', 'Staff'],
        default: 'All'
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User' 
    },
    priority: {
        type: String,
        enum: ['Low', 'Medium', 'High'],
        default: 'Medium'
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Announcement", AnnouncementSchema);
