const express = require('express');
const router = express.Router();
const Schedule = require('../models/Schedule');

// Get all schedules
router.get('/', async (req, res) => {
    try {
        const { class: className, section } = req.query;
        const query = {};
        if (className) query.class = className;
        if (section) query.section = section;
        
        const schedules = await Schedule.find(query).sort({ day: 1, startTime: 1 });
        res.json(schedules);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

// Add new schedule
router.post('/', async (req, res) => {
    try {
        const schedule = new Schedule({
            class: req.body.class,
            section: req.body.section,
            day: req.body.day,
            startTime: req.body.startTime,
            endTime: req.body.endTime,
            subject: req.body.subject
        });

        const newSchedule = await schedule.save();
        res.status(201).json(newSchedule);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Update schedule
router.put('/:id', async (req, res) => {
    try {
        const schedule = await Schedule.findByIdAndUpdate(
            req.params.id,
            {
                class: req.body.class,
                section: req.body.section,
                day: req.body.day,
                startTime: req.body.startTime,
                endTime: req.body.endTime,
                subject: req.body.subject
            },
            { new: true }
        );

        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }

        res.json(schedule);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
});

// Delete schedule
router.delete('/:id', async (req, res) => {
    try {
        const schedule = await Schedule.findByIdAndDelete(req.params.id);
        
        if (!schedule) {
            return res.status(404).json({ message: 'Schedule not found' });
        }

        res.json({ message: 'Schedule deleted' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
