// routes/students.js
const express = require('express');
const router = express.Router();
const {
    createStudent,
    getAllStudents,
    getStudentById,
    updateStudent,
    deleteStudent,
} = require('../controllers/studentController');
const { protect } = require('../middleware/auth');

router.post('/', protect, createStudent);
router.get('/', getAllStudents); // Public for Kiosk to load student list
router.get('/:id', protect, getStudentById);
router.put('/:id', protect, updateStudent);
router.delete('/:id', protect, deleteStudent);

module.exports = router;
