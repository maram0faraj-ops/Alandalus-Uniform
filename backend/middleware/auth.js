const jwt = require('jsonwebtoken');

/**
 * Middleware للتحقق من التوكن وحماية المسارات الخاصة
 */
module.exports = function (req, res, next) {
  // جلب التوكن من الهيدر
  const authHeader = req.header('Authorization');

  // التحقق من وجود التوكن
  if (!authHeader) {
    return res.status(401).json({ msg: 'لا يوجد توكن، تم رفض الصلاحية' });
  }

  try {
    // استخراج التوكن (دعم التوكن سواء كان يبدأ بـ Bearer أو لا)
    const token = authHeader.startsWith('Bearer ') 
        ? authHeader.slice(7, authHeader.length).trim() 
        : authHeader;

    // التحقق من صحة التوكن
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // إرفاق بيانات المستخدم بالطلب لاستخدامها لاحقاً
    req.user = decoded.user;
    
    next(); // الانتقال للدالة التالية
  } catch (err) {
    console.error("Auth Middleware Error:", err.message);
    res.status(401).json({ msg: 'التوكن غير صالح أو منتهي الصلاحية' });
  }
};