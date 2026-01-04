const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
// استيراد الميدلوير من مجلد middleware (تأكد من وجود الملف هناك)
const auth = require('../middleware/auth'); 
const User = require('../models/User');

// @route   POST /api/auth/login
// @desc    تسجيل الدخول وإصدار التوكن (هذا هو الجزء المفقود)
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. التحقق من وجود المستخدم (مع تحويل البريد لحروف صغيرة)
        let user = await User.findOne({ email: email.toLowerCase() });
        
        if (!user) {
            return res.status(400).json({ msg: 'البريد الإلكتروني غير مسجل' });
        }

        // 2. التحقق من صحة كلمة المرور
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'كلمة المرور غير صحيحة' });
        }

        // 3. إنشاء التوكن (JWT)
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
                // إرسال التوكن والدور للمتصفح
                res.json({ token, role: user.role });
            }
        );

    } catch (err) {
        console.error("Login Error:", err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/auth
// @desc    التحقق من المستخدم الحالي
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