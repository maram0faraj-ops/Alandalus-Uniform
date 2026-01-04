const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// لاحظ: نستدعي ملف الحماية من مجلد middleware وليس routes
const auth = require('../middleware/auth'); 
const User = require('../models/User');

// 1. رابط تسجيل الدخول (هذا هو الكود الذي كان مفقوداً)
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // البحث عن المستخدم وتحويل البريد لحروف صغيرة
        let user = await User.findOne({ email: email.toLowerCase() });
        
        if (!user) {
            return res.status(400).json({ msg: 'البريد الإلكتروني غير مسجل' });
        }

        // مطابقة كلمة المرور
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'كلمة المرور غير صحيحة' });
        }

        // إنشاء التوكن
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

// 2. رابط التحقق من المستخدم الحالي
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