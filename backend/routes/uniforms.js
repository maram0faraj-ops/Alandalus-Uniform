// backend/routes/uniforms.js

const express = require('express');
const router = express.Router();
const Uniform = require('../models/Uniform');
const auth = require('../middleware/auth');

// GET /api/uniforms/options
// هذا المسار يجلب كل الخيارات الفريدة للفلاتر
router.get('/options', auth, async (req, res) => {
    try {
        const stages = await Uniform.distinct('stage');
        const types = await Uniform.distinct('type');
        const sizes = await Uniform.distinct('size');
        
        res.json({
            stages,
            types,
            sizes
        });
    } catch (error) {
        console.error("Failed to get uniform options:", error);
        res.status(500).send('Server Error');
    }
});

module.exports = router;