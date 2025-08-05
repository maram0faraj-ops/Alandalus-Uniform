// --- /backend/routes/inventory.js ---

const { v4: uuidv4 } = require('uuid');
const express = require('express');
const auth = require('../middleware/auth');
const inventoryRouter = express.Router();

// Assuming Uniform and Inventory models are imported somewhere before or in the file that uses this router.
// For clarity in this file, let's define them conceptually.
const Uniform = require('../models/Uniform');
const Inventory = require('../models/Inventory');


/**
 * @route   POST /api/inventory/add
 * @desc    Add new items to inventory and generate barcodes
 * @access  Private
 */
inventoryRouter.post('/add', auth, async (req, res) => {
    const { stage, type, size, paymentType, quantity } = req.body;

    // Validate quantity
    if (!Number.isInteger(quantity) || quantity <= 0) {
        return res.status(400).json({ msg: 'الكمية يجب أن تكون رقماً صحيحاً موجباً' });
    }

    try {
        // Find if the uniform type already exists, if not, create it
        let uniform = await Uniform.findOne({ stage, type, size, paymentType });
        if (!uniform) {
            uniform = new Uniform({ stage, type, size, paymentType });
            await uniform.save();
        }

        // Define codes for barcode generation
        const stageCodes = {'رياض أطفال بنات': 'KGG', 'رياض أطفال بنين': 'KGB', 'طفولة مبكرة بنات': 'ECG', 'طفولة مبكرة بنين': 'ECB', 'ابتدائي': 'PRI', 'متوسط': 'INT', 'ثانوي': 'SEC'};
        const typeCodes = {'رسمي': 'O', 'رياضي': 'S', 'جاكيت': 'J'};

        const stageCode = stageCodes[stage] || 'UNK';
        const typeCode = typeCodes[type] || 'X';
        
        const newItems = [];
        for (let i = 0; i < quantity; i++) {
            // Generate a unique barcode for each item
            const barcode = `AND-${stageCode}-${typeCode}${size}-${uuidv4().substring(0, 4)}`.toUpperCase();
            newItems.push(new Inventory({
                uniform: uniform._id,
                barcode: barcode
            }));
        }

        // Insert all new items into the database at once
        await Inventory.insertMany(newItems);

        res.status(201).json({ msg: `تم إضافة ${quantity} قطعة للمخزون بنجاح` });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   GET /api/inventory/
 * @desc    Get all items currently in stock
 * @access  Private
 */
inventoryRouter.get('/', auth, async (req, res) => {
    try {
        const items = await Inventory.find({ status: 'in_stock' })
            .populate('uniform') // Fetches details of the associated uniform
            .sort({ entryDate: -1 }); // Sort by newest first
        res.json(items);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = inventoryRouter;