const express = require('express');
const auth = require('../middleware/auth');
const inventoryRouter = express.Router();
const Inventory = require('../models/Inventory');
const Uniform = require('../models/Uniform');

// 1. جلب المخزون مع فلترة اختيارية (الحالة، التاريخ)
inventoryRouter.get('/', auth, async (req, res) => {
    try {
        const { status, startDate, endDate } = req.query;
        let query = {};
        
        if (status) query.status = status;
        
        // فلترة التاريخ في قاعدة البيانات
        if (startDate || endDate) {
            query.entryDate = {};
            if (startDate) query.entryDate.$gte = new Date(startDate);
            if (endDate) {
                const end = new Date(endDate);
                end.setHours(23, 59, 59, 999);
                query.entryDate.$lte = end;
            }
        }

        const items = await Inventory.find(query)
            .populate('uniform')
            .sort({ entryDate: -1 });
        res.json(items);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// 2. تنبيه انخفاض المخزون (أقل من 20 قطعة لكل صنف)
inventoryRouter.get('/low-stock-alerts', auth, async (req, res) => {
    try {
        // تجميع البيانات لحساب الكمية لكل نوع زي
        const alerts = await Inventory.aggregate([
            { $match: { status: 'in_stock' } },
            { $group: { _id: "$uniform", count: { $sum: 1 } } },
            { $match: { count: { $lt: 20 } } }, // التنبيه عند أقل من 20
            { $lookup: { from: 'uniforms', localField: '_id', foreignField: '_id', as: 'details' } },
            { $unwind: '$details' }
        ]);
        res.json(alerts);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// 3. الحذف المتعدد (Bulk Delete)
inventoryRouter.post('/bulk-delete', auth, async (req, res) => {
    const { ids } = req.body;
    try {
        await Inventory.deleteMany({ _id: { $in: ids } });
        res.json({ msg: `تم حذف ${ids.length} قطعة بنجاح` });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = inventoryRouter;