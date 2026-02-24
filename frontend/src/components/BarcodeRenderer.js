import React from 'react';
import { QRCodeSVG } from 'qrcode.react';

function BarcodeRenderer({ value }) {
  if (!value) return null;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', backgroundColor: '#fff' }}>
      <QRCodeSVG value={value} size={140} level={"H"} includeMargin={false} />
      <div style={{ marginTop: '5px', fontSize: '10px', fontWeight: 'bold' }}>{value}</div>
    </div>
  );
}
export default BarcodeRenderer;