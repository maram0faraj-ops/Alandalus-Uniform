const { v4: uuidv4 } = require('uuid');
const express = require('express');
const auth = require('../middleware/auth');
const inventoryRouter = express.Router();
const Uniform = require('../models/Uniform');
const Inventory = require('../models/Inventory');

// @route   GET /api/inventory
// @desc    جلب كافة قطع المخزون مع بيانات الزي المدرسي
inventoryRouter.get('/', auth, async (req, res) => {
    try {
        const query = {};
        if (req.query.status) {
            query.status = req.query.status; 
        }
        const items = await Inventory.find(query)
            .populate('uniform')
            .sort({ entryDate: -1 });
        res.json(items);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   POST /api/inventory/add
// @desc    إضافة مخزون جديد (يدعم المقاسات حتى 100)
inventoryRouter.post('/add', auth, async (req, res) => {
    let { stage, type, size, quantity } = req.body;
    if (stage) stage = stage.trim();
    if (type) type = type.trim();

    try {
        let uniform = await Uniform.findOne({ stage, type, size });
        if (!uniform) {
            uniform = new Uniform({ stage, type, size });
            await uniform.save();
        }
        
        const stageCodes = { 
            'رياض أطفال بنات': 'KGG', 'رياض أطفال بنين': 'KGB', 
            'ابتدائي بنات': 'PGB', 'ابتدائي بنين': 'PBB', 
            'متوسط': 'INT', 'ثانوي': 'SEC' 
        };
        const typeCodes = {'رسمي': 'O', 'رياضي': 'S', 'جاكيت': 'J'};
        
        const stageCode = stageCodes[stage] || 'UNK';
        const typeCode = typeCodes[type] || 'X';
        const newItems = [];
        
        for (let i = 0; i < quantity; i++) {
            const barcode = `AND-${stageCode}-${typeCode}${size}-${uuidv4().substring(0, 4)}`.toUpperCase();
            newItems.push(new Inventory({ uniform: uniform._id, barcode: barcode }));
        }
        
        await Inventory.insertMany(newItems);
        res.status(201).json({ msg: `تم إضافة ${quantity} قطعة للمخزون بنجاح` });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Server Error' });
    }
});

// @route   DELETE /api/inventory/bulk-delete
// @desc    حذف مجموعة عناصر بطلب واحد (الحل النهائي لفشل حذف المحدد)
inventoryRouter.delete('/bulk-delete', auth, async (req, res) => {
    try {
        const { ids } = req.body; 
        if (!ids || !Array.isArray(ids) || ids.length === 0) {
            return res.status(400).json({ msg: 'يرجى تحديد العناصر المطلوب حذفها.' });
        }

        const result = await Inventory.deleteMany({ _id: { $in: ids } });
        res.json({ msg: `تم حذف ${result.deletedCount} عنصر بنجاح.` });
    } catch (err) {
        console.error("Bulk Delete Error:", err);
        res.status(500).json({ msg: 'حدث خطأ في السيرفر أثناء الحذف الجماعي.' });
    }
});

// @route   DELETE /api/inventory/clear-all
// @desc    حذف كامل المخزون المتوفر
inventoryRouter.delete('/clear-all', auth, async (req, res) => {
    try {
        const result = await Inventory.deleteMany({ status: 'in_stock' });
        res.json({ msg: `تم تصفير المخزون بنجاح. تم حذف ${result.deletedCount} عنصر.` });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   DELETE /api/inventory/:id
// @desc    حذف قطعة واحدة من المخزون
inventoryRouter.delete('/:id', auth, async (req, res) => {
    try {
        const item = await Inventory.findById(req.params.id);
        if (!item) return res.status(404).json({ msg: 'العنصر غير موجود' });

        await item.deleteOne();
        res.json({ msg: 'تم حذف العنصر بنجاح' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = inventoryRouter;