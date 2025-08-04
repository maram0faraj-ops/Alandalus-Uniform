    const mongoose = require('mongoose');

    const UniformSchema = new mongoose.Schema({
      stage: { // المرحلة الدراسية
        type: String,
        required: true,
        enum: ['رياض أطفال بنات', 'رياض أطفال بنين', 'طفولة مبكرة بنات', 'طفولة مبكرة بنين', 'ابتدائي', 'متوسط', 'ثانوي']
      },
      type: { // نوع الزي
        type: String,
        required: true,
        enum: ['رسمي', 'رياضي', 'جاكيت']
      },
      size: { // المقاس
        type: Number,
        required: true,
        min: 24,
        max: 50
      },
      paymentType: { // نوع الدفع
        type: String,
        required: true,
        enum: ['مدفوع', 'مجاني']
      }
    });

    module.exports = mongoose.model('Uniform', UniformSchema);
    