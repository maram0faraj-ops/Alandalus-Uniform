const mongoose = require('mongoose');

const DeliverySchema = new mongoose.Schema({
  inventoryItem: { // القطعة التي تم تسليمها
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory',
    required: true,
  },
  deliveredBy: { // الموظف الذي قام بالتسليم
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  studentName: {
    type: String,
    required: true,
  },
  stage: {
    type: String,
    required: true,
  },
  grade: {
    type: String,
    required: true,
  },
  section: { // الشعبة
    type: String,
    required: true,
  },
  deliveryDate: {
    type: Date,
    default: Date.now,
  },
});

module.exports = mongoose.model('Delivery', DeliverySchema);
