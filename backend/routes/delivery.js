// --- routes/delivery.js ---
const express = require('express');
const auth = require('../middleware/auth');
const deliveryRouter = express.Router();
deliveryRouter.get('/item/:barcode', auth, async (req, res) => {
    try {
        const item = await Inventory.findOne({ barcode: req.params.barcode, status: 'in_stock' }).populate('uniform');
        if (!item) { return res.status(404).json({ msg: 'الباركود غير صالح أو القطعة تم تسليمها بالفعل' }); }
        res.json(item);
    } catch (err) { res.status(500).send('Server Error'); }
});
deliveryRouter.post('/record', auth, async (req, res) => {
    const { barcode, studentName, stage, grade, section } = req.body;
    // ...
    try {
      const item = await Inventory.findOne({ barcode: req.params.barcode, status: 'in_stock' }).populate('uniform');
      // ...
    } catch (err) {
      // الخطوة الأهم: طباعة الخطأ الكامل في سجلات الخادم
      console.error("ERROR WHILE SEARCHING FOR BARCODE:", err); 

      // إرسال رسالة خطأ واضحة للواجهة الأمامية
      res.status(500).json({ msg: 'حدث خطأ في الخادم، يرجى مراجعة السجلات' }); 
    }
// ...
});
module.exports = deliveryRouter;
