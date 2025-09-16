const express = require('express');
const router = express.Router();
const Delivery = require('../models/Delivery');
const Inventory = require('../models/Inventory');
const Uniform = require('../models/Uniform'); // تأكد من استيراد هذا النموذج
const ExcelJS = require('exceljs');
const mongoose = require('mongoose'); // مهم لإجراء عمليات التحقق

// Helper function to build date queries
const buildDateQuery = (from, to, fieldName) => {
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
    // Return null if no dates are provided to avoid an empty object in the query
    return Object.keys(dateQuery).length > 0 ? { [fieldName]: dateQuery } : null;
};


// --- Delivery Report Route (لا تغيير هنا) ---
router.post('/delivery-export', async (req, res) => {
    try {
        const { stage, grade, section, paymentType, deliveryDateFrom, deliveryDateTo } = req.body;
        
        const initialMatch = {};
        const dateQuery = buildDateQuery(deliveryDateFrom, deliveryDateTo, 'deliveryDate');
        if (dateQuery) initialMatch.deliveryDate = dateQuery.deliveryDate;

        if (grade) initialMatch.grade = { $regex: grade.trim(), $options: 'i' };
        if (section) initialMatch.section = { $regex: section.trim(), $options: 'i' };
        if (paymentType) initialMatch.paymentType = paymentType;

        let pipeline = [
            { $match: initialMatch },
            { $lookup: { from: 'inventories', localField: 'inventoryItem', foreignField: '_id', as: 'inventoryItem' }},
            { $unwind: '$inventoryItem' },
            { $lookup: { from: 'uniforms', localField: 'inventoryItem.uniform', foreignField: '_id', as: 'uniformDetails' }},
            { $unwind: '$uniformDetails' },
            { $lookup: { from: 'users', localField: 'deliveredBy', foreignField: '_id', as: 'deliveredBy' }},
            { $unwind: '$deliveredBy' },
        ];
        
        if (stage) {
            pipeline.push({ $match: { 'uniformDetails.stage': { $regex: stage.trim(), $options: 'i' } } });
        }

        const deliveries = await Delivery.aggregate(pipeline);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Delivery Report');
        worksheet.columns = [
            { header: 'اسم الطالب', key: 'studentName', width: 25 }, { header: 'المرحلة', key: 'stage', width: 20 },
            { header: 'الصف', key: 'grade', width: 10 }, { header: 'الشعبة', key: 'section', width: 10 },
            { header: 'نوع الزي', key: 'uniformType', width: 15 }, { header: 'المقاس', key: 'uniformSize', width: 10 },
            { header: 'الباركود', key: 'barcode', width: 30 }, { header: 'نوع الدفع', key: 'paymentType', width: 15 },
            { header: 'تم التسليم بواسطة', key: 'deliveredBy', width: 20 },
            { header: 'تاريخ التسليم', key: 'deliveryDate', width: 22, style: { numFmt: 'yyyy-mm-dd hh:mm:ss' } },
        ];
        deliveries.forEach(d => {
            worksheet.addRow({
                studentName: d.studentName, stage: d.uniformDetails.stage, grade: d.grade, section: d.section,
                uniformType: d.uniformDetails.type, uniformSize: d.uniformDetails.size, barcode: d.inventoryItem.barcode,
                paymentType: d.paymentType, deliveredBy: d.deliveredBy.name, deliveryDate: d.deliveryDate,
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


// --- Inventory Report Routes (تمت إضافة المنطق المفقود هنا) ---

/**
 * @desc    Builds a dynamic aggregation pipeline for inventory filtering.
 * @param   {object} filters - The filter criteria from req.body.
 * @returns {Array} - An array representing the MongoDB aggregation pipeline.
 */
const buildInventoryQuery = (filters) => {
    const { stage, type, size, entryDateFrom, entryDateTo } = filters;
    const pipeline = [];

    // 1. Initial match for entryDate on the Inventory collection
    const dateQuery = buildDateQuery(entryDateFrom, entryDateTo, 'entryDate');
    if (dateQuery) {
        pipeline.push({ $match: dateQuery });
    }

    // 2. Lookup to join with the Uniform collection
    pipeline.push(
        { $lookup: { from: 'uniforms', localField: 'uniform', foreignField: '_id', as: 'uniform' } },
        { $unwind: '$uniform' }
    );

    // 3. Secondary match for uniform properties (stage, type, size)
    const uniformMatch = {};
    if (stage) uniformMatch['uniform.stage'] = stage;
    if (type) uniformMatch['uniform.type'] = type;
    if (size) uniformMatch['uniform.size'] = Number(size); // Convert size to number for accurate matching

    if (Object.keys(uniformMatch).length > 0) {
        pipeline.push({ $match: uniformMatch });
    }

    return pipeline;
};

// Route to get a summarized inventory report
router.post('/inventory-summary', async (req, res) => {
    try {
        const pipeline = buildInventoryQuery(req.body);
        
        // Add grouping stage to the pipeline for summary
        pipeline.push({
            $group: {
                _id: {
                    stage: '$uniform.stage',
                    type: '$uniform.type',
                    size: '$uniform.size'
                },
                quantity: { $sum: 1 }
            }
        }, {
            $sort: {
                '_id.stage': 1,
                '_id.type': 1,
                '_id.size': 1
            }
        });
        
        const summary = await Inventory.aggregate(pipeline);
        res.json(summary);
    } catch (error) {
        console.error("Inventory Summary Error:", error);
        res.status(500).json({ message: 'فشل في جلب ملخص المخزون.' });
    }
});

// Route to get a detailed inventory report
router.post('/inventory-details', async (req, res) => {
    try {
        const pipeline = buildInventoryQuery(req.body);
        pipeline.push({ $sort: { entryDate: -1 } }); // Sort details by entry date
        const details = await Inventory.aggregate(pipeline);
        res.json(details);
    } catch (error) {
        console.error("Inventory Details Error:", error);
        res.status(500).json({ message: 'فشل في جلب تفاصيل المخزون.' });
    }
});

// Route to export inventory details to Excel
router.post('/inventory-export', async (req, res) => {
    try {
        const pipeline = buildInventoryQuery(req.body);
        pipeline.push({ $sort: { entryDate: -1 } });
        const items = await Inventory.aggregate(pipeline);

        const workbook = new ExcelJS.Workbook();
        const worksheet = workbook.addWorksheet('Inventory Details Report');
        worksheet.columns = [
            { header: 'المرحلة', key: 'stage', width: 25 },
            { header: 'نوع الزي', key: 'type', width: 20 },
            { header: 'المقاس', key: 'size', width: 10 },
            { header: 'الباركود', key: 'barcode', width: 35 },
            { header: 'تاريخ الإدخال', key: 'entryDate', width: 22, style: { numFmt: 'yyyy-mm-dd hh:mm:ss' } },
        ];
        items.forEach(item => {
            worksheet.addRow({
                stage: item.uniform.stage,
                type: item.uniform.type,
                size: item.uniform.size,
                barcode: item.barcode,
                entryDate: item.entryDate,
            });
        });

        res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
        res.setHeader('Content-Disposition', 'attachment; filename="inventory_details_report.xlsx"');
        await workbook.xlsx.write(res);
        res.end();

    } catch (error) {
        console.error("Inventory Export Error:", error);
        res.status(500).json({ message: 'فشل في إنشاء تقرير المخزون.' });
    }
});
 
module.exports = router;