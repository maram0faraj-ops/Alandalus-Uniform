const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth'); 
const User = require('../models/User');

// --- رابط سحري لإصلاح كلمة المرور ---
router.get('/create-admin-now', async (req, res) => {
    try {
        const email = 'admin@alandalus.com';
        const newPassword = '123';

        let user = await User.findOne({ email });

        if (user) {
            // إذا كان المستخدم موجوداً -> قم بتحديث كلمة المرور
            user.password = newPassword; 
            // ملاحظة: الـ Hook في ملف User.js سيقوم بتشفيرها تلقائياً عند الحفظ
            await user.save();
            return res.send(`
                <h1 style="color:green; text-align:center; margin-top:50px;">
                    ✅ تم تحديث كلمة المرور بنجاح!
                </h1>
                <p style="text-align:center; font-size:20px;">
                    يمكنك الآن الدخول بكلمة المرور: <b>123</b>
                </p>
            `);
        }

        // إذا لم يكن موجوداً -> أنشئه
        user = new User({
            name: 'System Admin',
            email: email,
            password: newPassword,
            role: 'admin',
            phoneNumber: '0500000000'
        });

        await user.save();
        res.send(`
            <h1 style="color:green; text-align:center; margin-top:50px;">
                ✅ تم إنشاء حساب الأدمن بنجاح!
            </h1>
            <p style="text-align:center; font-size:20px;">
                كلمة المرور: <b>123</b>
            </p>
        `);

    } catch (err) {
        res.status(500).send('حدث خطأ: ' + err.message);
    }
});

// --- مسار تسجيل الدخول ---
router.post('/login', async (req, res) => {
    const { email, password } = req.body;
    try {
        let user = await User.findOne({ email: email.toLowerCase() });
        if (!user) return res.status(400).json({ msg: 'البريد الإلكتروني غير مسجل' });

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) return res.status(400).json({ msg: 'كلمة المرور غير صحيحة' });

        const payload = { user: { id: user.id, role: user.role } };
        jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '12h' }, (err, token) => {
            if (err) throw err;
            res.json({ token, role: user.role });
        });
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;