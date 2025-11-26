const mongoose = require('mongoose');

const ClientSchema = new mongoose.Schema({
  name: { type: String, required: true },
  email: { type: String },
  company: { type: String },
  history: [{
    event: String,
    date: { type: Date, default: Date.now }
  }]
});

module.exports = mongoose.model('Client', ClientSchema);
