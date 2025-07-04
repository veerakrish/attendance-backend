const nodemailer = require('nodemailer');
require('dotenv').config();

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_APP_PASSWORD
    }
});

const sendDailySchedule = async (userEmail, schedules) => {
    if (!schedules || schedules.length === 0) {
        return;
    }

    let scheduleText = schedules.map(schedule => 
        `${schedule.type.toUpperCase()}: ${schedule.subject}\n` +
        `Time: ${schedule.startTime} - ${schedule.endTime}\n` +
        `Location: ${schedule.location}\n`
    ).join('\n');

    const mailOptions = {
        from: process.env.EMAIL_USER,
        to: userEmail,
        subject: `Today's Class Schedule - ${new Date().toLocaleDateString()}`,
        text: `Here's your schedule for today:\n\n${scheduleText}`
    };

    try {
        await transporter.sendMail(mailOptions);
        console.log('Schedule email sent successfully');
    } catch (error) {
        console.error('Error sending email:', error);
    }
};

module.exports = { sendDailySchedule };
