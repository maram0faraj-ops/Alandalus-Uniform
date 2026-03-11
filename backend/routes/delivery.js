const express = require('express');
const auth = require('../middleware/auth');
const Inventory = require('../models/Inventory');
const Delivery = require('../models/Delivery');
const deliveryRouter = express.Router();

// جلب بيانات القطعة عبر الباركود
deliveryRouter.get('/item/:barcode', auth, async (req, res) => {
    try {
        const searchBarcode = req.params.barcode.trim(); // تنظيف الباركود
        const item = await Inventory.findOne({ 
            barcode: searchBarcode, 
            status: 'in_stock' 
        }).populate('uniform');

        if (!item) { 
            return res.status(404).json({ msg: 'الباركود غير صالح أو القطعة تم تسليمها بالفعل' }); 
        }
        res.json(item);
    } catch (err) { 
        res.status(500).json({ msg: 'حدث خطأ في الخادم' }); 
    }
});

// توثيق عملية التسليم
deliveryRouter.post('/record', auth, async (req, res) => {
    const { barcode, studentName, stage, grade, section, paymentType } = req.body;
    try {
      const inventoryItem = await Inventory.findOne({ barcode: barcode.trim(), status: 'in_stock' });
      if (!inventoryItem) {
        return res.status(404).json({ msg: 'هذا الباركود غير صالح أو تم تسليمه مسبقاً' });
      }

      const newDelivery = new Delivery({
        inventoryItem: inventoryItem._id,
        deliveredBy: req.user.id,
        studentName,
        stage,
        grade,
        section,
        paymentType 
      });

      await newDelivery.save();
      inventoryItem.status = 'delivered'; // تحديث الحالة
      await inventoryItem.save();

      res.status(201).json({ msg: 'تم توثيق عملية التسليم بنجاح' });
    } catch (err) {
      res.status(500).json({ msg: 'حدث خطأ أثناء توثيق التسليم' }); 
    }
});

module.exports = deliveryRouter;