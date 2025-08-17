const express = require('express');
const router = express.Router();
const Delivery = require('../models/Delivery');
const Inventory = require('../models/Inventory');
const ExcelJS = require('exceljs');

// --- Delivery Report Route (No changes here) ---
router.post('/export', async (req, res) => {
    // ... existing code for delivery report
});

// --- New Inventory Report Routes (Updated) ---

// 1. Summary Report Route
router.post('/inventory-summary', async (req, res) => {
    try {
        const { stage, type, size, entryDate } = req.body; // <-- Add entryDate
        const matchConditions = { status: 'in_stock' };
        const uniformMatch = {};

        if (stage) uniformMatch['uniformDetails.stage'] = stage;
        if (type) uniformMatch['uniformDetails.type'] = type;
        if (size) uniformMatch['uniformDetails.size'] = Number(size);
        
        // --- Add date filtering logic ---
        if (entryDate) {
            const startDate = new Date(entryDate);
            startDate.setUTCHours(0, 0, 0, 0);
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 1);
            matchConditions.entryDate = { $gte: startDate, $lt: endDate };
        }
        // --- End of date logic ---

        const summary = await Inventory.aggregate([
            { $match: matchConditions }, // Match by date first
            {
                $lookup: {
                    from: 'uniforms',
                    localField: 'uniform',
                    foreignField: '_id',
                    as: 'uniformDetails'
                }
            },
            { $unwind: '$uniformDetails' },
            { $match: uniformMatch }, // Then match by uniform details
            {
                $group: {
                    _id: {
                        stage: '$uniformDetails.stage',
                        type: '$uniformDetails.type',
                        size: '$uniformDetails.size'
                    },
                    quantity: { $sum: 1 }
                }
            },
            { $sort: { '_id.stage': 1, '_id.type': 1, '_id.size': 1 } }
        ]);

         res.json(summary);
    } catch (error) {
        console.error("Inventory Summary Error:", error);
        res.status(500).json({ message: 'Failed to create summary report.' });
    }
});

// 2. Details Report Route
router.post('/inventory-details', async (req, res) => {
    try {
        const { stage, type, size, entryDate } = req.body; // <-- Add entryDate
        const query = { status: 'in_stock' };

        // --- Add date filtering logic ---
        if (entryDate) {
            const startDate = new Date(entryDate);
            startDate.setUTCHours(0, 0, 0, 0);
            const endDate = new Date(startDate);
            endDate.setDate(startDate.getDate() + 1);
            query.entryDate = { $gte: startDate, $lt: endDate };
        }
        // --- End of date logic ---
        
        let items = await Inventory.find(query).populate('uniform');

        if (stage) items = items.filter(item => item.uniform?.stage === stage);
        if (type) items = items.filter(item => item.uniform?.type === type);
        if (size) items = items.filter(item => item.uniform?.size === Number(size));

         res.json(items);
    } catch (error) {
        console.error("Inventory Details Error:", error);
        res.status(500).json({ message: 'Failed to create detailed report.' });
    }
 });
 
module.exports = router;