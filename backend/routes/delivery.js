const express = require('express');
const auth = require('../middleware/auth');
const Inventory = require('../models/Inventory');
const Delivery = require('../models/Delivery');
const User = require('../models/User'); // قد تحتاج هذا النموذج إذا كنت تستخدم بيانات المستخدم

const deliveryRouter = express.Router();

/**
 * @route   GET /api/delivery/item/:barcode
 * @desc    Fetch an inventory item by its barcode
 * @access  Private (auth required)
 */
deliveryRouter.get('/item/:barcode', auth, async (req, res) => {
    try {
        const searchBarcode = req.params.barcode;
        
        console.log(`DATABASE_QUERY: Searching for barcode: "${searchBarcode}" with status: "in_stock"`);

        const item = await Inventory.findOne({ 
            barcode: searchBarcode, 
            status: 'in_stock' 
        }).populate('uniform');

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

/**
 * @route   POST /api/delivery/record
 * @desc    Record a new delivery and update inventory status
 * @access  Private (auth required)
 */
deliveryRouter.post('/record', auth, async (req, res) => {
    const { barcode, studentName, stage, grade, section, paymentType } = req.body;
    
    try {
      // Find the inventory item by barcode and ensure it is in stock
      const inventoryItem = await Inventory.findOne({ barcode: barcode, status: 'in_stock' });
      if (!inventoryItem) {
        return res.status(404).json({ msg: 'هذا الباركود غير صالح أو تم تسليمه مسبقاً' });
      }

      // Create a new delivery record, including the paymentType from the request
      const newDelivery = new Delivery({
        inventoryItem: inventoryItem._id,
        deliveredBy: req.user.id, // Comes from the 'auth' middleware
        studentName,
        stage,
        grade,
        section,
        paymentType: paymentType // Save the payment type with the delivery record
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