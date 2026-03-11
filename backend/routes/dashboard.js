const express = require('express');
const router = express.Router();

// استيراد النماذج (Models)
const Inventory = require('../models/Inventory');
const Delivery = require('../models/Delivery');
const User = require('../models/User');

/**
 * @route   GET /api/dashboard/stats
 * @desc    جلب الإحصائيات العامة (أرقام البطاقات العلوية)
 */
router.get('/stats', async (req, res) => {
  try {
    // 1. إجمالي المخزون المتاح حالياً (في المخزون)
    const totalStock = await Inventory.countDocuments({ status: 'in_stock' });
    
    // 2. إجمالي القطع التي تم تسليمها
    const deliveredStock = await Delivery.countDocuments();
    
    // 3. إجمالي عدد أولياء الأمور (يمكنك استخدامها أو تجاهلها في الواجهة)
    const totalParents = await User.countDocuments({ role: 'parent' });

    res.json({ totalStock, deliveredStock, totalParents });
  } catch (err) {
    console.error("Error in /stats:", err.message);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   GET /api/dashboard/low-stock-alerts
 * @desc    تنبيهات المخزون المنخفض (أقل من أو يساوي 25 قطعة)
 */
router.get('/low-stock-alerts', async (req, res) => {
    try {
        const alerts = await Inventory.aggregate([
            // 1. تصفية القطع الموجودة في المخزون فقط
            { $match: { status: 'in_stock' } },
            
            // 2. تجميع حسب معرف الزي (Uniform ID) وحساب العدد
            { $group: { _id: "$uniform", quantity: { $sum: 1 } } },
            
            // 3. تصفية النتائج لجلب الكميات القليلة فقط (25 أو أقل)
            { $match: { quantity: { $lte: 25 } } },
            
            // 4. جلب تفاصيل الزي (الاسم، المرحلة، المقاس)
            { $lookup: { from: 'uniforms', localField: '_id', foreignField: '_id', as: 'uniformDetails' } },
            
            // 5. فك المصفوفة الناتجة عن الـ lookup
            { $unwind: "$uniformDetails" },
            
            // 6. ترتيب النتائج تصاعدياً (الأكثر حرجاً أولاً)
            { $sort: { quantity: 1 } }
        ]);
        res.json(alerts);
    } catch (err) {
        console.error("Error in /low-stock-alerts:", err.message);
        res.status(500).send('Server Error');
    }
});

/**
 * @route   GET /api/dashboard/stage-payment-stats
 * @desc    إحصائيات مستوى التسليم حسب المرحلة (مصححة ودقيقة)
 * @note    يعتمد هذا الكود الآن على جدول 'Uniforms' لضمان صحة التصنيف وتجاهل أخطاء الإدخال اليدوي
 */
router.get('/stage-payment-stats', async (req, res) => {
  try {
    const stats = await Delivery.aggregate([
      // 1. الانتقال من جدول التسليم إلى جدول المخزون لمعرفة القطعة الأصلية
      {
        $lookup: {
          from: 'inventories',
          localField: 'inventoryItem',
          foreignField: '_id',
          as: 'inventoryDetails'
        }
      },
      { $unwind: '$inventoryDetails' },

      // 2. الانتقال من جدول المخزون إلى جدول تعريف الزي (Uniforms) لجلب المرحلة الصحيحة
      {
        $lookup: {
          from: 'uniforms',
          localField: 'inventoryDetails.uniform',
          foreignField: '_id',
          as: 'uniformDetails'
        }
      },
      { $unwind: '$uniformDetails' },

      // 3. التجميع حسب المرحلة (مع تنظيف المسافات لضمان عدم التكرار)
      {
        $group: {
          _id: { $trim: { input: "$uniformDetails.stage" } }, // استخدام trim لدمج "ابتدائي " مع "ابتدائي"
          count: { $sum: 1 }
        }
      },
      
      // 4. ترتيب النتائج أبجدياً
      { $sort: { "_id": 1 } }
    ]);
    res.json(stats);
  } catch (err) {
    console.error("Error in /stage-payment-stats:", err);
    res.status(500).send('Server Error');
  }
});

/**
 * @route   GET /api/dashboard/delivery-status-stats
 * @desc    إحصائيات حالة المخزون (في المخزون vs تم التسليم) للمخطط الدائري
 */
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