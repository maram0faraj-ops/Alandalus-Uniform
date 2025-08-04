const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Uniform = require('../models/Uniform');
const Inventory = require('../models/Inventory');
const { v4: uuidv4 } = require('uuid');

// --- مسار إضافة قطع جديدة للمخزون ---
router.post('/add', auth, async (req, res) => {
  const { stage, type, size, paymentType, quantity } = req.body;

  if (!Number.isInteger(quantity) || quantity <= 0) {
    return res.status(400).json({ msg: 'الكمية يجب أن تكون رقماً صحيحاً موجباً' });
  }

  try {
    let uniform = await Uniform.findOne({ stage, type, size, paymentType });
    if (!uniform) {
      uniform = new Uniform({ stage, type, size, paymentType });
      await uniform.save();
    }

    // ======================================================
    // ## التعديل هنا: إنشاء رموز إنجليزية للباركود ##
    // ======================================================
    const stageCodes = {
      'رياض أطفال بنات': 'KGG',
      'رياض أطفال بنين': 'KGB',
      'طفولة مبكرة بنات': 'ECG',
      'طفولة مبكرة بنين': 'ECB',
      'ابتدائي': 'PRI',
      'متوسط': 'INT',
      'ثانوي': 'SEC'
    };

    const typeCodes = {
      'رسمي': 'O', // Official
      'رياضي': 'S', // Sport
      'جاكيت': 'J'  // Jacket
    };

    const stageCode = stageCodes[stage] || 'UNK'; // UNK for Unknown
    const typeCode = typeCodes[type] || 'X';

    // إنشاء قطع فردية في المخزون باستخدام الرموز الجديدة
    const newItems = [];
    for (let i = 0; i < quantity; i++) {
      const newItem = new Inventory({
        uniform: uniform._id,
        barcode: `AND-${stageCode}-${typeCode}${size}-${uuidv4().substring(0, 4)}`.toUpperCase()
      });
      newItems.push(newItem);
    }

    await Inventory.insertMany(newItems);
    res.status(201).json({ msg: `تم إضافة ${quantity} قطعة للمخزون بنجاح` });

  } catch (err) {
    console.error("Error in /add route:", err.message);
    res.status(500).send('خطأ في الخادم');
  }
});

// --- مسار جلب قطع المخزون لطباعة الباركود ---
router.get('/', auth, async (req, res) => {
  try {
    const items = await Inventory.find({ status: 'in_stock' })
      .populate('uniform')
      .sort({ entryDate: -1 });

    res.json(items);
  } catch (err) {
    console.error("Error fetching inventory:", err.message);
    res.status(500).send('خطأ في الخادم');
  }
});

module.exports = router;
