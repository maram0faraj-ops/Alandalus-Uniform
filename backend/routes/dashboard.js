const express = require('express');
const router = express.Router();

// تأكد من صحة مسارات النماذج
const Inventory = require('../models/Inventory');
const Delivery = require('../models/Delivery');
const User = require('../models/User');
const Uniform = require('../models/Uniform'); // قد نحتاجه لجلب تفاصيل الزي

// --- واجهة برمجة التطبيقات الرئيسية للإحصائيات ---
router.get('/stats', async (req, res) => {
  try {
    const totalStock = await Inventory.countDocuments({ status: 'in_stock' });
    const deliveredStock = await Delivery.countDocuments();
    const totalParents = await User.countDocuments({ role: 'parent' });
    res.json({ totalStock, deliveredStock, totalParents });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// --- واجهة برمجة التطبيقات لتنبيهات المخزون المنخفض ---
router.get('/low-stock-alerts', async (req, res) => {
    try {
        const alerts = await Inventory.aggregate([
            { $match: { status: 'in_stock' } },
            { $group: { _id: "$uniform", quantity: { $sum: 1 } } },
            { $match: { quantity: { $lte: 50 } } },
            { $lookup: { from: 'uniforms', localField: '_id', foreignField: '_id', as: 'uniformDetails' } },
            { $unwind: "$uniformDetails" },
            { $sort: { quantity: 1 } }
        ]);
        res.json(alerts);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});


// --- واجهة برمجة التطبيقات لمخطط حالة الدفع (النسخة المصححة) ---
router.get('/stage-payment-stats', async (req, res) => {
  try {
    const stats = await Delivery.aggregate([
      {
        $group: {
          // تأكد من أن الحقول "stage" و "paymentStatus" موجودة في نموذج Delivery
          _id: {
            stage: "$stage",
            paymentStatus: "$paymentStatus"
          },
          count: { $sum: 1 }
        }
      }
    ]);
    res.json(stats);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// --- واجهة برمجة التطبيقات لمخطط حالة المخزون ---
router.get('/delivery-status-stats', async (req, res) => {
  try {
    const stats = await Inventory.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } }
    ]);
    res.json(stats);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;
