// routes/attendance.js
const express = require('express');
const router = express.Router();
const {
    markAttendance,
    getAllAttendance,
    getTodayStats,
    getStudentAttendance,
    getChartData,
    markExit,
} = require('../controllers/attendanceController');
const { protect } = require('../middleware/auth');

router.post('/', markAttendance); // Public for Kiosk
router.get('/', protect, getAllAttendance);
router.get('/stats/today', protect, getTodayStats);
router.get('/chart-data', protect, getChartData);
router.get('/student/:id', protect, getStudentAttendance);
router.put('/exit/:id', protect, markExit);

module.exports = router;
