const express = require('express');
const router = express.Router();
const csv = require('csv-parser');
const fs = require('fs');
const multer = require('multer');
const Student = require('../models/Student');

// Configure multer to accept CSV files only
const upload = multer({
    dest: 'uploads/',
    fileFilter: (req, file, cb) => {
        // Accept csv files only
        if (file.mimetype === 'text/csv') {
            cb(null, true);
        } else {
            cb(new Error('Only CSV files are allowed'));
        }
    }
});

router.post('/students', upload.single('file'), async (req, res) => {
    console.log('Received file upload request');
    try {
        if (!req.file) {
            console.log('No file uploaded');
            return res.status(400).json({ message: 'No file uploaded' });
        }

        console.log('File details:', {
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size
        });

        const results = [];
        let hasError = false;
        let errorMessage = '';

        await new Promise((resolve, reject) => {
            fs.createReadStream(req.file.path)
                .pipe(csv())
                .on('data', (data) => {
                    console.log('Processing row:', data); // Log each row

                    // Check if we already encountered an error
                    if (hasError) return;

                    // Validate required fields
                    if (!data.RegdNo || !data.NameoftheStudent || !data.Class || !data.Section) {
                        hasError = true;
                        errorMessage = `Missing required fields in CSV. Required fields: RegdNo, NameoftheStudent, Class, Section. Received: ${JSON.stringify(data)}`;
                        console.log('Validation error:', errorMessage);
                        return;
                    }

                    // Parse SlNo as number for order
                    const order = parseInt(data.SlNo) || results.length + 1;
                    const student = {
                        order: order,
                        rollNumber: data.RegdNo.trim(),
                        name: data.NameoftheStudent.trim(),
                        class: data.Class.trim(),
                        section: data.Section.trim()
                    };
                    console.log('Processed student:', student);
                    results.push(student);
                })
                .on('end', () => {
                    console.log('Finished reading CSV file');
                    if (hasError) {
                        reject(new Error(errorMessage));
                        return;
                    }
                    if (results.length === 0) {
                        reject(new Error('No valid data found in CSV file'));
                        return;
                    }
                    console.log(`Successfully parsed ${results.length} students`);
                    resolve(results);
                })
                .on('error', (error) => {
                    console.error('CSV parsing error:', error);
                    reject(new Error(`Error parsing CSV: ${error.message}`));
                });
        });

        if (results.length === 0) {
            throw new Error('No valid data found in CSV file');
        }

        console.log('Clearing existing students');
        // Clear existing students
        await Student.deleteMany({});
        
        console.log('Inserting new students');
        // Insert new students
        await Student.insertMany(results);
        
        console.log('Import successful');
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
            console.log('Cleaning up uploaded file');
            fs.unlinkSync(req.file.path);
        }
    }
});

module.exports = router;
