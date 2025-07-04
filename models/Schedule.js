const mongoose = require('mongoose');

const scheduleSchema = new mongoose.Schema({
    class: {
        type: String,
        required: true
    },
    section: {
        type: String,
        required: true
    },
    day: {
        type: String,
        required: true,
        enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
    },
    startTime: {
        type: String,
        required: true
    },
    endTime: {
        type: String,
        required: true
    },
    subject: {
        type: String,
        required: true
    },

});

module.exports = mongoose.model('Schedule', scheduleSchema);
