const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// لاحظ: هنا نستدعي ملف الحماية من مجلد آخر
const auth = require('../middleware/auth'); 
const User = require('../models/User');

// @route   POST /api/auth/login
// @desc    استقبال طلب تسجيل الدخول
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. البحث عن المستخدم (مع تحويل البريد لحروف صغيرة)
        let user = await User.findOne({ email: email.toLowerCase() });
        
        if (!user) {
            return res.status(400).json({ msg: 'البريد الإلكتروني غير مسجل' });
        }

        // 2. التحقق من كلمة المرور
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'كلمة المرور غير صحيحة' });
        }

        // 3. إنشاء التوكن
        const payload = {
            user: {
                id: user.id,
                role: user.role
            }
        };

        jwt.sign(
            payload,
            process.env.JWT_SECRET,
            { expiresIn: '12h' }, 
            (err, token) => {
                if (err) throw err;
                res.json({ token, role: user.role });
            }
        );

    } catch (err) {
        console.error("Login Error:", err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/auth
// @desc    التحقق من المستخدم الحالي (يعتمد على الميدلوير)
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

module.exports = router;