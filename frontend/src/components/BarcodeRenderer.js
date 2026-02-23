import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

function BarcodeRenderer({ value }) {
  if (!value) return null;

  return (
    <div className="qr-code-wrapper" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#fff' }}>
      <QRCodeSVG 
        value={value} 
        size={135} // مقاس مثالي لـ 4 ملصقات في الصف الواحد
        level={"H"}
        includeMargin={false}
      />
      <div style={{ marginTop: '5px', fontSize: '10px', fontWeight: 'bold', fontFamily: 'monospace' }}>
        {value}
      </div>
    </div>
  );
}

export default BarcodeRenderer;