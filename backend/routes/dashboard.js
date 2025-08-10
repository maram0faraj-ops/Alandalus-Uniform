const express = require('express');
const router = express.Router();
const Inventory = require('../models/Inventory');
const Delivery = require('../models/Delivery');
const User = require('../models/User');

// API to get main statistics for the top cards
router.get('/stats', async (req, res) => {
  try {
    const totalStock = await Inventory.countDocuments({ status: 'in_stock' });
    const deliveredStock = await Delivery.countDocuments();
    const totalParents = await User.countDocuments({ role: 'parent' });
    res.json({ totalStock, deliveredStock, totalParents });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// API for Low Stock Notifications (Corrected Logic)
router.get('/low-stock-alerts', async (req, res) => {
  try {
    const alerts = await Inventory.aggregate([
      // 1. Find only items that are currently in stock
      { $match: { status: 'in_stock' } },
      // 2. Group by uniform type and count the quantity
      {
        $group: {
          _id: "$uniform",
          quantity: { $sum: 1 }
        }
      },
      // 3. Filter for groups with a low quantity
      { $match: { quantity: { $lte: 50 } } },
      // 4. Get the full details for each uniform type
      {
        $lookup: {
          from: 'uniforms', // The name of your 'Uniform' collection
          localField: '_id',
          foreignField: '_id',
          as: 'uniformDetails'
        }
      },
      // 5. Deconstruct the uniformDetails array
      { $unwind: "$uniformDetails" },
      // 6. Sort by the lowest quantity first
      { $sort: { quantity: 1 } }
    ]);
    res.json(alerts);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// API for Paid vs. Free Uniforms Chart
router.get('/stage-payment-stats', async (req, res) => {
  try {
    const stats = await Delivery.aggregate([
      {
        $group: {
          _id: { stage: "$stage", status: "$paymentStatus" },
          count: { $sum: 1 }
        }
      }
    ]);
    res.json(stats);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

// API for Delivery Status Donut Chart
router.get('/delivery-status-stats', async (req, res) => {
  try {
    const stats = await Inventory.aggregate([
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 }
        }
      }
    ]);
    res.json(stats);
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server Error');
  }
});

module.exports = router;