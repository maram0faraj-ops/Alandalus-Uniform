const express = require('express');
const router = express.Router();
const Delivery = require('../models/Delivery');
const Inventory = require('../models/Inventory');
const ExcelJS = require('exceljs');

// --- مسار تقرير التسليم (تم التعديل) ---
router.post('/export', async (req, res) => {
    try {
        const { stage, grade, section, deliveryDateFrom, deliveryDateTo } = req.body;
        const query = {};

        if (stage) query.stage = stage;
        if (grade) query.grade = grade;
        if (section) query.section = section;

        // --- منطق جديد للبحث ضمن فترة زمنية ---
        if (deliveryDateFrom || deliveryDateTo) {
            query.deliveryDate = {};
            if (deliveryDateFrom) {
                const startDate = new Date(deliveryDateFrom);
                startDate.setUTCHours(0, 0, 0, 0);
                query.deliveryDate.$gte = startDate;
            }
            if (deliveryDateTo) {
                const endDate = new Date(deliveryDateTo);
                endDate.setUTCHours(23, 59, 59, 999);
                query.deliveryDate.$lte = endDate;
            }
        }
        // --- نهاية المنطق الجديد ---

        const deliveries = await Delivery.find(query)
            .populate({
                path: 'inventoryItem',
                populate: { path: 'uniform' }
            })
            .populate('deliveredBy', 'name');

        // ... باقي كود إنشاء ملف الإكسل (لا تغيير هنا) ...
        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Delivery Report');

        worksheet.columns = [
            { header: 'اسم الطالب', key: 'studentName', width: 25 },
            { header: 'المرحلة', key: 'stage', width: 15 },
            { header: 'الصف', key: 'grade', width: 10 },
            { header: 'الشعبة', key: 'section', width: 10 },
            { header: 'نوع الزي', key: 'uniformType', width: 15 },
            { header: 'المقاس', key: 'uniformSize', width: 10 },
            { header: 'الباركود', key: 'barcode', width: 30 },
            { header: 'تم التسليم بواسطة', key: 'deliveredBy', width: 20 },
            { header: 'تاريخ التسليم', key: 'deliveryDate', width: 20 },
        ];

        deliveries.forEach(d => {
            worksheet.addRow({
                studentName: d.studentName,
                stage: d.stage,
                grade: d.grade,
                section: d.section,
                uniformType: d.inventoryItem?.uniform?.type,
                uniformSize: d.inventoryItem?.uniform?.size,
                barcode: d.inventoryItem?.barcode,
                deliveredBy: d.deliveredBy?.name,
                deliveryDate: new Date(d.deliveryDate).toLocaleString('ar-SA'),
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="delivery_report.xlsx"');
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error("Report Export Error:", error);
        res.status(500).json({ message: 'فشل في إنشاء التقرير.' });
    }
});


// --- مسارات تقارير المخزون (لا تغيير هنا) ---
router.post('/inventory-summary', async (req, res) => {
    // ... الكود الحالي ...
});

router.post('/inventory-details', async (req, res) => {
    // ... الكود الحالي ...
});
 
module.exports = router;