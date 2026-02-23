import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

function BarcodeRenderer({ value }) {
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
        backgroundColor: '#fff'
      }}
    >
      <QRCodeSVG 
        value={value} 
        size={130}       // تم زيادة الحجم ليناسب التصميم الطولي للملصق
        level={"H"}      // تصحيح أخطاء عالٍ
        includeMargin={false}
      />
      <div 
        style={{ 
          marginTop: '10px', 
          fontSize: '11px', 
          fontWeight: 'bold', 
          fontFamily: 'monospace',
          color: '#000'
        }}
      >
        {value}
      </div>
    </div>
  );
}

export default BarcodeRenderer;