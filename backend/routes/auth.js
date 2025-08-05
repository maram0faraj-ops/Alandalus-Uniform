const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');

const router = express.Router();

// ... (مسار التسجيل يبقى كما هو)
router.post('/register', async (req, res) => {
  const { name, email, password, phoneNumber } = req.body;

  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'هذا البريد الإلكتروني مسجل بالفعل' });
    }

    user = new User({
      name,
      email,
      password,
      phoneNumber,
      role: 'parent', 
    });

    await user.save();

    res.status(201).json({ msg: 'تم تسجيل الحساب بنجاح' });

  } catch (err) {
    console.error(err.message);
    res.status(500).send('خطأ في الخادم');
  }
});


// ## مسار تسجيل الدخول (تم التعديل هنا) ##
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(400).json({ msg: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(400).json({ msg: 'البريد الإلكتروني أو كلمة المرور غير صحيحة' });
    }

    const payload = {
      user: {
        id: user.id,
        role: user.role, // إضافة الدور هنا
      },
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '5h' },
      (err, token) => {
        if (err) throw err;
        // إرسال التوكن والدور معاً
        res.json({ 
          token, 
          user: { 
            id: user.id, 
            name: user.name, 
            email: user.email, 
            role: user.role 
          } 
        });
      }
    );

  } catch (err) {
    console.error(err.message);
    res.status(500).send('خطأ في الخادم');
  }
});

module.exports = router;
