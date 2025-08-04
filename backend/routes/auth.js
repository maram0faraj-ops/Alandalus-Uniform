const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// ## مسار تسجيل مستخدم جديد (لولي الأمر) ##
router.post('/register', async (req, res) => {
  const { name, email, password, phoneNumber } = req.body;

  try {
    // التحقق إذا كان البريد الإلكتروني مسجلاً من قبل
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'هذا البريد الإلكتروني مسجل بالفعل' });
    }

    // إنشاء مستخدم جديد
    user = new User({
      name,
      email,
      password,
      phoneNumber,
      role: 'parent', // التسجيل دائماً لولي الأمر
    });

    // حفظ المستخدم في قاعدة البيانات (سيتم تشفير كلمة المرور تلقائياً)
    await user.save();

    res.status(201).json({ msg: 'تم تسجيل الحساب بنجاح' });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('خطأ في الخادم');
  }
});


// ## مسار تسجيل الدخول ##
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // التحقق من وجود المستخدم
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    // مقارنة كلمة المرور المدخلة بالكلمة المشفرة في قاعدة البيانات
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    // إنشاء وإرسال التوكن (JWT)
    const payload = {
      user: {
        id: user.id,
        role: user.role,
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' }, // صلاحية التوكن 5 ساعات
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );

  } catch (err) {
    console.error(err.message);
    res.status(500).send('خطأ في الخادم');
  }
});


module.exports = router;