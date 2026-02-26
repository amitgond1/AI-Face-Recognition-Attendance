// controllers/studentController.js - Student CRUD Operations
const Student = require('../models/Student');
const Attendance = require('../models/Attendance');
const axios = require('axios');
const fs = require('fs');
const path = require('path');

/**
 * @route   POST /api/students
 * @desc    Register a new student with face
 * @access  Private
 */
exports.createStudent = async (req, res) => {
    try {
        const { name, studentId, department, email, phone, imageBase64 } = req.body;

        if (!name || !studentId || !department || !email) {
            return res.status(400).json({ success: false, message: 'Name, studentId, department and email are required' });
        }

        // Check if studentId already exists
        const existing = await Student.findOne({ studentId });
        if (existing) {
            return res.status(400).json({ success: false, message: `Student ID ${studentId} already exists` });
        }

        let faceEmbedding = [];
        let imageUrl = '';
        let faceRegistered = false;
        let aiWarning = null;

        // If image is provided, try to send to AI server for embedding
        // NOTE: If AI server is offline, student is still saved (face can be registered later)
        if (imageBase64) {
            try {
                const aiResponse = await axios.post(`${process.env.AI_SERVER_URL}/register_face`, {
                    image: imageBase64,
                    student_id: studentId,
                    student_name: name,
                }, { timeout: 30000 });

                if (aiResponse.data.success) {
                    faceEmbedding = aiResponse.data.embedding || [];
                    imageUrl = aiResponse.data.image_path || '';
                    faceRegistered = true;
                }
            } catch (aiErr) {
                // AI server is offline or had an error — save student without face data
                console.warn('AI server unavailable (non-fatal):', aiErr.message);
                aiWarning = 'AI server is offline. Student saved without face data. Start the Python AI server and update the student to register their face.';
            }
        }

        const student = await Student.create({
            name, studentId, department, email, phone,
            faceEmbedding, imageUrl, faceRegistered,
        });

        res.status(201).json({
            success: true,
            message: faceRegistered
                ? '✅ Student and face registered successfully'
                : aiWarning
                    ? '⚠️ Student saved — face registration skipped (AI server offline)'
                    : '✅ Student created (no face image provided)',
            warning: aiWarning,
            student,
        });
    } catch (error) {
        console.error('Create student error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};


/**
 * @route   GET /api/students
 * @desc    Get all students
 * @access  Private
 */
exports.getAllStudents = async (req, res) => {
    try {
        const { search, department } = req.query;
        const filter = {};
        if (search) filter.name = { $regex: search, $options: 'i' };
        if (department) filter.department = department;

        const students = await Student.find(filter).select('-faceEmbedding').sort({ createdAt: -1 });
        res.json({ success: true, count: students.length, students });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   GET /api/students/:id
 * @desc    Get student by ID
 * @access  Private
 */
exports.getStudentById = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id).select('-faceEmbedding');
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // Attendance stats
        const attendanceRecords = await Attendance.find({ userId: student._id });
        const totalPresent = attendanceRecords.filter(a => a.status === 'Present' || a.status === 'Late').length;
        const totalDays = attendanceRecords.length;

        res.json({
            success: true,
            student,
            stats: {
                totalPresent,
                totalAbsent: totalDays - totalPresent,
                totalDays,
                attendancePercentage: totalDays > 0 ? Math.round((totalPresent / totalDays) * 100) : 0,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   PUT /api/students/:id
 * @desc    Update student
 * @access  Private
 */
exports.updateStudent = async (req, res) => {
    try {
        const { name, department, email, phone, imageBase64 } = req.body;
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // If new image provided, re-register face
        if (imageBase64) {
            try {
                const aiResponse = await axios.post(`${process.env.AI_SERVER_URL}/register_face`, {
                    image: imageBase64,
                    student_id: student.studentId,
                    student_name: name || student.name,
                }, { timeout: 30000 });

                if (aiResponse.data.success) {
                    student.faceEmbedding = aiResponse.data.embedding || [];
                    student.imageUrl = aiResponse.data.image_path || '';
                    student.faceRegistered = true;
                }
            } catch (aiErr) {
                console.error('AI re-register error:', aiErr.message);
            }
        }

        if (name) student.name = name;
        if (department) student.department = department;
        if (email) student.email = email;
        if (phone) student.phone = phone;

        await student.save();
        res.json({ success: true, message: 'Student updated successfully', student });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   DELETE /api/students/:id
 * @desc    Delete student and their face data
 * @access  Private
 */
exports.deleteStudent = async (req, res) => {
    try {
        const student = await Student.findById(req.params.id);
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        // Delete from AI server face database
        try {
            await axios.delete(`${process.env.AI_SERVER_URL}/delete_face/${student.studentId}`, { timeout: 10000 });
        } catch (aiErr) {
            console.error('AI delete error (non-fatal):', aiErr.message);
        }

        // Delete attendance records
        await Attendance.deleteMany({ userId: student._id });

        await Student.findByIdAndDelete(req.params.id);
        res.json({ success: true, message: 'Student and all their data deleted successfully' });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
