const mongoose = require('mongoose');

const InventorySchema = new mongoose.Schema({
  uniform: { type: mongoose.Schema.Types.ObjectId, ref: 'Uniform', required: true },
  barcode: { type: String, required: true, unique: true },
  status: { type: String, required: true, enum: ['in_stock', 'delivered', 'ordered'], default: 'in_stock' },
  entryDate: { type: Date, default: Date.now }
});

module.exports = mongoose.model('Inventory', InventorySchema);