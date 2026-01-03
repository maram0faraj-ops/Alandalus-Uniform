const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs'); // مكتبة تشفير كلمات المرور
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth'); // استدعاء الميدلوير الذي بالأسفل
const User = require('../models/User'); // نموذج المستخدم

// @route   POST /api/auth/login
// @desc    تسجيل الدخول والحصول على التوكن
// @access  Public
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // 1. التحقق من وجود المستخدم
        let user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ msg: 'البريد الإلكتروني غير مسجل' });
        }

        // 2. التحقق من كلمة المرور
        // ملاحظة: هذا يفترض أن كلمات المرور في قاعدة البيانات مشفرة.
        const isMatch = await bcrypt.compare(password, user.password);
        
        if (!isMatch) {
            return res.status(400).json({ msg: 'كلمة المرور غير صحيحة' });
        }

        // 3. إنشاء التوكن (Payload)
        const payload = {
            user: {
                id: user.id,
                role: user.role // إضافة الدور (admin/parent) مفيد للتوجيه في الواجهة
            }
        };

        // 4. توقيع التوكن وإرساله
        jwt.sign(
            payload,
            process.env.JWT_SECRET, // تأكد من وجود هذا المتغير في ملف .env
            { expiresIn: '12h' }, // مدة صلاحية التوكن
            (err, token) => {
                if (err) throw err;
                res.json({ token, role: user.role });
            }
        );

    } catch (err) {
        console.error("Login Route Error:", err.message);
        res.status(500).send('حدث خطأ في السيرفر أثناء تسجيل الدخول');
    }
});

// @route   GET /api/auth
// @desc    جلب بيانات المستخدم الحالي (للتحقق من الصلاحية)
// @access  Private
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