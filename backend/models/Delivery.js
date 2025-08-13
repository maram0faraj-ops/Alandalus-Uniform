const mongoose = require('mongoose');

const DeliverySchema = new mongoose.Schema({
  inventoryItem: { type: mongoose.Schema.Types.ObjectId, ref: 'Inventory', required: true },
  deliveredBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  studentName: { type: String, required: true },
  stage: { type: String, required: true },
  grade: { type: String, required: true },
  section: { type: String, required: true },
  // تمت إضافة الحقل هنا
  paymentType: { type: String, required: true, enum: ['مدفوع', 'مجاني'] },
  deliveryDate: { type: Date, default: Date.now }
});

 module.exports = mongoose.model('Delivery', DeliverySchema);