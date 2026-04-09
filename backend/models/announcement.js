const mongoose = require('mongoose');

const announcementSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    trim: true,
    maxlength: [120, 'Title cannot exceed 120 characters']
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: [4000, 'Message cannot exceed 4000 characters']
  },
  audience: {
    type: String,
    enum: ['all', 'clients', 'freelancers', 'admins'],
    default: 'all'
  },
  sendEmail: {
    type: Boolean,
    default: false
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  sentAt: {
    type: Date,
    default: Date.now
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Announcement', announcementSchema);