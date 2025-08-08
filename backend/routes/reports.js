// routes/reports.js
const express = require('express');
const router = express.Router();
const Delivery = require('../models/Delivery'); // تأكد من أن موديل التسليم صحيح
const ExcelJS = require('exceljs');

router.post('/export', async (req, res) => {
    // استلام الفلاتر من الواجهة الأمامية
    const { stage, grade, deliveryDate, exportType } = req.body;

    try {
        // 1. بناء جملة البحث (Query) بشكل ديناميكي
        let query = {};

        // يمكنك إلغاء التعليق عن السطر التالي إذا أردت أن تكون التقارير فقط للمدفوعة
        // query.paymentStatus = 'paid';

        // إضافة فلتر تاريخ التسليم (إذا تم تحديده)
        // يبحث عن كل السجلات التي تاريخ تسليمها أكبر من أو يساوي التاريخ المحدد
        if (deliveryDate) {
            query.deliveryDate = { $gte: new Date(deliveryDate) };
        }
        
        // 2. جلب البيانات من قاعدة البيانات مع فلترة التاريخ فقط
        let deliveries = await Delivery.find(query).populate('studentId').lean();

        // 3. فلترة النتائج بناءً على المرحلة والصف (بعد جلب البيانات)
        // هذه الطريقة أفضل لأنها تفلتر على البيانات المعبأة (populated) من موديل الطالب
        if (stage) {
            deliveries = deliveries.filter(d => d.studentId && d.studentId.stage === stage);
        }

        if (grade && grade.trim() !== '') {
            deliveries = deliveries.filter(d => 
                d.studentId && d.studentId.grade && d.studentId.grade.includes(grade.trim())
            );
        }

        // 4. التحقق من نوع التصدير وإنشاء ملف الإكسل
        if (exportType === 'excel') {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('تقرير التسليم');

            // إعداد الأعمدة
            worksheet.columns = [
                { header: 'اسم الطالب', key: 'studentName', width: 30 },
                { header: 'تاريخ التسليم', key: 'deliveryDate', width: 20 },
                { header: 'المرحلة', key: 'stage', width: 15 },
                { header: 'الصف', key: 'grade', width: 15 },
            ];
            
            // إضافة البيانات إلى الملف
            deliveries.forEach(d => {
                if (d.studentId) { // التأكد من وجود بيانات الطالب لتجنب الأخطاء
                    worksheet.addRow({
                        studentName: d.studentId.fullName,
                        deliveryDate: new Date(d.deliveryDate).toLocaleDateString('ar-SA'),
                        stage: d.studentId.stage,
                        grade: d.studentId.grade,
                    });
                }
            });

            // إرسال الملف إلى المتصفح
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