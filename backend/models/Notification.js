// models/Notification.js
const mongoose = require('mongoose');

const notificationSchema = new mongoose.Schema({
  message: {
    type: String,
    required: true
  },
  item: { // رابط اختياري للصنف الذي يتعلق به الإشعار
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Inventory' // تأكد من أن 'Inventory' هو اسم الموديل الصحيح للمخزون
  },
  isRead: {
    type: Boolean,
    default: false
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Notification', notificationSchema);