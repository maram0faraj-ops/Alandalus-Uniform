const express = require('express');
const auth = require('../middleware/auth');
const inventoryRouter = express.Router();
const Inventory = require('../models/Inventory');

// جلب المخزون مع ربط البيانات
inventoryRouter.get('/', auth, async (req, res) => {
    try {
        const query = {};
        if (req.query.status) {
            query.status = req.query.status; 
        }
        const items = await Inventory.find(query)
            .populate('uniform') // ضروري جداً لجلب بيانات المرحلة والمقاس
            .sort({ entryDate: -1 });
        res.json(items);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// مسار حذف كامل المخزون
inventoryRouter.delete('/clear-all', auth, async (req, res) => {
    try {
        const result = await Inventory.deleteMany({ status: 'in_stock' });
        res.json({ msg: `تم تصفير المخزون بنجاح`, count: result.deleted_count });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = inventoryRouter;