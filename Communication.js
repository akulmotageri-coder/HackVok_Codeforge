const mongoose = require('mongoose');

const CommunicationSchema = new mongoose.Schema({
  platform: { type: String, default: 'Email' },
  content: { type: String, required: true },
  timestamp: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Communication', CommunicationSchema);