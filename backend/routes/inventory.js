const { v4: uuidv4 } = require('uuid');
const express = require('express');
const auth = require('../middleware/auth');
const inventoryRouter = express.Router();

const Uniform = require('../models/Uniform');
const Inventory = require('../models/Inventory');

// --- POST /api/inventory/add ---
inventoryRouter.post('/add', auth, async (req, res) => {
    const { stage, type, size, quantity } = req.body;
    if (!Number.isInteger(quantity) || quantity <= 0) {
        return res.status(400).json({ msg: 'الكمية يجب أن تكون رقماً صحيحاً موجباً' });
    }
    try {
        let uniform = await Uniform.findOne({ stage, type, size });
        if (!uniform) {
            uniform = new Uniform({ stage, type, size });
            await uniform.save();
        }
        const stageCodes = {'رياض أطفال بنات': 'KGG', 'رياض أطفال بنين': 'KGB', ' ابتدائي بنات': 'PGB', ' ابتدائي بنين': 'PBB', 'متوسط': 'INT', 'ثانوي': 'SEC'};
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
        res.status(500).send('Server Error');
    }
});

// --- GET /api/inventory/ (هذا هو الكود الذي كان مفقودًا) ---
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

// --- DELETE /api/inventory/:id ---
 inventoryRouter.delete('/:id', auth, async (req, res) => {
    try {
        const item = await Inventory.findById(req.params.id);
         if (!item) {
            return res.status(404).json({ msg: 'Item not found' });
        }
        await item.deleteOne();
         res.json({ msg: 'Item removed successfully' });
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
 });

module.exports = inventoryRouter;