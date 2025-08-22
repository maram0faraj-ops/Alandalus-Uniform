import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const BarcodeScanner = ({ onScanSuccess, onScanError }) => {
  const videoRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    if (!html5QrCodeRef.current) {
      html5QrCodeRef.current = new Html5Qrcode(videoRef.current.id);
    }
    const html5QrCode = html5QrCodeRef.current;

    const qrCodeSuccessCallback = (decodedText, decodedResult) => {
      onScanSuccess(decodedText);
    };

    const config = {
      fps: 10, // العودة إلى 10 لمزيد من التوافق
      qrbox: (viewfinderWidth, viewfinderHeight) => {
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
        const qrboxSize = Math.floor(minEdge * 0.7);
        return { width: qrboxSize, height: qrboxSize };
      },
      rememberLastUsedCamera: true,
      supportedScanTypes: ["CODE_128"] // التركيز على نوع الباركود المستخدم فقط
    };

    // --- منطق جديد لتشغيل الكاميرا مع خيارات احتياطية ---

    // المحاولة الأولى: طلب دقة عالية وكاميرا خلفية
    const idealVideoConstraints = {
      width: { ideal: 1280 },
      height: { ideal: 720 },
      facingMode: "environment"
    };

    html5QrCode.start(
      idealVideoConstraints,
      config,
      qrCodeSuccessCallback,
      (errorMessage) => { /* تجاهل */ }
    ).catch((err) => {
      console.warn("فشل تشغيل الكاميرا بالدقة العالية، المحاولة الثانية:", err);
      
      // المحاولة الثانية: طلب الكاميرا الخلفية فقط (مثل الكود القديم)
      html5QrCode.start(
        { facingMode: { exact: "environment" } },
        config,
        qrCodeSuccessCallback,
        (errorMessage) => { /* تجاهل */ }
      ).catch((err2) => {
        console.error("فشل تشغيل الكاميرا الخلفية، المحاولة الأخيرة:", err2);
        
        // المحاولة الأخيرة: طلب أي كاميرا متاحة
        html5QrCode.start(
          undefined, // السماح للمكتبة باختيار الكاميرا
          config,
          qrCodeSuccessCallback,
          (errorMessage) => { /* تجاهل */ }
        ).catch((err3) => {
          console.error("فشل تشغيل أي كاميرا متاحة.", err3);
          onScanError(err3);
        });
      });
    });

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(err => console.error("فشل إيقاف الماسح الضوئي.", err));
      }
    };
  }, [onScanSuccess, onScanError]);

  return <div id="reader" ref={videoRef} style={{ width: '100%' }}></div>;
};

export default BarcodeScanner;