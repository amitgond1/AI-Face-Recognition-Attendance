// controllers/attendanceController.js - Attendance Logic
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const { sendAttendanceEmail } = require('../config/email');

/**
 * @route   POST /api/attendance
 * @desc    Mark attendance (prevents duplicates on same day)
 * @access  Private
 */
exports.markAttendance = async (req, res) => {
    try {
        const { studentId, confidence, status } = req.body;

        const student = await Student.findOne({ studentId });
        if (!student) {
            return res.status(404).json({ success: false, message: 'Student not found' });
        }

        const today = new Date().toISOString().split('T')[0]; // YYYY-MM-DD
        const now = new Date();
        const timeStr = now.toTimeString().split(' ')[0]; // HH:MM:SS

        // Check for duplicate attendance today
        const existing = await Attendance.findOne({ userId: student._id, date: today });
        if (existing) {
            // Update exit time if already marked entry
            existing.exitTime = timeStr;
            await existing.save();
            return res.status(200).json({
                success: true,
                alreadyMarked: true,
                message: `Attendance already marked for ${student.name} today. Exit time updated.`,
                attendance: existing,
            });
        }

        // Determine status: entries before 9:30 AM = Present, after = Late
        const hour = now.getHours();
        const minute = now.getMinutes();
        const totalMinutes = hour * 60 + minute;
        const attendanceStatus = status || (totalMinutes > 570 ? 'Late' : 'Present'); // 570 = 9:30 AM

        const attendance = await Attendance.create({
            userId: student._id,
            studentId: student.studentId,
            studentName: student.name,
            department: student.department,
            date: today,
            entryTime: timeStr,
            exitTime: '',
            status: attendanceStatus,
            confidence: confidence || 0,
        });

        // Send email notification (non-blocking)
        if (student.email) {
            const dateFormatted = now.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' });
            const timeFormatted = now.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
            sendAttendanceEmail(student.email, student.name, timeFormatted, dateFormatted);
        }

        res.status(201).json({
            success: true,
            message: `✅ Attendance marked for ${student.name}`,
            attendance,
        });
    } catch (error) {
        console.error('Mark attendance error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   GET /api/attendance
 * @desc    Get all attendance records with filters
 * @access  Private
 */
exports.getAllAttendance = async (req, res) => {
    try {
        const { date, department, status, studentId, startDate, endDate } = req.query;
        const filter = {};

        if (date) filter.date = date;
        if (status) filter.status = status;
        if (studentId) filter.studentId = studentId;
        if (department) filter.department = department;
        if (startDate && endDate) {
            filter.date = { $gte: startDate, $lte: endDate };
        }

        const attendance = await Attendance.find(filter)
            .populate('userId', 'name studentId department email imageUrl')
            .sort({ createdAt: -1 });

        res.json({ success: true, count: attendance.length, attendance });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   GET /api/attendance/today-stats
 * @desc    Dashboard statistics for today
 * @access  Private
 */
exports.getTodayStats = async (req, res) => {
    try {
        const today = new Date().toISOString().split('T')[0];
        const totalStudents = await Student.countDocuments();
        const todayAttendance = await Attendance.find({ date: today });

        const presentToday = todayAttendance.filter(a => a.status === 'Present' || a.status === 'Late').length;
        const lateToday = todayAttendance.filter(a => a.status === 'Late').length;
        const absentToday = totalStudents - presentToday;

        // Average attendance (last 30 days)
        const thirtyDaysAgo = new Date();
        thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
        const monthStr = thirtyDaysAgo.toISOString().split('T')[0];

        const monthlyRecords = await Attendance.find({ date: { $gte: monthStr } });
        const avgAttendance = totalStudents > 0
            ? Math.round((monthlyRecords.filter(a => a.status !== 'Absent').length / (totalStudents * 30)) * 100)
            : 0;

        res.json({
            success: true,
            stats: {
                totalStudents,
                presentToday,
                absentToday,
                lateToday,
                avgAttendance: Math.min(avgAttendance, 100),
                date: today,
            },
        });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   GET /api/attendance/student/:id
 * @desc    Get attendance history for a specific student
 * @access  Private
 */
exports.getStudentAttendance = async (req, res) => {
    try {
        const { id } = req.params;
        const student = await Student.findById(id);
        if (!student) return res.status(404).json({ success: false, message: 'Student not found' });

        const attendance = await Attendance.find({ userId: id }).sort({ date: -1 });
        res.json({ success: true, count: attendance.length, attendance, student });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   GET /api/attendance/chart-data
 * @desc    Weekly / monthly attendance data for charts
 * @access  Private
 */
exports.getChartData = async (req, res) => {
    try {
        const { range } = req.query; // 'weekly' | 'monthly'
        const days = range === 'monthly' ? 30 : 7;

        const data = [];
        const totalStudents = await Student.countDocuments();

        for (let i = days - 1; i >= 0; i--) {
            const d = new Date();
            d.setDate(d.getDate() - i);
            const dateStr = d.toISOString().split('T')[0];
            const label = d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short' });

            const count = await Attendance.countDocuments({
                date: dateStr,
                status: { $ne: 'Absent' },
            });

            data.push({
                date: label,
                present: count,
                absent: Math.max(0, totalStudents - count),
                total: totalStudents,
            });
        }

        res.json({ success: true, data });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   POST /api/attendance/mark-exit/:id
 * @desc    Update exit time for an attendance record
 * @access  Private
 */
exports.markExit = async (req, res) => {
    try {
        const { id } = req.params;
        const now = new Date();
        const timeStr = now.toTimeString().split(' ')[0];

        const attendance = await Attendance.findByIdAndUpdate(
            id,
            { exitTime: timeStr },
            { new: true }
        );

        if (!attendance) {
            return res.status(404).json({ success: false, message: 'Attendance record not found' });
        }

        res.json({ success: true, message: 'Exit time updated', attendance });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
