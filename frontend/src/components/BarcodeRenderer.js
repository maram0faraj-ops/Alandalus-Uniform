import React, { useRef, useEffect } from 'react';
import JsBarcode from 'jsbarcode';

function BarcodeRenderer({ value }) {
  const canvasRef = useRef(null);

  useEffect(() => {
    if (canvasRef.current && value) {
      try {
        JsBarcode(canvasRef.current, value, {
          format: "CODE128",
          height: 60,
          displayValue: true,
          fontSize: 16,
          margin: 10
        });
      } catch (e) {
        console.error("Barcode generation failed:", e);
      }
    }
  }, [value]);

  return <canvas ref={canvasRef} />;
}

export default BarcodeRenderer;
