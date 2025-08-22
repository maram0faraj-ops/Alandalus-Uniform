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
      fps: 15, // <-- زيادة عدد الإطارات في الثانية بشكل طفيف
      qrbox: (viewfinderWidth, viewfinderHeight) => {
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
        const qrboxSize = Math.floor(minEdge * 0.7);
        return {
          width: qrboxSize,
          height: qrboxSize,
        };
      },
      rememberLastUsedCamera: true,
      supportedScanTypes: ["CODE_128", "CODE_39", "EAN_13"]
    };

    // --- التحسين الرئيسي: تحديد دقة الفيديو ---
    const videoConstraints = {
      width: { ideal: 1280 }, // طلب عرض مثالي 1280px
      height: { ideal: 720 },  // طلب ارتفاع مثالي 720px
      facingMode: "environment" // الأفضلية للكاميرا الخلفية
    };

    html5QrCode.start(
      videoConstraints, // <-- استخدام إعدادات الدقة الجديدة
      config,
      qrCodeSuccessCallback,
      (errorMessage) => { /* تجاهل الأخطاء البسيطة */ }
    ).catch((err) => {
      console.error("Failed to start camera with ideal constraints, trying default", err);
      // في حال فشل الدقة العالية، جرب الإعدادات الافتراضية
      html5QrCode.start(
        { facingMode: "environment" },
        config,
        qrCodeSuccessCallback,
        (errorMessage) => {}
      ).catch(onScanError);
    });

    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(err => console.error("Failed to stop scanner.", err));
      }
    };
  }, [onScanSuccess, onScanError]);

  return <div id="reader" ref={videoRef} style={{ width: '100%' }}></div>;
};

export default BarcodeScanner;