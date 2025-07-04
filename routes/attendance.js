const express = require('express');
const router = express.Router();
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');

// Get attendance for a specific date
router.get('/:date', async (req, res) => {
  try {
    const targetDate = new Date(req.params.date);
    // Set time to start of day
    targetDate.setHours(0, 0, 0, 0);
    
    const attendance = await Attendance.find({
      date: {
        $gte: targetDate,
        $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
      }
    }).populate({
      path: 'student',
      select: 'rollNumber name class order' // Include order field
    });

    // Get all students to ensure we have a complete list
    const allStudents = await Student.find().sort('order');
    
    // Create a map of attendance by student ID
    const attendanceMap = attendance.reduce((map, record) => {
      if (record.student) {
        map[record.student._id] = record;
      }
      return map;
    }, {});

    // Create attendance records in student order
    const orderedAttendance = allStudents.map(student => {
      return attendanceMap[student._id] || {
        student: student,
        date: targetDate,
        status: 'not_marked'
      };
    });

    res.json(orderedAttendance);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Validate date
const validateDate = (date) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  
  const checkDate = new Date(date);
  checkDate.setHours(0, 0, 0, 0);

  return checkDate <= today;
};

// Mark attendance
router.post('/', async (req, res) => {
  try {
    const { studentId, date, status } = req.body;
    const targetDate = new Date(date);
    targetDate.setHours(0, 0, 0, 0);

    // Validate date
    if (!validateDate(targetDate)) {
      return res.status(400).json({ 
        message: 'Cannot mark attendance for future dates' 
      });
    }

    console.log(`Marking attendance for student ${studentId} on ${targetDate} as ${status}`);

    // Find or create attendance record
    let attendance = await Attendance.findOneAndUpdate(
      {
        student: studentId,
        date: {
          $gte: targetDate,
          $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
        }
      },
      {
        student: studentId,
        date: targetDate,
        status: status
      },
      {
        new: true,
        upsert: true,
        runValidators: true
      }
    );

    // Return populated attendance
    const populatedAttendance = await Attendance.findById(attendance._id)
      .populate({
        path: 'student',
        select: 'rollNumber name class order'
      });

    console.log('Attendance marked successfully:', populatedAttendance);
    res.json(populatedAttendance);
  } catch (error) {
    console.error('Error marking attendance:', error);
    res.status(400).json({ message: error.message });
  }
});

// Update attendance
router.put('/:id', async (req, res) => {
  try {
    const updatedAttendance = await Attendance.findByIdAndUpdate(
      req.params.id,
      { status: req.body.status },
      { new: true }
    );
    res.json(updatedAttendance);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Get attendance percentage for all students
router.get('/percentage', async (req, res) => {
  try {
    const students = await Student.find();
    const attendance = await Attendance.find();
    
    const studentAttendance = {};
    
    // Initialize counts for each student
    students.forEach(student => {
      studentAttendance[student._id] = {
        total: 0,
        present: 0,
        percentage: 0,
        student: {
          name: student.name,
          rollNumber: student.rollNumber
        }
      };
    });

    // Calculate attendance for each student
    attendance.forEach(record => {
      if (studentAttendance[record.student]) {
        studentAttendance[record.student].total++;
        if (record.status === 'present') {
          studentAttendance[record.student].present++;
        }
      }
    });

    // Calculate percentages
    Object.keys(studentAttendance).forEach(studentId => {
      const record = studentAttendance[studentId];
      record.percentage = record.total > 0 
        ? ((record.present / record.total) * 100).toFixed(2)
        : 0;
    });

    res.json(Object.values(studentAttendance));
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
