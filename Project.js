const mongoose = require('mongoose');

const ProjectSchema = new mongoose.Schema({
  clientName: { type: String, required: true },
  taskTitle: { type: String, required: true },
  budget: { type: Number, required: true },
  deadline: { type: Date },
  status: { 
    type: String, 
    enum: ['To Do', 'In Progress', 'Invoiced', 'Paid'], 
    default: 'To Do' 
  },
  createdAt: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Project', ProjectSchema);