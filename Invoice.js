const mongoose = require('mongoose');

const InvoiceSchema = new mongoose.Schema({
  amount: { type: Number, required: true },
  status: { type: String, enum: ['Draft', 'Sent', 'Paid'], default: 'Draft' },
  project: { type: mongoose.Schema.Types.ObjectId, ref: 'Project' },
  client: { type: mongoose.Schema.Types.ObjectId, ref: 'Client' },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Invoice', InvoiceSchema);