const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth'); // استدعاء الميدلوير
const User = require('../models/User'); // استدعاء موديل المستخدم

// @route   POST /api/auth/login
// @desc    تسجيل الدخول
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. التحقق من وجود المستخدم (مع تحويل الإيميل لحروف صغيرة)
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
            { expiresIn: '12h' }, // مدة الجلسة
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

// @route   POST /api/auth/register
// @desc    إنشاء حساب جديد (للاستخدام اليدوي أو عبر Postman)
router.post('/register', async (req, res) => {
    const { name, email, password, role, phoneNumber } = req.body;
    try {
        let user = await User.findOne({ email: email.toLowerCase() });
        if (user) {
            return res.status(400).json({ msg: 'المستخدم موجود بالفعل' });
        }

        // إنشاء مستخدم جديد (كلمة المرور سيتم تشفيرها تلقائياً بفضل User.js)
        user = new User({ 
            name, 
            email: email.toLowerCase(), 
            password, 
            role: role || 'staff',
            phoneNumber
        });

        await user.save();

        // إنشاء توكن للدخول المباشر
        const payload = { user: { id: user.id, role: user.role } };
        jwt.sign(
            payload, 
            process.env.JWT_SECRET, 
            { expiresIn: '12h' }, 
            (err, token) => {
                if (err) throw err;
                res.json({ token, msg: "تم إنشاء الحساب بنجاح" });
            }
        );
    } catch (err) {
        console.error(err.message);
        res.status(500).send('Server Error');
    }
});

// @route   GET /api/auth
// @desc    جلب بيانات المستخدم الحالي (للتحقق من التوكن)
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