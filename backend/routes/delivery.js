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
    try {
        const item = await Inventory.findOne({ barcode, status: 'in_stock' });
        if (!item) { return res.status(404).json({ msg: 'الباركود غير صالح أو القطعة تم تسليمها بالفعل' }); }
        const newDelivery = new Delivery({ inventoryItem: item._id, deliveredBy: req.user.id, studentName, stage, grade, section });
        await newDelivery.save();
        item.status = 'delivered';
        await item.save();
        res.status(200).json({ msg: 'تم توثيق عملية التسليم بنجاح' });
    } catch (err) { res.status(500).send('Server Error'); }
});
module.exports = deliveryRouter;
