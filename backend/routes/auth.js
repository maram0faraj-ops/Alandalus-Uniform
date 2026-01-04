const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const auth = require('../middleware/auth'); 
const User = require('../models/User');

// --- رابط الطوارئ لإصلاح كلمة المرور ---
router.get('/fix-password', async (req, res) => {
    try {
        const email = 'admin@alandalus.com';
        const newPassword = '123';

        // 1. البحث عن الأدمن
        let user = await User.findOne({ email: email });

        if (user) {
            // موجود؟ نحدث كلمة المرور
            user.password = newPassword;
            // ملاحظة: سيتم تشفيرها تلقائياً عند الحفظ بسبب كود User.js
            await user.save();
            
            return res.send(`
                <div style="text-align:center; font-family: sans-serif; margin-top: 50px;">
                    <h1 style="color: green;">✅ تم تغيير كلمة المرور بنجاح!</h1>
                    <h3>البريد: ${email}</h3>
                    <h3>كلمة المرور الجديدة: ${newPassword}</h3>
                    <p>يمكنك الآن الذهاب لصفحة الدخول.</p>
                </div>
            `);
        } else {
            // غير موجود؟ ننشئه
            user = new User({
                name: 'System Admin',
                email: email,
                password: newPassword,
                role: 'admin',
                phoneNumber: '0500000000'
            });
            await user.save();
            
            return res.send(`
                <div style="text-align:center; font-family: sans-serif; margin-top: 50px;">
                    <h1 style="color: blue;">✅ تم إنشاء الحساب الجديد!</h1>
                    <h3>البريد: ${email}</h3>
                    <h3>كلمة المرور: ${newPassword}</h3>
                </div>
            `);
        }
    } catch (err) {
        res.status(500).send(`<h1>❌ حدث خطأ: ${err.message}</h1>`);
    }
});

// --- مسار تسجيل الدخول المعتاد ---
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // تحويل البريد لحروف صغيرة للتأكد من المطابقة
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

// التحقق من المستخدم
router.get('/', auth, async (req, res) => {
    try {
        const user = await User.findById(req.user.id).select('-password');
        res.json(user);
    } catch (err) {
        res.status(500).send('Server Error');
    }
});

module.exports = router;