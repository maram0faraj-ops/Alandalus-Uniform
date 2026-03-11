import React, { useState, useRef, useEffect } from 'react';
import { Container, Form, Button, Row, Col, Alert, Card } from 'react-bootstrap';
import api from '../api'; 
import BarcodeScanner from '../components/BarcodeScanner';

function DeliverUniformPage() {
  const [barcode, setBarcode] = useState('');
  const [item, setItem] = useState(null);
  const [studentData, setStudentData] = useState({
    studentName: '',
    stage: 'ابتدائي بنات',
    grade: 'أول',
    section: 'أ',
    paymentType: 'مدفوع', 
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showScanner, setShowScanner] = useState(false);
  const barcodeInputRef = useRef(null);

  useEffect(() => {
    if (!showScanner && barcodeInputRef.current) {
        barcodeInputRef.current.focus();
    }
  }, [showScanner]);

  const handleBarcodeSearch = async (e) => {
    e.preventDefault();
    if (!barcode) return;
    setLoading(true);
    setError('');
    setSuccess('');
    setItem(null);
    try {
      const response = await api.get(`/api/delivery/item/${barcode.trim()}`);
      setItem(response.data);
    } catch (err) {
      setError(err.response?.data?.msg || 'الباركود غير صالح أو تم تسليمه مسبقاً');
    } finally {
      setLoading(false);
    }
  };

  const handleRecordDelivery = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setSuccess('');
    try {
      const payload = { ...studentData, barcode: barcode.trim() };
      await api.post('/api/delivery/record', payload);
      setSuccess('تم توثيق عملية التسليم بنجاح!');
      setBarcode('');
      setItem(null);
      setStudentData({ studentName: '', stage: 'ابتدائي بنات', grade: 'أول', section: 'أ', paymentType: 'مدفوع' });
    } catch (err) {
      setError(err.response?.data?.msg || 'حدث خطأ أثناء توثيق التسليم');
    } finally {
      setLoading(false);
    }
  };

  const handleStudentDataChange = (e) => {
    setStudentData({ ...studentData, [e.target.name]: e.target.value });
  };

  const handleScanSuccess = (decodedText) => {
    setBarcode(decodedText);
    setShowScanner(false);
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-md-center">
        <Col md={8}>
          <h2 className="text-center mb-4">تسليم الزي المدرسي</h2>

          {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
          {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
          
          {!item && ( 
            showScanner ? (
              <div className="mb-3 text-center">
                <BarcodeScanner onScanSuccess={handleScanSuccess} onScanError={() => setShowScanner(false)} />
                <Button variant="danger" className="mt-2 w-100" onClick={() => setShowScanner(false)}>إغلاق الكاميرا</Button>
              </div>
            ) : (
              <Form onSubmit={handleBarcodeSearch}>
                <Form.Group as={Row} className="mb-3 align-items-center">
                  <Form.Label column sm={3}>مسح الباركود</Form.Label>
                  <Col sm={9}>
                    <Form.Control type="text" ref={barcodeInputRef} value={barcode} onChange={(e) => setBarcode(e.target.value)} placeholder="أدخل أو امسح الباركود" />
                  </Col>
                </Form.Group>
                <div className="d-grid gap-2">
                  <Button type="submit" disabled={loading || !barcode}>{loading ? 'جاري البحث...' : 'بحث'}</Button>
                  <Button variant="secondary" onClick={() => setShowScanner(true)}>📸 مسح بالكاميرا</Button>
                </div>
              </Form>
            )
          )}

          {item && (
            <Card className="shadow-sm">
              <Card.Header as="h5" className="bg-primary text-white">تفاصيل القطعة</Card.Header>
              <Card.Body>
                <p><strong>الوصف:</strong> {item.uniform?.stage} - {item.uniform?.type}</p>
                <p><strong>المقاس:</strong> {item.uniform?.size}</p>
                <p><strong>الباركود:</strong> {item.barcode}</p>
                <hr />
                <Form onSubmit={handleRecordDelivery}>
                  <Form.Group className="mb-3">
                    <Form.Label>اسم الطالب</Form.Label>
                    <Form.Control type="text" name="studentName" value={studentData.studentName} onChange={handleStudentDataChange} required />
                  </Form.Group>
                  <Row>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>المرحلة</Form.Label>
                        <Form.Select name="stage" value={studentData.stage} onChange={handleStudentDataChange}>
                          {['رياض أطفال بنات', 'رياض أطفال بنين', 'ابتدائي بنات', 'ابتدائي بنين', 'متوسط', 'ثانوي'].map(s => <option key={s} value={s}>{s}</option>)}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>الصف</Form.Label>
                        <Form.Select name="grade" value={studentData.grade} onChange={handleStudentDataChange}>
                          {['أول', 'ثاني', 'ثالث', 'رابع', 'خامس', 'سادس', 'سابع', 'ثامن', 'تاسع', 'عاشر', 'حادي عشر', 'ثاني عشر'].map(g => <option key={g} value={g}>{g}</option>)}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col md={4}>
                      <Form.Group className="mb-3">
                        <Form.Label>نوع الدفع</Form.Label>
                        <Form.Select name="paymentType" value={studentData.paymentType} onChange={handleStudentDataChange}>
                          <option value="مدفوع">مدفوع</option>
                          <option value="مجاني">مجاني</option>
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                  <Button variant="success" type="submit" className="w-100" disabled={loading}>{loading ? 'جاري التوثيق...' : 'توثيق التسليم'}</Button>
                </Form>
              </Card.Body>
            </Card>
          )}
        </Col>
      </Row>
    </Container>
  );
}

export default DeliverUniformPage;