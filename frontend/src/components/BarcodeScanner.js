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

    // --- منطق جديد ومحسن لتشغيل الكاميرا ---

    // المحاولة الأولى (الصارمة): طلب الكاميرا الخلفية بشكل إلزامي
    html5QrCode.start(
      { facingMode: { exact: "environment" } },
      config,
      qrCodeSuccessCallback,
      (errorMessage) => {}
    ).catch(err1 => {
      console.warn("الطلب الصارم للكاميرا الخلفية فشل، تجربة الطلب العادي", err1);

      // المحاولة الثانية (التفضيلية): طلب الكاميرا الخلفية كتفضيل
      html5QrCode.start(
        { facingMode: "environment" },
        config,
        qrCodeSuccessCallback,
        (errorMessage) => {}
      ).catch(err2 => {
        console.warn("الطلب العادي للكاميرا الخلفية فشل، تجربة أي كاميرا", err2);

        // المحاولة الأخيرة (الاحتياطية): طلب أي كاميرا متاحة
        html5QrCode.start(
          undefined,
          config,
          qrCodeSuccessCallback,
          (errorMessage) => {}
        ).catch(err3 => {
          console.error("فشل تشغيل جميع الكاميرات", err3);
          onScanError(err3);
        });
      });
    });

    // دالة التنظيف
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(err => console.error("فشل إيقاف الماسح الضوئي.", err));
      }
    };
  }, [onScanSuccess, onScanError]);

  return <div id="reader" ref={videoRef} style={{ width: '100%' }}></div>;
};

export default BarcodeScanner;