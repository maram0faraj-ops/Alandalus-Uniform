const { v4: uuidv4 } = require('uuid');
const express = require('express');
const auth = require('../middleware/auth');
const inventoryRouter = express.Router();
const Uniform = require('../models/Uniform');
const Inventory = require('../models/Inventory');

// إضافة مخزون جديد
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
        res.status(500).send('Server Error');
    }
});

// مسار حذف كامل المخزون المتوفر
inventoryRouter.delete('/clear-all', auth, async (req, res) => {
    try {
        const result = await Inventory.deleteMany({ status: 'in_stock' });
        res.json({ msg: `تم تصفير المخزون بنجاح. تم حذف ${result.deleted_count} عنصر.` });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

// مسارات الحذف الفردي والجلب تبقى كما هي...
module.exports = inventoryRouter;