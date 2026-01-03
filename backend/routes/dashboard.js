const express = require('express');
const router = express.Router();

const Inventory = require('../models/Inventory');
const Delivery = require('../models/Delivery');
const User = require('../models/User');

// --- إحصائيات عامة ---
router.get('/stats', async (req, res) => {
  try {
    const totalStock = await Inventory.countDocuments({ status: 'in_stock' });
    const deliveredStock = await Delivery.countDocuments();
    const totalParents = await User.countDocuments({ role: 'parent' });
    res.json({ totalStock, deliveredStock, totalParents });
  } catch (err) {
    console.error("Error in /stats:", err.message);
    res.status(500).send('Server Error');
  }
});

// --- تنبيهات المخزون ---
router.get('/low-stock-alerts', async (req, res) => {
    try {
        const alerts = await Inventory.aggregate([
            { $match: { status: 'in_stock' } },
            { $group: { _id: "$uniform", quantity: { $sum: 1 } } },
            { $match: { quantity: { $lte: 25 } } },
            { $lookup: { from: 'uniforms', localField: '_id', foreignField: '_id', as: 'uniformDetails' } },
            { $unwind: "$uniformDetails" },
            { $sort: { quantity: 1 } }
        ]);
        res.json(alerts);
    } catch (err) {
        console.error("Error in /low-stock-alerts:", err.message);
        res.status(500).send('Server Error');
    }
});

// --- إحصائيات التسليم حسب المرحلة (معدلة لتجاهل نوع الدفع) ---
router.get('/stage-payment-stats', async (req, res) => {
  try {
    const stats = await Delivery.aggregate([
      // 1. ربط مع المخزون
      {
        $lookup: {
          from: 'inventories',
          localField: 'inventoryItem',
          foreignField: '_id',
          as: 'inventoryDetails'
        }
      },
      { $unwind: '$inventoryDetails' },

      // 2. ربط مع تفاصيل الزي
      {
        $lookup: {
          from: 'uniforms',
          localField: 'inventoryDetails.uniform',
          foreignField: '_id',
          as: 'uniformDetails'
        }
      },
      { $unwind: '$uniformDetails' },

      // 3. التجميع حسب المرحلة فقط (تجاهل نوع الدفع)
      {
        $group: {
          _id: "$uniformDetails.stage", // التجميع بالمرحلة فقط
          count: { $sum: 1 }
        }
      },
      
      // 4. ترتيب النتائج
      { $sort: { "_id": 1 } }
    ]);
    res.json(stats);
  } catch (err) {
    console.error("Error in /stage-payment-stats:", err);
    res.status(500).send('Server Error');
  }
});

// --- حالة التوزيع العامة ---
router.get('/delivery-status-stats', async (req, res) => {
  try {
    const stats = await Inventory.aggregate([
      { 
        $group: { 
            _id: "$status", 
            count: { $sum: 1 } 
        } 
      }
    ]);
    res.json(stats);
  } catch (err) {
    console.error("Error in /delivery-status-stats:", err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;