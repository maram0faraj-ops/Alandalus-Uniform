 const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const User = require('../models/User');
const router = express.Router();

// @route   POST api/auth/register
// @desc    Register a new parent user
// @access  Public
router.post('/register', async (req, res) => {
  const { name, email, password, phoneNumber } = req.body;
  try {
    let user = await User.findOne({ email });
    if (user) {
      return res.status(400).json({ msg: 'هذا البريد الإلكتروني مسجل بالفعل' });
    }
    user = new User({ name, email, password, phoneNumber, role: 'staff' });
    await user.save();
    res.status(201).json({ msg: 'تم تسجيل الحساب بنجاح' });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

// @route   POST api/auth/login
// @desc    Authenticate user & get token
// @access  Public
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
    const payload = { user: { id: user.id, role: user.role } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '8h' }, (err, token) => {
      if (err) throw err;
      res.json({
        token,
        user: { id: user.id, name: user.name, email: user.email, role: user.role }
      });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).send('Server error');
  }
});

module.exports = router;
