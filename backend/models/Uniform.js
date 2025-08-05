const mongoose = require('mongoose');
const UniformSchema = new mongoose.Schema({
  stage: { type: String, required: true, enum: ['رياض أطفال بنات', 'رياض أطفال بنين', 'طفولة مبكرة بنات', 'طفولة مبكرة بنين', 'ابتدائي', 'متوسط', 'ثانوي'] },
  type: { type: String, required: true, enum: ['رسمي', 'رياضي', 'جاكيت'] },
  size: { type: Number, required: true, min: 24, max: 50 },
  paymentType: { type: String, required: true, enum: ['مدفوع', 'مجاني'] }
});
module.exports = mongoose.model('Uniform', UniformSchema);