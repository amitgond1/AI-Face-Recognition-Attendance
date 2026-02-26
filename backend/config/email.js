// config/email.js - Nodemailer Configuration
const nodemailer = require('nodemailer');

const transporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
        user: process.env.EMAIL_USER,
        pass: process.env.EMAIL_PASS,
    },
});

/**
 * Send attendance notification email
 * @param {string} to - Recipient email
 * @param {string} studentName - Student's name
 * @param {string} time - Attendance time
 */
const sendAttendanceEmail = async (to, studentName, time, date) => {
    try {
        const mailOptions = {
            from: process.env.EMAIL_FROM,
            to,
            subject: `✅ Attendance Marked — ${studentName}`,
            html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: auto; padding: 20px; background: #f9fafb; border-radius: 12px;">
          <div style="background: linear-gradient(135deg, #4F46E5, #06B6D4); border-radius: 10px; padding: 30px; text-align: center;">
            <h1 style="color: white; margin: 0;">FaceAttend</h1>
            <p style="color: #e0e7ff;">AI-Powered Attendance System</p>
          </div>
          <div style="background: white; border-radius: 10px; padding: 30px; margin-top: 20px;">
            <h2 style="color: #1e1b4b;">Attendance Marked</h2>
            <p style="color: #374151;">Dear <strong>${studentName}</strong>,</p>
            <p style="color: #374151;">Your attendance has been successfully recorded.</p>
            <div style="background: #f3f4f6; border-radius: 8px; padding: 16px; margin: 20px 0;">
              <p style="margin: 5px 0; color: #374151;"><strong>📅 Date:</strong> ${date}</p>
              <p style="margin: 5px 0; color: #374151;"><strong>⏰ Time:</strong> ${time}</p>
              <p style="margin: 5px 0; color: #22c55e;"><strong>✅ Status:</strong> Present</p>
            </div>
            <p style="color: #6b7280; font-size: 14px;">This is an automated message from FaceAttend System.</p>
          </div>
        </div>
      `,
        };
        await transporter.sendMail(mailOptions);
        console.log(`📧 Email sent to ${to}`);
    } catch (error) {
        console.error('Email error:', error.message);
        // Don't throw - email failure shouldn't break attendance marking
    }
};

module.exports = { sendAttendanceEmail };
