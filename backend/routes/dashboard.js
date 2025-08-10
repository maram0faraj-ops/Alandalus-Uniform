// --- routes/dashboard.js ---
const express = require('express');
const router = express.Router();

// Assuming you have these models. Make sure the paths are correct.
const Inventory = require('../models/Inventory');
const Delivery = require('../models/Delivery'); // Assuming a Delivery model exists
const User = require('../models/User');

// --- EXISTING STATS API ---
// This endpoint provides the main numbers for the top cards.
router.get('/stats', async (req, res) => {
 try {
  // Use Delivery model for delivered count if it's more accurate
  const totalStock = await Inventory.countDocuments({ status: 'in_stock' });
  const deliveredStock = await Delivery.countDocuments(); // Counts all delivery records
  const totalParents = await User.countDocuments({ role: 'parent' });

  res.json({ totalStock, deliveredStock, totalParents });
 } catch (err) {
  console.error(err.message);
  res.status(500).send('Server Error');
 }
});

// --- NEW APIs FOR CHARTS AND NOTIFICATIONS ---

// API for Low Stock Notifications
router.get('/low-stock-alerts', async (req, res) => {
 try {
  // Find inventory items with quantity 50 or less
  const alerts = await Inventory.find({ quantity: { $lte: 50 } })
   .sort({ quantity: 1 }) // Show lowest first
   .limit(10); // Limit to 10 alerts
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
     // Group by both stage and a payment status field
     _id: { stage: "$stage", status: "$paymentStatus" }, // Ensure 'paymentStatus' field exists
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
     _id: "$status", // Groups by 'in_stock', 'delivered', etc.
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