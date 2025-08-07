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

    // إعدادات محسّنة للجوال
    const config = {
      fps: 10, // عدد الإطارات في الثانية
      qrbox: (viewfinderWidth, viewfinderHeight) => {
        // تحديد حجم مربع البحث ليكون أصغر وأكثر تركيزاً
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
        const qrboxSize = Math.floor(minEdge * 0.7); // استخدام 70% من أصغر بعد
        return {
          width: qrboxSize,
          height: qrboxSize,
        };
      },
      rememberLastUsedCamera: true, // تذكر آخر كاميرا تم استخدامها
      supportedScanTypes: [ // تحديد أنواع الباركود لزيادة سرعة البحث
        "CODE_128",
        "CODE_39",
        "EAN_13",
        "EAN_8",
        "UPC_A",
        "UPC_E"
      ]
    };

    // طلب تشغيل الكاميرا الخلفية "environment"
    html5QrCode.start(
      { facingMode: { exact: "environment" } },
      config,
      qrCodeSuccessCallback,
      (errorMessage) => {
        // هذه الدالة تُستدعى لكل إطار لا يتم فيه العثور على باركود
        // يمكننا تجاهلها لتبقى الكاميرا مفتوحة
      }
    ).catch((err) => {
      console.error("Failed to start rear camera, trying any available camera", err);
      // إذا فشلت الكاميرا الخلفية، جرب أي كاميرا متاحة
      html5QrCode.start(
        undefined, // السماح للمكتبة باختيار الكاميرا
        config,
        qrCodeSuccessCallback,
        (errorMessage) => {}
      ).catch(onScanError);
    });

    // دالة التنظيف لإيقاف الكاميرا
    return () => {
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(err => console.error("Failed to stop scanner on cleanup.", err));
      }
    };
  }, [onScanSuccess, onScanError]);

  return <div id="reader" ref={videoRef} style={{ width: '100%' }}></div>;
};

export default BarcodeScanner;