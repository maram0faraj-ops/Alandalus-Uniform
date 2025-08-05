// --- routes/dashboard.js ---
const express = require('express');
const router = express.Router();
const auth = require('../middleware/auth');
const Inventory = require('../models/Inventory');

const User = require('../models/User');

 router.get('/stats', auth, async (req, res) => {
  try {
    const totalStock = await Inventory.countDocuments({ status: 'in_stock' });
    const deliveredStock = await Inventory.countDocuments({ status: 'delivered' });
    const totalParents = await User.countDocuments({ role: 'parent' });
    res.json({ totalStock, deliveredStock, totalParents });
  } catch (err) {
    res.status(500).send('Server Error');
  }
 });
  module.exports = router;