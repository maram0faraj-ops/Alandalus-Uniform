const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth'); // استيراد طبقة الحماية
const Inventory = require('../models/Inventory');
const User = require('../models/User');

// تطبيق الحماية على هذا المسار أيضاً
router.get('/stats', auth, async (req, res) => {
  try {
    const totalStock = await Inventory.countDocuments({ status: 'in_stock' });
    const deliveredStock = await Inventory.countDocuments({ status: 'delivered' });
    const totalParents = await User.countDocuments({ role: 'parent' });

    res.json({
      totalStock,
      deliveredStock,
      totalParents,
    });
  } catch (err) {
    console.error("Error in /stats route:", err.message);
    res.status(500).send('خطأ في الخادم');
  }
});

module.exports = router;
