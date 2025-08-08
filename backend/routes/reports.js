// routes/reports.js
const express = require('express');
const router = express.Router();
const Delivery = require('../models/Delivery'); // تأكد من أن موديل التسليم صحيح
const ExcelJS = require('exceljs');

router.post('/export', async (req, res) => {
    const { stage, grade, deliveryDate, exportType } = req.body;

    try {
        // 1. بناء جملة البحث في MongoDB
        const query = { paymentStatus: 'paid' }; // افترض أنك تريد فقط المدفوع
        // يمكنك إضافة الفلاتر هنا بناءً على البيانات القادمة من الواجهة الأمامية
        // مثال: if (stage) query['studentInfo.stage'] = stage;
        
        const deliveries = await Delivery.find(query).populate('studentId');

        if (exportType === 'excel') {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('تقرير التسليم');

            worksheet.columns = [
                { header: 'اسم الطالب', key: 'studentName', width: 30 },
                { header: 'تاريخ التسليم', key: 'deliveryDate', width: 20 },
                { header: 'المرحلة', key: 'stage', width: 15 },
                { header: 'الصف', key: 'grade', width: 15 },
            ];

            deliveries.forEach(d => {
                worksheet.addRow({
                    studentName: d.studentId.fullName,
                    deliveryDate: new Date(d.deliveryDate).toLocaleDateString('ar-SA'),
                    stage: d.studentId.stage,
                    grade: d.studentId.grade,
                });
            });

            res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
            res.setHeader('Content-Disposition', 'attachment; filename="delivery_report.xlsx"');
            await workbook.xlsx.write(res);
            res.end();
        } else {
            res.status(400).json({ message: 'نوع التصدير غير مدعوم' });
        }

    } catch (error) {
        console.error("Report Export Error:", error);
        res.status(500).json({ message: 'فشل في إنشاء التقرير.' });
    }
});

module.exports = router;