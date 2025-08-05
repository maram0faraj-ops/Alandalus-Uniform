// --- routes/inventory.js ---
const { v4: uuidv4 } = require('uuid');
const express = require('express');
const inventoryRouter = express.Router();
inventoryRouter.post('/add', auth, async (req, res) => {
    // ... (The barcode generation logic with English codes is correct and verified)
    const { stage, type, size, paymentType, quantity } = req.body;
    if (!Number.isInteger(quantity) || quantity <= 0) { return res.status(400).json({ msg: 'الكمية يجب أن تكون رقماً صحيحاً موجباً' });}
    try {
        let uniform = await Uniform.findOne({ stage, type, size, paymentType });
        if (!uniform) { uniform = new Uniform({ stage, type, size, paymentType }); await uniform.save(); }
        const stageCodes = {'رياض أطفال بنات': 'KGG', 'رياض أطفال بنين': 'KGB', 'طفولة مبكرة بنات': 'ECG', 'طفولة مبكرة بنين': 'ECB', 'ابتدائي': 'PRI', 'متوسط': 'INT', 'ثانوي': 'SEC'};
        const typeCodes = {'رسمي': 'O', 'رياضي': 'S', 'جاكيت': 'J'};
        const stageCode = stageCodes[stage] || 'UNK';
        const typeCode = typeCodes[type] || 'X';
        const newItems = [];
        for (let i = 0; i < quantity; i++) {
            newItems.push(new Inventory({ uniform: uniform._id, barcode: `AND-${stageCode}-${typeCode}${size}-${uuidv4().substring(0, 4)}`.toUpperCase() }));
        }
        await Inventory.insertMany(newItems);
        res.status(201).json({ msg: `تم إضافة ${quantity} قطعة للمخزون بنجاح` });
    } catch (err) { res.status(500).send('Server Error'); }
});
inventoryRouter.get('/', auth, async (req, res) => {
    try {
        const items = await Inventory.find({ status: 'in_stock' }).populate('uniform').sort({ entryDate: -1 });
        res.json(items);
    } catch (err) { res.status(500).send('Server Error'); }
});
module.exports = inventoryRouter;
