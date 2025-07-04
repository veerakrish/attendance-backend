const express = require('express');
const router = express.Router();
const csv = require('csv-parser');
const fs = require('fs');
const multer = require('multer');
const Student = require('../models/Student');

const upload = multer({ dest: 'uploads/' });

router.post('/students', upload.single('file'), async (req, res) => {
    try {
        const results = [];
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        fs.createReadStream(req.file.path)
            .pipe(csv())
            .on('data', (data) => {
                // Parse SlNo as number for order
                const order = parseInt(data.SlNo) || results.length + 1;
                results.push({
                    order: order,
                    rollNumber: data.RegdNo,
                    name: data.NameoftheStudent,
                    class: data.Class,
                    section: data.Section
                });
            })
            .on('end', async () => {
                try {
                    // Clear existing students
                    await Student.deleteMany({});
                    
                    // Insert new students
                    await Student.insertMany(results);
                    // Delete the uploaded file
                    fs.unlinkSync(req.file.path);
                    res.json({ message: `Successfully imported ${results.length} students` });
                } catch (error) {
                    res.status(500).json({ message: error.message });
                }
            });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
});

module.exports = router;
