const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth'); 
const User = require('../models/User');

// --- رابط الطوارئ لإنشاء حساب الأدمن ---
// بعد أن يعمل النظام، يفضل حذف هذا الجزء
router.get('/create-admin-now', async (req, res) => {
    try {
        // فحص إذا كان الأدمن موجوداً مسبقاً
        let user = await User.findOne({ email: 'admin@alandalus.com' });
        if (user) {
            return res.send('<h1>الحساب موجود مسبقاً! يمكنك تسجيل الدخول الآن.</h1>');
        }

        // إنشاء الأدمن
        user = new User({
            name: 'System Admin',
            email: 'admin@alandalus.com',
            password: '123', // سيقوم النظام بتشفيرها تلقائياً
            role: 'admin',
            phoneNumber: '0500000000'
        });

        await user.save();
        res.send('<h1>✅ تم إنشاء حساب الأدمن بنجاح!</h1><p>البريد: admin@alandalus.com</p><p>كلمة المرور: 123</p>');
    } catch (err) {
        res.status(500).send('حدث خطأ: ' + err.message);
    }
});
// ------------------------------------

// @route   POST /api/auth/login
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        let user = await User.findOne({ email: email.toLowerCase() });
        if (!user) {
            return res.status(400).json({ msg: 'البريد الإلكتروني غير مسجل' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ msg: 'كلمة المرور غير صحيحة' });
        }

        const payload = {
            user: { id: user.id, role: user.role }
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

// التحقق من المستخدم الحالي
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