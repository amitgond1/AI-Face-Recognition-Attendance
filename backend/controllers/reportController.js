// controllers/reportController.js - Export Reports (CSV, Excel, PDF)
const Attendance = require('../models/Attendance');
const Student = require('../models/Student');
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');
const { createObjectCsvWriter } = require('csv-writer');
const path = require('path');
const fs = require('fs');

/**
 * Helper: build filter from query params
 */
const buildFilter = ({ startDate, endDate, department, status, date }) => {
    const filter = {};
    if (date) filter.date = date;
    if (status) filter.status = status;
    if (department) filter.department = department;
    if (startDate && endDate) filter.date = { $gte: startDate, $lte: endDate };
    return filter;
};

/**
 * @route   GET /api/reports/export/csv
 * @desc    Export attendance as CSV
 * @access  Private
 */
exports.exportCSV = async (req, res) => {
    try {
        const filter = buildFilter(req.query);
        const records = await Attendance.find(filter).sort({ date: -1, entryTime: -1 });

        const csvRows = records.map(r => ({
            'Student Name': r.studentName,
            'Student ID': r.studentId,
            'Department': r.department || '',
            'Date': r.date,
            'Entry Time': r.entryTime,
            'Exit Time': r.exitTime,
            'Status': r.status,
            'Confidence (%)': r.confidence,
        }));

        const csvHeader = Object.keys(csvRows[0] || {
            'Student Name': '', 'Student ID': '', 'Department': '',
            'Date': '', 'Entry Time': '', 'Exit Time': '', 'Status': '', 'Confidence (%)': ''
        });

        let csvContent = csvHeader.join(',') + '\n';
        csvRows.forEach(row => {
            csvContent += csvHeader.map(h => `"${row[h] || ''}"`).join(',') + '\n';
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename=attendance_report.csv');
        res.send(csvContent);
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   GET /api/reports/export/excel
 * @desc    Export attendance as Excel file
 * @access  Private
 */
exports.exportExcel = async (req, res) => {
    try {
        const filter = buildFilter(req.query);
        const records = await Attendance.find(filter).sort({ date: -1 });

        const workbook = new ExcelJS.Workbook();
        workbook.creator = 'FaceAttend System';
        const sheet = workbook.addWorksheet('Attendance Report', {
            properties: { tabColor: { argb: '4F46E5' } },
        });

        // Header styling
        sheet.columns = [
            { header: 'Student Name', key: 'name', width: 20 },
            { header: 'Student ID', key: 'id', width: 15 },
            { header: 'Department', key: 'dept', width: 15 },
            { header: 'Date', key: 'date', width: 12 },
            { header: 'Entry Time', key: 'entry', width: 12 },
            { header: 'Exit Time', key: 'exit', width: 12 },
            { header: 'Status', key: 'status', width: 10 },
            { header: 'Confidence %', key: 'conf', width: 13 },
        ];

        sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFF' } };
        sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: '4F46E5' } };

        records.forEach(r => {
            const row = sheet.addRow({
                name: r.studentName,
                id: r.studentId,
                dept: r.department || '',
                date: r.date,
                entry: r.entryTime,
                exit: r.exitTime,
                status: r.status,
                conf: r.confidence,
            });
            // Color code status
            const statusCell = row.getCell('status');
            if (r.status === 'Present') statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'D1FAE5' } };
            else if (r.status === 'Late') statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEF9C3' } };
            else statusCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FEE2E2' } };
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename=attendance_report.xlsx');
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   GET /api/reports/export/pdf
 * @desc    Export attendance as PDF
 * @access  Private
 */
exports.exportPDF = async (req, res) => {
    try {
        const filter = buildFilter(req.query);
        const records = await Attendance.find(filter).sort({ date: -1 });

        const doc = new PDFDocument({ margin: 40, size: 'A4', layout: 'landscape' });
        res.setHeader('Content-Type', 'application/pdf');
        res.setHeader('Content-Disposition', 'attachment; filename=attendance_report.pdf');
        doc.pipe(res);

        // Title
        doc.fontSize(20).fillColor('#4F46E5').text('FaceAttend — Attendance Report', { align: 'center' });
        doc.fontSize(10).fillColor('#6b7280').text(`Generated: ${new Date().toLocaleString('en-IN')}`, { align: 'center' });
        doc.moveDown(1.5);

        // Table headers
        const headers = ['Student Name', 'Student ID', 'Dept', 'Date', 'Entry', 'Exit', 'Status', 'Conf%'];
        const colWidths = [120, 90, 70, 80, 70, 70, 70, 60];
        let x = 40;
        let y = doc.y;

        doc.rect(x, y, colWidths.reduce((a, b) => a + b, 0), 20).fill('#4F46E5');
        headers.forEach((h, i) => {
            doc.fillColor('#FFFFFF').fontSize(9).text(h, x + 4, y + 5, { width: colWidths[i] - 4 });
            x += colWidths[i];
        });
        y += 22;

        // Table rows
        records.slice(0, 100).forEach((r, idx) => {
            const rowData = [r.studentName, r.studentId, r.department || '', r.date, r.entryTime, r.exitTime, r.status, `${r.confidence}%`];
            x = 40;
            const bg = idx % 2 === 0 ? '#F9FAFB' : '#FFFFFF';
            doc.rect(x, y, colWidths.reduce((a, b) => a + b, 0), 18).fill(bg);

            rowData.forEach((d, i) => {
                let color = '#374151';
                if (i === 6) {
                    color = r.status === 'Present' ? '#059669' : r.status === 'Late' ? '#D97706' : '#DC2626';
                }
                doc.fillColor(color).fontSize(8).text(String(d || ''), x + 4, y + 4, { width: colWidths[i] - 4 });
                x += colWidths[i];
            });
            y += 20;
            if (y > 530) { doc.addPage({ layout: 'landscape' }); y = 40; }
        });

        doc.end();
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};

/**
 * @route   GET /api/reports/summary
 * @desc    Get daily/weekly/monthly report summary
 * @access  Private
 */
exports.getReportSummary = async (req, res) => {
    try {
        const { type } = req.query; // 'daily' | 'weekly' | 'monthly'
        const days = type === 'monthly' ? 30 : type === 'weekly' ? 7 : 1;

        const startDate = new Date();
        startDate.setDate(startDate.getDate() - (days - 1));
        const startStr = startDate.toISOString().split('T')[0];
        const endStr = new Date().toISOString().split('T')[0];

        const records = await Attendance.find({ date: { $gte: startStr, $lte: endStr } });
        const totalStudents = await Student.countDocuments();

        const summary = {
            totalStudents,
            totalRecords: records.length,
            present: records.filter(r => r.status === 'Present').length,
            late: records.filter(r => r.status === 'Late').length,
            absent: records.filter(r => r.status === 'Absent').length,
            dateRange: { start: startStr, end: endStr },
        };

        res.json({ success: true, summary });
    } catch (error) {
        res.status(500).json({ success: false, message: error.message });
    }
};
