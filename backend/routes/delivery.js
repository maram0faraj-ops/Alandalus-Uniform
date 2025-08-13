// --- routes/delivery.js ---
const express = require('express');
const auth = require('../middleware/auth');
const Inventory = require('../models/Inventory');
const Delivery = require('../models/Delivery');
const User = require('../models/User');
const Uniform = require('../models/Uniform'); // <-- خطوة مهمة: استيراد نموذج الزي

const deliveryRouter = express.Router();

// المسار الخاص بالبحث عن الباركود (لا تغيير هنا)
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

// المسار الخاص بتوثيق عملية التسليم
deliveryRouter.post('/record', auth, async (req, res) => {
    // استقبال نوع الدفع من الواجهة الأمامية
    const { barcode, studentName, stage, grade, section, paymentType } = req.body;
    
    try {
      // البحث عن قطعة المخزون
      const inventoryItem = await Inventory.findOne({ barcode: barcode, status: 'in_stock' });
      if (!inventoryItem) {
        return res.status(404).json({ msg: 'هذا الباركود غير صالح أو تم تسليمه مسبقاً' });
      }

      // --- الجزء الجديد: تحديث نوع الدفع ---
      // نقوم بتحديث نوع الدفع في مستند الزي الأصلي بناءً على اختيارك
      if (paymentType) {
        await Uniform.updateOne(
            { _id: inventoryItem.uniform },
            { $set: { paymentType: paymentType } }
        );
      }
      // --- نهاية الجزء الجديد ---

      // إنشاء سجل تسليم جديد
      const newDelivery = new Delivery({
        inventoryItem: inventoryItem._id,
        deliveredBy: req.user.id,
        studentName,
        stage,
        grade,
        section
      });
      await newDelivery.save();

      // تحديث حالة قطعة المخزون إلى "تم التسليم"
      inventoryItem.status = 'delivered';
      await inventoryItem.save();

      res.status(201).json({ msg: 'تم توثيق التسليم وتحديث نوع الدفع بنجاح' });

    } catch (err) {
      console.error("ERROR IN POST /record :", err); 
      res.status(500).json({ msg: 'حدث خطأ في الخادم أثناء توثيق التسليم' }); 
    }
});

module.exports = deliveryRouter;