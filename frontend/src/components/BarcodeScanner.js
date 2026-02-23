import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const BarcodeScanner = ({ onScanSuccess, onScanError }) => {
  const videoRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    const qrCodeSuccessCallback = (decodedText, decodedResult) => {
      onScanSuccess(decodedText);
    };

    const config = {
      fps: 20, // زيادة عدد الإطارات لزيادة سرعة استجابة الكاميرا عند الحركة
      qrbox: { width: 250, height: 250 }, // تحديد مساحة ثابتة ومناسبة لمربعات QR
      aspectRatio: 1.0, // ضبط نسبة العرض إلى الارتفاع لتكون مربعة تماماً مثل الـ QR
    };
    
    const html5QrCode = new Html5Qrcode(videoRef.current.id);
    html5QrCodeRef.current = html5QrCode;

    // تشغيل الكاميرا مع تفضيل الكاميرا الخلفية
    html5QrCode.start(
      { facingMode: "environment" }, // البحث عن الكاميرا الخلفية تلقائياً
      config,
      qrCodeSuccessCallback
    ).catch(err => {
      console.error("فشل تشغيل الكاميرا:", err);
      // محاولة تشغيل أي كاميرا متاحة في حال فشل الكاميرا الخلفية
      html5QrCode.start({ facingMode: "user" }, config, qrCodeSuccessCallback)
        .catch(err2 => onScanError(err2));
    });

    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(err => console.error("فشل إيقاف الكاميرا:", err));
      }
    };
  }, [onScanSuccess, onScanError]);

  return (
    <div 
      id="reader" 
      ref={videoRef} 
      style={{ 
        width: '100%', 
        overflow: 'hidden', 
        borderRadius: '10px' 
      }}
    ></div>
  );
};

export default BarcodeScanner;