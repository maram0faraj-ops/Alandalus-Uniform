// routes/notifications.js
const express = require('express');
const router = express.Router();
const Notification = require('../models/Notification');

// GET /api/notifications -> جلب كل الإشعارات غير المقروءة
router.get('/', async (req, res) => {
  try {
    const notifications = await Notification.find({ isRead: false }).sort({ createdAt: -1 });
    res.json(notifications);
  } catch (error) {
    res.status(500).json({ message: 'Server error while fetching notifications.' });
  }
});

// PATCH /api/notifications/:id/read -> تحديث حالة الإشعار إلى "مقروء"
router.patch('/:id/read', async (req, res) => {
  try {
    const notification = await Notification.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });
    if (!notification) {
      return res.status(404).json({ message: 'Notification not found.' });
    }
    res.json({ message: 'Notification marked as read.' });
  } catch (error) {
    res.status(500).json({ message: 'Server error while updating notification.' });
  }
});

module.exports = router;