<<<<<<< HEAD
// const mongoose = require("mongoose");
// const Schema = mongoose.Schema;

// const AnnouncementSchema = new Schema({
//     title: { type: String, required: true },
//     content: { type: String, required: true },
//     targetAudience: {
//         type: String,
//         enum: ['All', 'Residents', 'Staff'],
//         default: 'All'
//     },
//     createdBy: {
//         type: Schema.Types.ObjectId,
//         ref: 'User' // Assuming Admin is in the User collection
//     },
//     createdAt: { type: Date, default: Date.now }
// });

// module.exports = mongoose.model("Announcement", AnnouncementSchema);
=======
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
        ref: 'User' // Assuming Admin is in the User collection
    },
    createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model("Announcement", AnnouncementSchema);
>>>>>>> bdfa590df068d40d85cb979dd4b992907a4e016c
