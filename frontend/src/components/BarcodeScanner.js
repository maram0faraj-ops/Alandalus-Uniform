import React, { useEffect, useRef, useState } from 'react';
import { Html5Qrcode } from 'html5-qrcode';
import { Form } from 'react-bootstrap'; // <-- استيراد Form

const BarcodeScanner = ({ onScanSuccess, onScanError }) => {
  const videoRef = useRef(null);
  const html5QrCodeRef = useRef(null);
  
  // --- حالات جديدة لإدارة الكاميرات ---
  const [cameras, setCameras] = useState([]);
  const [selectedCameraId, setSelectedCameraId] = useState('');

  // 1. جلب قائمة الكاميرات المتاحة في الجهاز
  useEffect(() => {
    Html5Qrcode.getCameras().then(devices => {
      if (devices && devices.length) {
        setCameras(devices);
        // محاولة اختيار الكاميرا الخلفية كخيار افتراضي
        const rearCamera = devices.find(device => device.label.toLowerCase().includes('back'));
        if (rearCamera) {
          setSelectedCameraId(rearCamera.id);
        } else {
          // إذا لم يتم العثور على كاميرا خلفية، اختر أول كاميرا في القائمة
          setSelectedCameraId(devices[0].id);
        }
      }
    }).catch(err => {
      console.error("Failed to get cameras.", err);
      onScanError(err);
    });
  }, [onScanError]);

  // 2. تشغيل الكاميرا عند اختيار كاميرا من القائمة
  useEffect(() => {
    if (!selectedCameraId) {
      return;
    }

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

    // إيقاف أي ماسح ضوئي قديم قبل تشغيل واحد جديد
    if (html5QrCode.isScanning) {
      html5QrCode.stop();
    }

    html5QrCode.start(
      selectedCameraId, // <-- استخدام الكاميرا المحددة
      config,
      qrCodeSuccessCallback,
      (errorMessage) => {}
    ).catch(err => {
      console.error(`Failed to start camera with id ${selectedCameraId}`, err);
      onScanError(err);
    });

    // دالة التنظيف
    return () => {
      if (html5QrCodeRef.current && html5QrCodeRef.current.isScanning) {
        html5QrCodeRef.current.stop().catch(err => console.error("Failed to stop scanner.", err));
      }
    };
  }, [selectedCameraId, onScanSuccess, onScanError]);

  return (
    <div>
      {/* --- قائمة منسدلة جديدة لاختيار الكاميرا --- */}
      {cameras.length > 1 && (
        <Form.Group className="mb-3">
          <Form.Label>اختر الكاميرا</Form.Label>
          <Form.Select 
            value={selectedCameraId} 
            onChange={e => setSelectedCameraId(e.target.value)}
          >
            {cameras.map(camera => (
              <option key={camera.id} value={camera.id}>
                {camera.label}
              </option>
            ))}
          </Form.Select>
        </Form.Group>
      )}
      <div id="reader" ref={videoRef} style={{ width: '100%' }}></div>
    </div>
  );
};

export default BarcodeScanner;