import React, { useEffect } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const BarcodeScanner = ({ onScanSuccess, onScanError }) => {
  useEffect(() => {
    const html5QrCode = new Html5Qrcode("reader"); // "reader" هو id الخاص بالعنصر

    const qrCodeSuccessCallback = (decodedText, decodedResult) => {
      onScanSuccess(decodedText);
      // بعد النجاح، أوقف الكاميرا
      html5QrCode.stop().catch(err => console.error("Failed to stop the scanner.", err));
    };

    const config = { fps: 10, qrbox: { width: 250, height: 250 } };

    // بدء تشغيل الكاميرا
    // نستخدم facingMode: "environment" لمحاولة فتح الكاميرا الخلفية في الجوال
    html5QrCode.start({ facingMode: "environment" }, config, qrCodeSuccessCallback, onScanError)
      .catch(err => {
        console.log("Failed to start scanner, trying front camera...", err);
        // إذا فشلت الكاميرا الخلفية، حاول تشغيل الأمامية
        html5QrCode.start({ facingMode: "user" }, config, qrCodeSuccessCallback, onScanError)
          .catch(err => {
            console.error("Could not start any camera.", err);
            onScanError("لا يمكن تشغيل الكاميرا.");
          });
      });

    // دالة التنظيف لإيقاف الكاميرا عند إغلاق المكون
    return () => {
      // التأكد من أن الماسح يعمل قبل محاولة إيقافه
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(err => console.error("Failed to stop the scanner on cleanup.", err));
      }
    };
  }, [onScanSuccess, onScanError]);

  return <div id="reader" style={{ width: '100%', maxWidth: '500px', margin: 'auto' }}></div>;
};

export default BarcodeScanner;