// models/Attendance.js - Attendance Schema
const mongoose = require('mongoose');

const attendanceSchema = new mongoose.Schema({
    // Reference to Student
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Student',
        required: true,
    },
    studentId: {
        type: String,
        required: true,
    },
    studentName: {
        type: String,
        required: true,
    },
    department: {
        type: String,
    },
    // Date in YYYY-MM-DD format for easy deduplication
    date: {
        type: String,
        required: true,
    },
    entryTime: {
        type: String,
        default: '',
    },
    exitTime: {
        type: String,
        default: '',
    },
    status: {
        type: String,
        enum: ['Present', 'Late', 'Absent'],
        default: 'Present',
    },
    // AI recognition confidence score 0–100
    confidence: {
        type: Number,
        default: 0,
    },
    createdAt: {
        type: Date,
        default: Date.now,
    },
});

// Compound unique index to prevent duplicate attendance on same day
attendanceSchema.index({ userId: 1, date: 1 }, { unique: true });

module.exports = mongoose.model('Attendance', attendanceSchema);
