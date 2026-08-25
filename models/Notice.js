const mongoose = require('mongoose');

const NoticeSchema = new mongoose.Schema(
  {
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 150
    },
    content: {
      type: String,
      required: [true, 'Content is required'],
      trim: true
    },
    author: {
      type: String,
      required: [true, 'Author is required'],
      trim: true,
      default: 'CraftBars Staff'
    },
    date: {
      type: Date,
      default: Date.now
    },
    pinned: {
      type: Boolean,
      default: false
    },
    tag: {
      type: String,
      enum: ['Update', 'Event', 'Maintenance', 'News', 'Community'],
      default: 'News'
    }
  },
  { timestamps: true }
);

// Newest (and pinned) notices first
NoticeSchema.index({ pinned: -1, date: -1 });

module.exports = mongoose.model('Notice', NoticeSchema);
