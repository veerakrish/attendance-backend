const express = require('express');
const router = express.Router();
const csv = require('csv-parser');
const fs = require('fs');
const multer = require('multer');
const Student = require('../models/Student');

const upload = multer({ dest: 'uploads/' });

router.post('/students', upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ message: 'No file uploaded' });
        }

        const results = [];
        let hasError = false;
        let errorMessage = '';

        await new Promise((resolve, reject) => {
            fs.createReadStream(req.file.path)
                .pipe(csv())
                .on('data', (data) => {
                    // Check if we already encountered an error
                    if (hasError) return;

                    // Validate required fields
                    if (!data.RegdNo || !data.NameoftheStudent || !data.Class || !data.Section) {
                        hasError = true;
                        errorMessage = 'Missing required fields in CSV. Required fields: RegdNo, NameoftheStudent, Class, Section';
                        return;
                    }

                    // Parse SlNo as number for order
                    const order = parseInt(data.SlNo) || results.length + 1;
                    results.push({
                        order: order,
                        rollNumber: data.RegdNo.trim(),
                        name: data.NameoftheStudent.trim(),
                        class: data.Class.trim(),
                        section: data.Section.trim()
                    });
                })
                .on('end', () => {
                    if (hasError) {
                        reject(new Error(errorMessage));
                        return;
                    }
                    if (results.length === 0) {
                        reject(new Error('No valid data found in CSV file'));
                        return;
                    }
                    resolve(results);
                })
                .on('error', (error) => {
                    reject(new Error(`Error parsing CSV: ${error.message}`));
                });
        });

        if (results.length === 0) {
            throw new Error('No valid data found in CSV file');
        }

        // Clear existing students
        await Student.deleteMany({});
        
        // Insert new students
        await Student.insertMany(results);
        
        // Success response
        res.json({ 
            message: `Successfully imported ${results.length} students`,
            students: results
        });

    } catch (error) {
        console.error('Import error:', error);
        res.status(400).json({ 
            message: 'Error importing students. Please check the CSV format.',
            error: error.message
        });
    } finally {
        // Clean up the uploaded file if it exists
        if (req.file && fs.existsSync(req.file.path)) {
            fs.unlinkSync(req.file.path);
        }
    }
});

module.exports = router;
