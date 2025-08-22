import React, { useEffect, useRef } from 'react';
import { Html5Qrcode } from 'html5-qrcode';

const BarcodeScanner = ({ onScanSuccess, onScanError }) => {
  const videoRef = useRef(null);
  const html5QrCodeRef = useRef(null);

  useEffect(() => {
    const qrCodeSuccessCallback = (decodedText, decodedResult) => {
      onScanSuccess(decodedText);
    };

    // --- الإعدادات الأساسية ---
    const baseConfig = {
      fps: 10,
      qrbox: (viewfinderWidth, viewfinderHeight) => {
        const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
        return { width: minEdge * 0.7, height: minEdge * 0.7 };
      },
      rememberLastUsedCamera: true,
      supportedScanTypes: ["CODE_128"]
    };

    // --- إعدادات الدقة العالية ---
    const highResConfig = {
      ...baseConfig,
      videoConstraints: {
        width: { ideal: 1280 },
        height: { ideal: 720 }
      }
    };

    const startScanner = () => {
      const html5QrCode = new Html5Qrcode(videoRef.current.id);
      html5QrCodeRef.current = html5QrCode;

      // المحاولة الأولى: كاميرا خلفية بدقة عالية
      html5QrCode.start(
        { facingMode: 'environment' },
        highResConfig,
        qrCodeSuccessCallback,
        (errorMessage) => {}
      ).catch(err1 => {
        console.warn("فشل الدقة العالية، تجربة الكاميرا الخلفية العادية", err1);
        // المحاولة الثانية: كاميرا خلفية فقط (بدون دقة محددة)
        html5QrCode.start(
          { facingMode: 'environment' },
          baseConfig,
          qrCodeSuccessCallback,
          (errorMessage) => {}
        ).catch(err2 => {
          console.warn("فشل الكاميرا الخلفية، تجربة أي كاميرا متاحة", err2);
          // المحاولة الأخيرة: أي كاميرا متاحة
          html5QrCode.start(
            undefined, // السماح للمكتبة باختيار الكاميرا
            baseConfig,
            qrCodeSuccessCallback,
            (errorMessage) => {}
          ).catch(err3 => {
            console.error("فشل تشغيل جميع الكاميرات", err3);
            onScanError(err3);
          });
        });
      });
    };

    startScanner();

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