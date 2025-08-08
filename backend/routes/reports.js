// routes/reports.js
const express = require('express');
const router = express.Router();
const Delivery = require('../models/Delivery');
const ExcelJS = require('exceljs');

router.post('/export', async (req, res) => {
    const { stage, grade, deliveryDate, exportType } = req.body;

    try {
        // 1. بناء جملة البحث الأساسية
        const query = {};
        if (deliveryDate) {
            query.deliveryDate = { $gte: new Date(deliveryDate) };
        }

        // 2. جلب البيانات من قاعدة البيانات
        const deliveries = await Delivery.find(query).populate('studentId');

        // 3. فلترة النتائج بطريقة آمنة
        const filteredDeliveries = deliveries.filter(d => {
            // الشرط الأول: تجاهل أي سجل تسليم لا يرتبط بطالب موجود
            if (!d.studentId) {
                return false;
            }
            // الشرط الثاني (فلتر المرحلة): إذا كان فلتر المرحلة مفعّلاً، تأكد من تطابقه
            if (stage && d.studentId.stage !== stage) {
                return false;
            }
            // الشرط الثالث (فلتر الصف): إذا كان فلتر الصف مفعّلاً، تأكد من وجود حقل الصف وتطابقه
            if (grade && (!d.studentId.grade || !d.studentId.grade.includes(grade))) {
                return false;
            }
            // إذا مرت من كل الشروط، احتفظ بهذا السجل
            return true;
        });

        // 4. التحقق من نوع التصدير وإنشاء ملف الإكسل
        if (exportType === 'excel') {
            const workbook = new ExcelJS.Workbook();
            const worksheet = workbook.addWorksheet('تقرير التسليم');

            worksheet.columns = [
                { header: 'اسم الطالب', key: 'studentName', width: 30 },
                { header: 'تاريخ التسليم', key: 'deliveryDate', width: 20 },
                { header: 'المرحلة', key: 'stage', width: 15 },
                { header: 'الصف', key: 'grade', width: 15 },
            ];

            // إضافة البيانات المفلترة فقط
            filteredDeliveries.forEach(d => {
                worksheet.addRow({
                    studentName: d.studentId.fullName,
                    deliveryDate: d.deliveryDate ? new Date(d.deliveryDate).toLocaleDateString('ar-SA') : 'غير محدد',
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
        // طباعة الخطأ الفعلي في سجلات الخادم للمساعدة في تصحيح الأخطاء المستقبلية
        console.error("Fatal Error in Report Export:", error);
        res.status(500).json({ message: 'فشل في إنشاء التقرير بسبب خطأ في الخادم.' });
    }
});

module.exports = router;