const { v4: uuidv4 } = require('uuid');
const express = require('express');
const auth = require('../middleware/auth');
const inventoryRouter = express.Router();

const Uniform = require('../models/Uniform');
const Inventory = require('../models/Inventory');

// --- POST /api/inventory/add (No changes here) ---
inventoryRouter.post('/add', auth, async (req, res) => {
    // ... existing code for adding stock
});

// --- GET /api/inventory/ (No changes here) ---
inventoryRouter.get('/', auth, async (req, res) => {
    // ... existing code for fetching stock
});


// --- NEW ROUTE: DELETE an inventory item ---
/**
 * @route   DELETE /api/inventory/:id
 * @desc    Delete an inventory item by its ID
 * @access  Private (Admin)
 */
inventoryRouter.delete('/:id', auth, async (req, res) => {
    // We can add role checks here if needed, e.g., if (req.user.role !== 'admin') ...
    try {
        const item = await Inventory.findById(req.params.id);

        if (!item) {
            return res.status(404).json({ msg: 'Item not found' });
        }

        await item.deleteOne(); // Use deleteOne() on the document

        res.json({ msg: 'Item removed successfully' });

    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});
// --- End of new route ---


module.exports = inventoryRouter;