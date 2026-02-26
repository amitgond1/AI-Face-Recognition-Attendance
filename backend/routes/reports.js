// routes/reports.js
const express = require('express');
const router = express.Router();
const { exportCSV, exportExcel, exportPDF, getReportSummary } = require('../controllers/reportController');
const { protect } = require('../middleware/auth');

router.get('/summary', protect, getReportSummary);
router.get('/export/csv', protect, exportCSV);
router.get('/export/excel', protect, exportExcel);
router.get('/export/pdf', protect, exportPDF);

module.exports = router;
