const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Inventory = require('../models/Inventory');
const Delivery = require('../models/Delivery');
const User = require('../models/User');

// @route   GET api/delivery/item/:barcode
// @desc    البحث عن قطعة بالباركود والتأكد من أنها متوفرة
// @access  Private
router.get('/item/:barcode', auth, async (req, res) => {
  try {
    // البحث عن قطعة لها الباركود المطلوب وحالتها "متوفرة في المخزن"
    const item = await Inventory.findOne({ barcode: req.params.barcode, status: 'in_stock' }).populate('uniform');
    
    // إذا لم يتم العثور على القطعة، يتم إرجاع خطأ
    if (!item) {
      return res.status(404).json({ msg: 'الباركود غير صالح أو القطعة تم تسليمها بالفعل' });
    }
    
    // إرجاع بيانات القطعة إذا تم العثور عليها
    res.json(item);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('خطأ في الخادم');
  }
});

// @route   POST api/delivery/record
// @desc    توثيق عملية تسليم جديدة
// @access  Private
router.post('/record', auth, async (req, res) => {
  const { barcode, studentName, stage, grade, section } = req.body;

  try {
    // 1. البحث عن القطعة والتأكد من أنها لا تزال في المخزن
    const item = await Inventory.findOne({ barcode, status: 'in_stock' });
    if (!item) {
      return res.status(404).json({ msg: 'الباركود غير صالح أو القطعة تم تسليمها بالفعل' });
    }

    // 2. إنشاء سجل تسليم جديد في قاعدة البيانات
    const newDelivery = new Delivery({
      inventoryItem: item._id,
      deliveredBy: req.user.id, // ID الموظف الذي قام بتسجيل الدخول (يأتي من التوكن)
      studentName,
      stage,
      grade,
      section,
    });
    await newDelivery.save();

    // 3. تحديث حالة القطعة في المخزون من "متوفرة" إلى "تم التسليم"
    item.status = 'delivered';
    await item.save();

    res.status(200).json({ msg: 'تم توثيق عملية التسليم بنجاح' });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('خطأ في الخادم');
  }
});

module.exports = router;
