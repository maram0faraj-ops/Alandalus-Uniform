const jwt = require('jsonwebtoken');

module.exports = function (req, res, next) {
  const authHeader = req.header('Authorization');

  if (!authHeader) {
    return res.status(401).json({ msg: 'لا يوجد توكن، تم رفض الصلاحية' });
  }

  try {
    const token = authHeader.startsWith('Bearer ') 
        ? authHeader.slice(7, authHeader.length).trim() 
        : authHeader;

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded.user;
    next();
  } catch (err) {
    res.status(401).json({ msg: 'التوكن غير صالح' });
  }
};