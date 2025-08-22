import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const BarcodeScanner = ({ onScanSuccess, onScanError }) => {
  const videoRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    // التأكد من عدم وجود نسخة قديمة تعمل
    if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
      html5QrCodeRef.current.stop();
    }
    
    const html5QrCode = new Html5Qrcode(videoRef.current.id);
    html5QrCodeRef.current = html5QrCode;

    const qrCodeSuccessCallback = (decodedText, decodedResult) => {
      onScanSuccess(decodedText);
    };

    // --- تم تعديل كائن الإعدادات هنا ---
    const config = {
      fps: 10,
      qrbox: (viewfinderWidth, viewfinderHeight) => {
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
        const qrboxSize = Math.floor(minEdge * 0.7);
        return { width: qrboxSize, height: qrboxSize };
      },
      rememberLastUsedCamera: true,
      supportedScanTypes: ["CODE_128"],
      // تم دمج إعدادات الفيديو هنا بالطريقة الصحيحة
      videoConstraints: {
        width: { ideal: 1280 },
        height: { ideal: 720 },
        facingMode: "environment" // الأفضلية للكاميرا الخلفية
      }
    };

    // --- تم تعديل منطق تشغيل الكاميرا ---
    html5QrCode.start(
      undefined, // يتم تمرير undefined للسماح للمكتبة باستخدام videoConstraints من الـ config
      config,
      qrCodeSuccessCallback,
      (errorMessage) => { /* تجاهل */ }
    ).catch((err) => {
      console.warn("فشل تشغيل الكاميرا بالإعدادات المثالية، تجربة الإعدادات الأساسية:", err);
      
      // إعدادات احتياطية بدون دقة محددة
      const fallbackConfig = { ...config };
      delete fallbackConfig.videoConstraints; // حذف إعدادات الدقة العالية

      html5QrCode.start(
        { facingMode: "environment" }, // طلب الكاميرا الخلفية فقط
        fallbackConfig,
        qrCodeSuccessCallback,
        (errorMessage) => { /* تجاهل */ }
      ).catch((err2) => {
        console.error("فشل تشغيل الكاميرا الخلفية، تجربة أي كاميرا:", err2);
        // المحاولة الأخيرة: طلب أي كاميرا متاحة
        html5QrCode.start(
          undefined,
          fallbackConfig,
          qrCodeSuccessCallback,
          (errorMessage) => { /* تجاهل */ }
        ).catch((err3) => {
          console.error("فشل تشغيل أي كاميرا.", err3);
          onScanError(err3);
        });
      });
    });

    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(err => console.error("فشل إيقاف الماسح الضوئي.", err));
      }
    };
  }, [onScanSuccess, onScanError]);

  return <div id="reader" ref={videoRef} style={{ width: '100%' }}></div>;
};

export default BarcodeScanner;