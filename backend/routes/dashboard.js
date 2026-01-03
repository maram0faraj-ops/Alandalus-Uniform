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
    // 1. إجمالي المخزون المتاح حالياً
    const totalStock = await Inventory.countDocuments({ status: 'in_stock' });
    
    // 2. إجمالي القطع التي تم تسليمها
    const deliveredStock = await Delivery.countDocuments();
    
    // 3. إجمالي عدد أولياء الأمور المسجلين
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
 * يقوم بتجميع القطع حسب النوع والمقاس وحساب الكمية المتبقية
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
            
            // 4. جلب تفاصيل الزي (الاسم، المرحلة، المقاس) من جدول Uniforms
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
 * @desc    إحصائيات المدفوع والمجاني لكل مرحلة (للمخطط الشريطي)
 */
router.get('/stage-payment-stats', async (req, res) => {
  try {
    const stats = await Delivery.aggregate([
      // 1. ربط عملية التسليم بقطعة المخزون لمعرفة تفاصيلها
      {
        $lookup: {
          from: 'inventories',
          localField: 'inventoryItem',
          foreignField: '_id',
          as: 'inventoryDetails'
        }
      },
      { $unwind: '$inventoryDetails' },

      // 2. ربط قطعة المخزون بجدول الأزياء (Uniforms) لمعرفة المرحلة (Stage)
      {
        $lookup: {
          from: 'uniforms',
          localField: 'inventoryDetails.uniform',
          foreignField: '_id',
          as: 'uniformDetails'
        }
      },
      { $unwind: '$uniformDetails' },

      // 3. التجميع النهائي
      {
        $group: {
          _id: {
            stage: "$uniformDetails.stage", // نأخذ اسم المرحلة من تعريف الزي لتوحيد الأسماء
            paymentType: "$paymentType"     // هام: نأخذ نوع الدفع من عملية التسليم نفسها (لأنها الأدق)
          },
          count: { $sum: 1 }
        }
      },
      
      // 4. ترتيب النتائج
      { $sort: { "_id.stage": 1 } }
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