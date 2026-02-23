import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

/**
 * مكون عرض QR Code المحدث لنظام الزي المدرسي.
 * تم إزالة الشعار لتبسيط الكود وضمان توافقه مع جميع أنواع أجهزة المسح.
 */
function BarcodeRenderer({ value }) {
  // منع الرندر في حال عدم وجود قيمة
  if (!value) return null;

  return (
    <div 
      className="qr-code-wrapper" 
      style={{ 
        display: 'flex', 
        flexDirection: 'column', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '10px',
        backgroundColor: '#fff',
        borderRadius: '8px'
      }}
    >
      <QRCodeSVG 
        value={value} 
        size={110}       // حجم مناسب لملصقات الزي المدرسى
        level={"H"}      // مستوى تصحيح أخطاء عالٍ لضمان القراءة حتى في الإضاءة الضعيفة
        includeMargin={false}
      />
      
      {/* عرض المعرف النصي أسفل الكود للرجوع إليه يدوياً */}
      <div 
        style={{ 
          marginTop: '8px', 
          fontSize: '11px', 
          fontWeight: 'bold', 
          fontFamily: 'monospace',
          color: '#333'
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default BarcodeRenderer;