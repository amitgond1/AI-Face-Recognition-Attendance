// controllers/authController.js - Authentication Logic
const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

/**
 * Generate JWT token
 */
const generateToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: '7d' });
};

/**
 * @route   POST /api/auth/signup
 * @desc    Register a new admin
 * @access  Public
 */
exports.signup = async (req, res) => {
    try {
        const { name, email, password } = req.body;

        if (!name || !email || !password) {
            return res.status(400).json({ success: false, message: 'All fields are required' });
        }

        const existingAdmin = await Admin.findOne({ email });
        if (existingAdmin) {
            return res.status(400).json({ success: false, message: 'Admin with this email already exists' });
        }

        const admin = await Admin.create({ name, email, password });
        const token = generateToken(admin._id);

        res.status(201).json({
            success: true,
            message: 'Admin registered successfully',
            token,
            admin: { id: admin._id, name: admin.name, email: admin.email },
        });
    } catch (error) {
        console.error('Signup error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   POST /api/auth/login
 * @desc    Login admin and get JWT token
 * @access  Public
 */
exports.login = async (req, res) => {
    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ success: false, message: 'Email and password are required' });
        }

        const admin = await Admin.findOne({ email });
        if (!admin) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const isMatch = await admin.comparePassword(password);
        if (!isMatch) {
            return res.status(401).json({ success: false, message: 'Invalid credentials' });
        }

        const token = generateToken(admin._id);
        res.json({
            success: true,
            message: 'Login successful',
            token,
            admin: { id: admin._id, name: admin.name, email: admin.email },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   GET /api/auth/me
 * @desc    Get current admin info
 * @access  Private
 */
exports.getMe = async (req, res) => {
    try {
        const admin = await Admin.findById(req.user.id).select('-password');
        res.json({ success: true, admin });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
