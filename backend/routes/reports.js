// routes/reports.js
const express = require('express');
const router = express.Router();
const Delivery = require('../models/Delivery'); // افترض أن هذا هو موديل التسليم
const ExcelJS = require('exceljs');
const PDFDocument = require('pdfkit');

router.post('/export', async (req, res) => {
    const { stage, grade, division, deliveryDate, exportType } = req.body;

    try {
        // بناء جملة البحث الديناميكية
        const query = { paymentStatus: 'paid' };
        if (stage) query['studentInfo.stage'] = stage;       // عدل هذه المسارات لتطابق الموديل لديك
        if (grade) query['studentInfo.grade'] = grade;     // مثلاً student.stage أو studentDetails.stage
        if (division) query['studentInfo.division'] = division;
        if (deliveryDate) query.deliveryDate = { $gte: new Date(deliveryDate) };

        // جلب البيانات من قاعدة البيانات
        const deliveries = await Delivery.find(query).populate('studentId'); // افترض ان لديك populate للطالب

        if (exportType === 'excel') {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('تقرير التسليم');

            worksheet.columns = [
                { header: 'اسم الطالب', key: 'studentName', width: 30 },
                { header: 'تاريخ التسليم', key: 'deliveryDate', width: 20 },
                { header: 'المرحلة', key: 'stage', width: 15 },
                { header: 'الصف', key: 'grade', width: 15 },
                { header: 'الشعبة', key: 'division', width: 15 },
            ];

            // إضافة البيانات للصفوف
            deliveries.forEach(d => {
                worksheet.addRow({
                    studentName: d.studentId.fullName, // تأكد من صحة هذه المسارات
                    deliveryDate: new Date(d.deliveryDate).toLocaleDateString('ar-SA'),
                    stage: d.studentId.stage,
                    grade: d.studentId.grade,
                    division: d.studentId.division
                });
            });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename="delivery_report.xlsx"');
            await workbook.xlsx.write(res);
            res.end();

        } else if (exportType === 'pdf') {
            // ... يمكنك إضافة كود PDF هنا لاحقاً ...
             res.status(501).json({ message: 'PDF export is not implemented yet.' });
        }

    } catch (error) {
        console.error("Report Export Error:", error);
        res.status(500).json({ message: 'Failed to generate report.' });
    }
});

module.exports = router;