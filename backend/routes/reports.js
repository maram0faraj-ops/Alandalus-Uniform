const express = require('express');
const router = express.Router();
const Delivery = require('../models/Delivery');
const ExcelJS = require('exceljs');

router.post('/export', async (req, res) => {
    // استلام الفلتر الجديد 'section'
    const { stage, grade, section, deliveryDate, exportType } = req.body;

    try {
        const query = {};

        if (stage) {
            query.stage = stage;
        }
        if (grade) {
            query.grade = grade; // الآن البحث عن قيمة مطابقة تمامًا من القائمة
        }
        // إضافة فلتر الشعبة للبحث
        if (section) {
            query.section = section;
        }
        if (deliveryDate) {
            query.deliveryDate = { $gte: new Date(deliveryDate) };
        }

        const deliveries = await Delivery.find(query);

        if (exportType === 'excel') {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('تقرير التسليم');

            // إضافة عمود 'الشعبة' لملف الإكسل
            worksheet.columns = [
                { header: 'اسم الطالب', key: 'studentName', width: 30 },
                { header: 'تاريخ التسليم', key: 'deliveryDate', width: 20 },
                { header: 'المرحلة', key: 'stage', width: 15 },
                { header: 'الصف', key: 'grade', width: 15 },
                { header: 'الشعبة', key: 'section', width: 10 }, // <-- العمود الجديد
            ];

            deliveries.forEach(d => {
                worksheet.addRow({
                    studentName: d.studentName,
                    deliveryDate: d.deliveryDate ? new Date(d.deliveryDate).toLocaleDateString('ar-SA') : 'غير محدد',
                    stage: d.stage,
                    grade: d.grade,
                    section: d.section, // <-- إضافة بيانات الشعبة لكل صف
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