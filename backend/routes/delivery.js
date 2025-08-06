// --- routes/delivery.js ---
const express = require('express');
const auth = require('../middleware/auth');
const Inventory = require('../models/Inventory');
const Delivery = require('../models/Delivery');
const User = require('../models/User');

const deliveryRouter = express.Router();

// المسار الخاص بالبحث عن الباركود
deliveryRouter.get('/item/:barcode', auth, async (req, res) => {
    try {
        const searchBarcode = req.params.barcode;
        
        // إضافة جديدة: لطباعة ما يتم البحث عنه بالضبط
        console.log(`DATABASE_QUERY: Searching for barcode: "${searchBarcode}" with status: "in_stock"`);

        const item = await Inventory.findOne({ 
            barcode: searchBarcode, 
            status: 'in_stock' 
        }).populate('uniform');

        // إضافة جديدة: لطباعة نتيجة البحث
        console.log("DATABASE_RESULT:", item);

        if (!item) { 
            return res.status(404).json({ msg: 'الباركود غير صالح أو القطعة تم تسليمها بالفعل' }); 
        }
        res.json(item);
    } catch (err) { 
        console.error("ERROR IN GET /item/:barcode :", err);
        res.status(500).json({ msg: 'حدث خطأ في الخادم، يرجى مراجعة السجلات' }); 
    }
});

// المسار الخاص بتوثيق عملية التسليم
deliveryRouter.post('/record', auth, async (req, res) => {
    const { barcode, studentName, stage, grade, section } = req.body;
    
    try {
      // Find the inventory item by barcode
      const inventoryItem = await Inventory.findOne({ barcode: barcode, status: 'in_stock' });
      if (!inventoryItem) {
        return res.status(404).json({ msg: 'هذا الباركود غير صالح أو تم تسليمه مسبقاً' });
      }

      // Create a new delivery record
      const newDelivery = new Delivery({
        inventoryItem: inventoryItem._id,
        deliveredBy: req.user.id, // Comes from the 'auth' middleware
        studentName,
        stage,
        grade,
        section
      });
      await newDelivery.save();

      // Update the inventory item's status to 'delivered'
      inventoryItem.status = 'delivered';
      await inventoryItem.save();

      res.status(201).json({ msg: 'تم توثيق عملية التسليم بنجاح' });

    } catch (err) {
      console.error("ERROR IN POST /record :", err); 
      res.status(500).json({ msg: 'حدث خطأ في الخادم أثناء توثيق التسليم' }); 
    }
});

module.exports = deliveryRouter;