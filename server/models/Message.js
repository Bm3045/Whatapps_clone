const mongoose = require('mongoose');

const MessageSchema = new mongoose.Schema({
  id: { type: String },
  meta_msg_id: { type: String },
  wa_id: { type: String, required: true },
  name: { type: String },
  number: { type: String },
  text: { type: String },
  media: { type: Object, default: null },
  status: { type: String, enum: ['created','sent','delivered','read','failed'], default: 'created' },
  raw_payload: { type: Object },
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now }
});

MessageSchema.index({ wa_id: 1, createdAt: -1 });
MessageSchema.index({ id: 1 });
MessageSchema.index({ meta_msg_id: 1 });

module.exports = mongoose.model('Message', MessageSchema);
