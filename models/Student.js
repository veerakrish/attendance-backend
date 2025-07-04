const mongoose = require('mongoose');

const studentSchema = new mongoose.Schema({
  order: {
    type: Number,
    required: true
  },
  rollNumber: {
    type: String,
    required: true,
    unique: true
  },
  name: {
    type: String,
    required: true
  },
  class: {
    type: String,
    required: true
  },
  section: {
    type: String,
    required: true
  }
}, {
  timestamps: true
});

module.exports = mongoose.model('Student', studentSchema);
