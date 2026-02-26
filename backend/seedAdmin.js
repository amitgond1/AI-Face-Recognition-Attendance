// seedAdmin.js — Run once to create the admin account
// Usage: node seedAdmin.js
require('dotenv').config();
const mongoose = require('mongoose');
const Admin = require('./models/Admin');

const ADMIN_EMAIL = 'amit@gmail.com';
const ADMIN_PASSWORD = 'amitgond12';
const ADMIN_NAME = 'Amit';

async function seed() {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://127.0.0.1:27017/face-attendance');
        console.log('✅ MongoDB connected');

        const existing = await Admin.findOne({ email: ADMIN_EMAIL });
        if (existing) {
            console.log(`⚠️  Admin ${ADMIN_EMAIL} already exists. Deleting and recreating...`);
            await Admin.deleteOne({ email: ADMIN_EMAIL });
        }

        const admin = await Admin.create({
            name: ADMIN_NAME,
            email: ADMIN_EMAIL,
            password: ADMIN_PASSWORD, // Will be hashed by pre-save hook in Admin model
        });

        console.log('🎉 Admin account created successfully!');
        console.log(`   Email   : ${ADMIN_EMAIL}`);
        console.log(`   Password: ${ADMIN_PASSWORD}`);
        console.log(`   Name    : ${admin.name}`);
        console.log(`   ID      : ${admin._id}`);
    } catch (err) {
        console.error('❌ Seed failed:', err.message);
    } finally {
        await mongoose.disconnect();
        process.exit(0);
    }
}

seed();
