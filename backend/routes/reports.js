const express = require('express');
const router = express.Router();
const Delivery = require('../models/Delivery');
const Inventory = require('../models/Inventory'); // <-- إضافة نموذج المخزون
const ExcelJS = require('exceljs');

// --- مسار تقرير التسليم (يبقى كما هو) ---
router.post('/export', async (req, res) => {
    // ... الكود الحالي لتقرير التسليم ...
});


// --- المسارات الجديدة لتقارير المخزون ---

// 1. مسار لجلب التقرير الملخص (مع الكميات)
router.post('/inventory-summary', async (req, res) => {
    try {
        const { stage, type, size } = req.body;
        const matchConditions = { status: 'in_stock' };

        // بناء شروط البحث بناءً على الفلاتر
        if (stage) matchConditions['uniformDetails.stage'] = stage;
        if (type) matchConditions['uniformDetails.type'] = type;
        if (size) matchConditions['uniformDetails.size'] = Number(size);

        const summary = await Inventory.aggregate([
            {
                $lookup: {
                    from: 'uniforms', // اسم المجموعة (collection) للزي
                    localField: 'uniform',
                    foreignField: '_id',
                    as: 'uniformDetails'
                }
            },
            { $unwind: '$uniformDetails' },
            { $match: matchConditions },
            {
                $group: {
                    _id: {
                        stage: '$uniformDetails.stage',
                        type: '$uniformDetails.type',
                        size: '$uniformDetails.size'
                    },
                    quantity: { $sum: 1 }
                }
            },
            { $sort: { '_id.stage': 1, '_id.type': 1, '_id.size': 1 } }
        ]);

        res.json(summary);

    } catch (error) {
        console.error("Inventory Summary Error:", error);
        res.status(500).json({ message: 'فشل في إنشاء التقرير الملخص.' });
    }
});

// 2. مسار لجلب التقرير المفصل (مع الباركود)
router.post('/inventory-details', async (req, res) => {
    try {
        const { stage, type, size } = req.body;
        const query = { status: 'in_stock' };

        // لجلب تفاصيل الزي المرتبطة، سنحتاج إلى الاستعلام بشكل مختلف
        let items = await Inventory.find(query).populate('uniform');

        // تطبيق الفلاتر بعد جلب البيانات
        if (stage) {
            items = items.filter(item => item.uniform?.stage === stage);
        }
        if (type) {
            items = items.filter(item => item.uniform?.type === type);
        }
        if (size) {
            items = items.filter(item => item.uniform?.size === Number(size));
        }

        res.json(items);

    } catch (error) {
        console.error("Inventory Details Error:", error);
        res.status(500).json({ message: 'فشل في إنشاء التقرير المفصل.' });
    }
});


module.exports = router;