    const mongoose = require('mongoose');

    const InventorySchema = new mongoose.Schema({
      uniform: { // للربط بصنف الزي
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Uniform',
        required: true
      },
      barcode: { // الباركود الفريد
        type: String,
        required: true,
        unique: true
      },
      status: { // حالة القطعة
        type: String,
        required: true,
        enum: ['in_stock', 'delivered', 'ordered'],
        default: 'in_stock'
      },
      entryDate: { // تاريخ الإدخال
        type: Date,
        default: Date.now
      }
    });

    module.exports = mongoose.model('Inventory', InventorySchema);
    