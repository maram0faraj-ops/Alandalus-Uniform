const express = require('express');
const router = express.Router();
const Delivery = require('../models/Delivery');
const ExcelJS = require('exceljs');

router.post('/export', async (req, res) => {
    const { stage, grade, deliveryDate, exportType } = req.body;

    try {
        // 1. بناء جملة البحث مباشرة من حقول نموذج Delivery
        const query = {};

        if (stage) {
            query.stage = stage; // البحث في حقل المرحلة مباشرة
        }
        if (grade && grade.trim() !== '') {
            query.grade = { $regex: grade.trim(), $options: 'i' }; // بحث تقريبي عن الصف
        }
        if (deliveryDate) {
            query.deliveryDate = { $gte: new Date(deliveryDate) };
        }

        // 2. جلب البيانات المطابقة للفلاتر (بدون الحاجة لـ .populate)
        const deliveries = await Delivery.find(query);

        // 3. إنشاء ملف الإكسل
        if (exportType === 'excel') {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('تقرير التسليم');

            worksheet.columns = [
                { header: 'اسم الطالب', key: 'studentName', width: 30 },
                { header: 'تاريخ التسليم', key: 'deliveryDate', width: 20 },
                { header: 'المرحلة', key: 'stage', width: 15 },
                { header: 'الصف', key: 'grade', width: 15 },
            ];

            // إضافة البيانات مباشرة من السجلات
            deliveries.forEach(d => {
                worksheet.addRow({
                    studentName: d.studentName,
                    deliveryDate: d.deliveryDate ? new Date(d.deliveryDate).toLocaleDateString('ar-SA') : 'غير محدد',
                    stage: d.stage,
                    grade: d.grade,
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