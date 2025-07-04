const express = require('express');
const router = express.Router();
const Student = require('../models/Student');

// Get all students with optional class and section filters
router.get('/', async (req, res) => {
  try {
    const { class: className, section } = req.query;
    const query = {};
    
    if (className) query.class = className;
    if (section) query.section = section;
    
    const students = await Student.find(query).sort({ rollNumber: 1 });
    res.json(students);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Get unique classes and sections
router.get('/classes', async (req, res) => {
  try {
    const classes = await Student.distinct('class');
    res.json(classes);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/sections', async (req, res) => {
  try {
    const { class: className } = req.query;
    const query = className ? { class: className } : {};
    const sections = await Student.distinct('section', query);
    res.json(sections);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Add a new student
router.post('/', async (req, res) => {
  const student = new Student({
    rollNumber: req.body.rollNumber,
    name: req.body.name,
    class: req.body.class,
    section: req.body.section,
    order: req.body.order || 0
  });

  try {
    const newStudent = await student.save();
    res.status(201).json(newStudent);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

// Delete a student
router.delete('/:id', async (req, res) => {
  try {
    await Student.findByIdAndDelete(req.params.id);
    res.json({ message: 'Student deleted' });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
