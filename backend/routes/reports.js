const express = require('express');
const router = express.Router();
const Delivery = require('../models/Delivery');
const Inventory = require('../models/Inventory');
const ExcelJS = require('exceljs');

// --- مسار تقرير التسليم (لا تغيير هنا) ---
router.post('/export', async (req, res) => {
    // ... الكود الحالي لتقرير التسليم ...
});


// --- مسارات تقارير المخزون (تم التعديل) ---

// 1. مسار التقرير الملخص
router.post('/inventory-summary', async (req, res) => {
    try {
        const { stage, type, size, entryDateFrom, entryDateTo } = req.body; // <-- تم التعديل هنا
        const matchConditions = { status: 'in_stock' };
        const uniformMatch = {};

        if (stage) uniformMatch['uniformDetails.stage'] = stage;
        if (type) uniformMatch['uniformDetails.type'] = type;
        if (size) uniformMatch['uniformDetails.size'] = Number(size);
        
        // --- منطق جديد للبحث ضمن فترة زمنية ---
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
        // --- نهاية المنطق الجديد ---

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

// 2. مسار التقرير المفصل
router.post('/inventory-details', async (req, res) => {
    try {
        const { stage, type, size, entryDateFrom, entryDateTo } = req.body; // <-- تم التعديل هنا
        const query = { status: 'in_stock' };

        // --- منطق جديد للبحث ضمن فترة زمنية ---
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
        // --- نهاية المنطق الجديد ---
        
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