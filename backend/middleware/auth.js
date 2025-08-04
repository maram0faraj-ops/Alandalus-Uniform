const jwt = require('jsonwebtoken');

// هذه الدالة هي طبقة الحماية
module.exports = function (req, res, next) {
  // استخلاص التوكن من رأس الطلب
  const authHeader = req.header('Authorization');

  // التحقق من وجود التوكن
  if (!authHeader) {
    return res.status(401).json({ msg: 'لا يوجد توكن، عملية الدخول مرفوضة' });
  }

  try {
    // التوكن يأتي بالصيغة "Bearer <token>"، لذا نقوم بفصله
    const token = authHeader.split(' ')[1];
    
    // التحقق من صحة التوكن
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next(); // السماح للطلب بالمرور إلى الوظيفة التالية
  } catch (err) {
    res.status(401).json({ msg: 'التوكن غير صالح' });
  }
};
