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
      fps: 10,
      qrbox: (viewfinderWidth, viewfinderHeight) => {
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
        return { width: minEdge * 0.7, height: minEdge * 0.7 };
      },
    };
    
    const html5QrCode = new Html5Qrcode(videoRef.current.id);
    html5QrCodeRef.current = html5QrCode;

    // المحاولة الأولى: طلب الكاميرا الخلفية مباشرة
    html5QrCode.start(
      { facingMode: "environment" }, // طلب الكاميرا الخلفية
      config,
      qrCodeSuccessCallback,
      (errorMessage) => {} // تجاهل رسائل الخطأ المستمرة
    ).catch(err => {
      console.warn("فشل تشغيل الكاميرا الخلفية، تجربة أي كاميرا متاحة", err);
      // المحاولة الثانية (احتياطية): طلب أي كاميرا يجدها المتصفح
      html5QrCode.start(
        undefined, // السماح للمكتبة باختيار الكاميرا الافتراضية
        config,
        qrCodeSuccessCallback,
        (errorMessage) => {}
      ).catch(err2 => {
        console.error("فشل تشغيل أي كاميرا", err2);
        onScanError(err2);
      });
    });

    // دالة التنظيف لإيقاف الكاميرا عند الخروج من الصفحة
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(err => console.error("فشل إيقاف الماسح الضوئي.", err));
      }
    };
  }, [onScanSuccess, onScanError]);

  return <div id="reader" ref={videoRef} style={{ width: '100%' }}></div>;
};

export default BarcodeScanner;