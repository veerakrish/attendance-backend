const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const dotenv = require('dotenv');
const cron = require('node-cron');
const { sendDailySchedule } = require('./utils/emailService');
const Schedule = require('./models/Schedule');

dotenv.config();

const app = express();

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:3000',
  credentials: true
}));
app.use(express.json());

// Health check endpoint
app.get('/health', (req, res) => {
  res.json({ status: 'ok' });});

// MongoDB connection
const connectDB = async () => {
  try {
    const mongoURI = process.env.MONGODB_URI || 'mongodb://localhost:27017/attendance_system';
    console.log('Connecting to MongoDB at:', mongoURI);
    
    await mongoose.connect(mongoURI, {
      useNewUrlParser: true,
      useUnifiedTopology: true
    });

    console.log('MongoDB Connected Successfully');
  } catch (err) {
    console.error('MongoDB Connection Error:', err.message);
    process.exit(1);
  }
};

// Connect to MongoDB
connectDB();

// Routes
const studentRoutes = require('./routes/students');
const attendanceRoutes = require('./routes/attendance');
const importRoutes = require('./routes/import');
const scheduleRoutes = require('./routes/scheduleRoutes');

app.use('/api/students', studentRoutes);
app.use('/api/attendance', attendanceRoutes);
app.use('/api/import', importRoutes);
app.use('/api/schedules', scheduleRoutes);

// Schedule daily notifications
cron.schedule('0 7 * * *', async () => {
    try {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        const today = days[new Date().getDay()];
        const todaySchedule = await Schedule.find({ day: today }).sort({ startTime: 1 });
        
        if (todaySchedule.length > 0) {
            await sendDailySchedule(process.env.TARGET_EMAIL, todaySchedule);
        }
    } catch (error) {
        console.error('Error sending daily schedule:', error);
    }
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
