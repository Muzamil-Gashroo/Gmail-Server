const mongoose = require("mongoose");

const SentEmailSchema = new mongoose.Schema({
  trackingId: String,
  messageId: String,
  from: String,
  to: String,
  subject: String,
  sentAt: { type: Date, default: Date.now },
  opened: { type: Boolean, default: false },
  openedAt: Date
});

module.exports = mongoose.model('SentEmail', SentEmailSchema);