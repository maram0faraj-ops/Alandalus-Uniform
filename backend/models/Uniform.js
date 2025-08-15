const mongoose = require('mongoose');
const UniformSchema = new mongoose.Schema({
  stage: { type: String, required: true, enum: ['رياض أطفال بنات', 'رياض أطفال بنين', ' ابتدائي بنات', ' ابتدائي بنين',  'متوسط', 'ثانوي'] },
  type: { type: String, required: true, enum: ['رسمي', 'رياضي', 'جاكيت'] },
  size: { type: Number, required: true, min: 10, max: 60 },
  // تم حذف حقل paymentType بالكامل من هنا
});
module.exports = mongoose.model('Uniform', UniformSchema);