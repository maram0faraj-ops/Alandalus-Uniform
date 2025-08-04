import React, { useRef, useEffect } from 'react';
import JsBarcode from 'jsbarcode';

// هذا المكون يستخدم مكتبة JsBarcode الجديدة والموثوقة
function BarcodeRenderer({ value }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    // نتأكد من أن العنصر موجود وأن هناك قيمة لعرضها
    if (canvasRef.current && value) {
      // استخدام JsBarcode لرسم الباركود على عنصر canvas
      JsBarcode(canvasRef.current, value, {
        format: "CODE128", // نوع الباركود
        height: 60,        // ارتفاع الباركود
        displayValue: true,  // إظهار القيمة النصية أسفل الباركود
        fontSize: 16,        // حجم الخط
        margin: 10         // الهامش حول الباركود
      });
    }
  }, [value]); // يتم تشغيل هذا الكود كلما تغيرت قيمة الباركود

  // عرض عنصر canvas الذي سيتم الرسم عليه
  return <canvas ref={canvasRef} />;
}

export default BarcodeRenderer;
