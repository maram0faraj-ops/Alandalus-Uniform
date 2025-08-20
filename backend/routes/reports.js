const express = require('express');
const router = express.Router();
const Delivery = require('../models/Delivery');
const Inventory = require('../models/Inventory');
const ExcelJS = require('exceljs');

// --- مسار تقرير التسليم ---
router.post('/export', async (req, res) => {
    try {
        const { stage, grade, section, deliveryDateFrom, deliveryDateTo } = req.body;
        const query = {};

        // --- تم تعديل منطق الفلترة هنا ---
        if (stage) {
            query.stage = { $regex: stage.trim(), $options: 'i' };
        }
        if (grade) {
            query.grade = { $regex: grade.trim(), $options: 'i' };
        }
        if (section) {
            query.section = { $regex: section.trim(), $options: 'i' };
        }
        // --- نهاية التعديل ---

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

        const deliveries = await Delivery.find(query)
            .populate({
                path: 'inventoryItem',
                populate: { path: 'uniform' }
            })
            .populate('deliveredBy', 'name');

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
            { 
              header: 'تاريخ التسليم', 
              key: 'deliveryDate', 
              width: 22, 
              style: { numFmt: 'yyyy-mm-dd hh:mm:ss' } 
            },
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
                deliveryDate: new Date(d.deliveryDate),
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


// --- مسارات تقارير المخزون ---
router.post('/inventory-summary', async (req, res) => {
    try {
        const { stage, type, size, entryDateFrom, entryDateTo } = req.body;
        const matchConditions = { status: 'in_stock' };
        const uniformMatch = {};

        if (stage) uniformMatch['uniformDetails.stage'] = stage;
        if (type) uniformMatch['uniformDetails.type'] = type;
        if (size) uniformMatch['uniformDetails.size'] = Number(size);
        
        if (entryDateFrom || entryDateTo) {
            matchConditions.entryDate = {};
            if (entryDateFrom) {
                const startDate = new Date(entryDateFrom);
                startDate.setUTCHours(0, 0, 0, 0);
                matchConditions.entryDate.$gte = startDate;
            }
            if (entryDateTo) {
                const endDate = new Date(entryDateTo);
                endDate.setUTCHours(23, 59, 59, 999);
                matchConditions.entryDate.$lte = endDate;
            }
        }

        const summary = await Inventory.aggregate([
            { $match: matchConditions },
            { $lookup: { from: 'uniforms', localField: 'uniform', foreignField: '_id', as: 'uniformDetails' }},
            { $unwind: '$uniformDetails' },
            { $match: uniformMatch },
            { $group: { _id: { stage: '$uniformDetails.stage', type: '$uniformDetails.type', size: '$uniformDetails.size' }, quantity: { $sum: 1 }}},
            { $sort: { '_id.stage': 1, '_id.type': 1, '_id.size': 1 } }
        ]);

        res.json(summary);
    } catch (error) {
        console.error("Inventory Summary Error:", error);
        res.status(500).json({ message: 'فشل في إنشاء التقرير الملخص.' });
    }
});

router.post('/inventory-details', async (req, res) => {
    try {
        const { stage, type, size, entryDateFrom, entryDateTo } = req.body;
        const query = { status: 'in_stock' };

        if (entryDateFrom || entryDateTo) {
            query.entryDate = {};
            if (entryDateFrom) {
                const startDate = new Date(entryDateFrom);
                startDate.setUTCHours(0, 0, 0, 0);
                query.entryDate.$gte = startDate;
            }
            if (entryDateTo) {
                const endDate = new Date(entryDateTo);
                endDate.setUTCHours(23, 59, 59, 999);
                query.entryDate.$lte = endDate;
            }
        }
        
        let items = await Inventory.find(query).populate('uniform');

        if (stage) items = items.filter(item => item.uniform?.stage === stage);
        if (type) items = items.filter(item => item.uniform?.type === type);
        if (size) items = items.filter(item => item.uniform?.size === Number(size));

        res.json(items);
    } catch (error) {
        console.error("Inventory Details Error:", error);
        res.status(500).json({ message: 'فشل في إنشاء التقرير المفصل.' });
    }
});
 
module.exports = router;