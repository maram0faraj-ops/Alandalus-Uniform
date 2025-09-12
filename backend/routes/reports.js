const express = require('express');
const router = express.Router();
const Delivery = require('../models/Delivery');
const Inventory = require('../models/Inventory');
const Uniform = require('../models/Uniform');
const ExcelJS = require('exceljs');

// Helper function to build date queries
const buildDateQuery = (from, to) => {
    const dateQuery = {};
    if (from) {
        const startDate = new Date(from);
        startDate.setUTCHours(0, 0, 0, 0);
        dateQuery.$gte = startDate;
    }
    if (to) {
        const endDate = new Date(to);
        endDate.setUTCHours(23, 59, 59, 999);
        dateQuery.$lte = endDate;
    }
    return Object.keys(dateQuery).length > 0 ? dateQuery : null;
};

// --- Delivery Report Route ---
router.post('/delivery-export', async (req, res) => {
    try {
        const { stage, grade, section, paymentType, deliveryDateFrom, deliveryDateTo } = req.body;
        
        const initialMatch = {};
        const dateQuery = buildDateQuery(deliveryDateFrom, deliveryDateTo);
        if (dateQuery) initialMatch.deliveryDate = dateQuery;

        // --- تم تعديل منطق الفلترة هنا ليصبح مرنًا ---
        if (grade) initialMatch.grade = { $regex: grade.trim(), $options: 'i' };
        if (section) initialMatch.section = { $regex: section.trim(), $options: 'i' };
        if (paymentType) initialMatch.paymentType = paymentType;

        let deliveries = await Delivery.aggregate([
            { $match: initialMatch },
            { $lookup: { from: 'inventories', localField: 'inventoryItem', foreignField: '_id', as: 'inventoryItem' }},
            { $unwind: '$inventoryItem' },
            { $lookup: { from: 'uniforms', localField: 'inventoryItem.uniform', foreignField: '_id', as: 'uniformDetails' }},
            { $unwind: '$uniformDetails' },
            { $lookup: { from: 'users', localField: 'deliveredBy', foreignField: '_id', as: 'deliveredBy' }},
            { $unwind: '$deliveredBy' },
            // --- وتم تعديل الفلترة للمرحلة هنا أيضًا ---
            ...(stage ? [{ $match: { 'uniformDetails.stage': { $regex: stage.trim(), $options: 'i' } } }] : []),
        ]);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Delivery Report');
        worksheet.columns = [
            { header: 'اسم الطالب', key: 'studentName', width: 25 },
            { header: 'المرحلة', key: 'stage', width: 20 },
            { header: 'الصف', key: 'grade', width: 10 },
            { header: 'الشعبة', key: 'section', width: 10 },
            { header: 'نوع الزي', key: 'uniformType', width: 15 },
            { header: 'المقاس', key: 'uniformSize', width: 10 },
            { header: 'الباركود', key: 'barcode', width: 30 },
            { header: 'نوع الدفع', key: 'paymentType', width: 15 },
            { header: 'تم التسليم بواسطة', key: 'deliveredBy', width: 20 },
            { header: 'تاريخ التسليم', key: 'deliveryDate', width: 22, style: { numFmt: 'yyyy-mm-dd hh:mm:ss' } },
        ];
        deliveries.forEach(d => {
            worksheet.addRow({
                studentName: d.studentName,
                stage: d.uniformDetails.stage,
                grade: d.grade,
                section: d.section,
                uniformType: d.uniformDetails.type,
                uniformSize: d.uniformDetails.size,
                barcode: d.inventoryItem.barcode,
                paymentType: d.paymentType,
                deliveredBy: d.deliveredBy.name,
                deliveryDate: d.deliveryDate,
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="delivery_report.xlsx"');
        await workbook.xlsx.write(res);
        res.end();
    } catch (error) {
        console.error("Delivery Report Export Error:", error);
        res.status(500).json({ message: 'فشل في إنشاء تقرير التسليم.' });
    }
});

// --- Inventory Report Routes (لا تغيير هنا) ---
const buildInventoryQuery = async (filters) => { /* ...الكود الحالي... */ };
router.post('/inventory-summary', async (req, res) => { /* ...الكود الحالي... */ });
router.post('/inventory-details', async (req, res) => { /* ...الكود الحالي... */ });
router.post('/inventory-export', async (req, res) => { /* ...الكود الحالي... */ });
 
module.exports = router;