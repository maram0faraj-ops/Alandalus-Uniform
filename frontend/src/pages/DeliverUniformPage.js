import React, { useState, useRef, useEffect } from 'react';
import { Container, Form, Button, Row, Col, Alert, Card, Spinner } from 'react-bootstrap';
import api from '../api';
import BarcodeScanner from '../components/BarcodeScanner'; // تأكد من أن هذا المسار صحيح

function DeliverUniformPage() {
  const [barcode, setBarcode] = useState('');
  const [item, setItem] = useState(null);
  const [studentData, setStudentData] = useState({
    studentName: '',
    stage: 'ابتدائي',
    grade: 'أول',
    section: 'أ',
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [showScanner, setShowScanner] = useState(false); // حالة للتحكم في ظهور الماسح
  const barcodeInputRef = useRef(null);

  // للتركيز على حقل الإدخال عند تحميل الصفحة
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
      const response = await api.get(`/api/delivery/item/${barcode}`);
      setItem(response.data);
    } catch (err) {
      setError(err.response?.data?.msg || 'حدث خطأ أثناء البحث عن الباركود');
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
      const payload = { ...studentData, barcode };
      const response = await api.post('/api/delivery/record', payload);
      setSuccess(response.data.msg);
      // إعادة تعيين الحالة بعد النجاح
      setBarcode('');
      setItem(null);
      setStudentData({ studentName: '', stage: 'ابتدائي', grade: 'أول', section: 'أ' });
    } catch (err) {
      setError(err.response?.data?.msg || 'حدث خطأ أثناء توثيق التسليم');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (e) => {
    setStudentData({ ...studentData, [e.target.name]: e.target.value });
  };
  
  // دالة ليتم استدعاؤها عند نجاح المسح
  const handleScanSuccess = (decodedText) => {
    setBarcode(decodedText);
    setShowScanner(false);
    // يمكنك إضافة بحث تلقائي هنا إذا أردت
    // document.getElementById('search-button').click(); 
  };

  // دالة ليتم استدعاؤها عند فشل المسح
  const handleScanError = (errorMessage) => {
    console.error(errorMessage);
    setShowScanner(false);
    setError('فشل مسح الباركود، يرجى المحاولة مرة أخرى أو إدخاله يدوياً.');
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-md-center">
        <Col md={8}>
          <h2 className="text-center mb-4">تسليم الزي المدرسي</h2>

          {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
          {success && <Alert variant="success" onClose={() => setSuccess('')} dismissible>{success}</Alert>}
          
          {showScanner ? (
            <div className="mb-3 text-center">
              <div style={{ maxWidth: '400px', margin: 'auto' }}>
                <BarcodeScanner 
                  onScanSuccess={handleScanSuccess}
                  onScanError={handleScanError}
                />
              </div>
              <Button variant="danger" className="mt-2 w-100" style={{ maxWidth: '400px' }} onClick={() => setShowScanner(false)}>
                إغلاق الكاميرا
              </Button>
            </div>
          ) : (
            <Form onSubmit={handleBarcodeSearch}>
              <Form.Group as={Row} className="mb-3 align-items-center">
                <Form.Label column sm={3} className="text-end">مسح الباركود</Form.Label>
                <Col sm={9}>
                  <Form.Control
                    type="text"
                    ref={barcodeInputRef}
                    value={barcode}
                    onChange={(e) => setBarcode(e.target.value)}
                    placeholder="أدخل أو امسح الباركود هنا"
                  />
                </Col>
              </Form.Group>
              <div className="d-grid gap-2 mb-4">
                <Button id="search-button" type="submit" disabled={loading || !barcode}>
                  {loading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : 'بحث'}
                </Button>
                <Button variant="secondary" onClick={() => setShowScanner(true)}>
                  📸 مسح بالكاميرا
                </Button>
              </div>
            </Form>
          )}

          {item && (
            <Card>
              <Card.Header as="h5">تفاصيل القطعة</Card.Header>
              <Card.Body>
                <p><strong>الوصف:</strong> {item.uniform?.stage} - {item.uniform?.type}</p>
                <p><strong>المقاس:</strong> {item.uniform?.size}</p>
                <p><strong>الباركود:</strong> {item.barcode}</p>
                <hr />
                <h4 className="mb-3">بيانات الطالب المستلم</h4>
                <Form onSubmit={handleRecordDelivery}>
                  <Form.Group className="mb-3">
                    <Form.Label>اسم الطالب</Form.Label>
                    <Form.Control type="text" name="studentName" value={studentData.studentName} onChange={handleChange} required />
                  </Form.Group>
                  <Row>
                    <Col>
                      <Form.Group className="mb-3">
                        <Form.Label>المرحلة</Form.Label>
                        <Form.Select name="stage" value={studentData.stage} onChange={handleChange}>
                          {['رياض أطفال بنات', 'رياض أطفال بنين', 'طفولة مبكرة بنات', 'طفولة مبكرة بنين', 'ابتدائي', 'متوسط', 'ثانوي'].map(s => <option key={s} value={s}>{s}</option>)}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col>
                      <Form.Group className="mb-3">
                        <Form.Label>الصف</Form.Label>
                        <Form.Select name="grade" value={studentData.grade} onChange={handleChange}>
                           {['أول', 'ثاني', 'ثالث', 'رابع', 'خامس', 'سادس'].map(g => <option key={g} value={g}>{g}</option>)}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                    <Col>
                      <Form.Group className="mb-3">
                        <Form.Label>الشعبة</Form.Label>
                        <Form.Select name="section" value={studentData.section} onChange={handleChange}>
                          {['أ', 'ب', 'ج', 'د', 'هـ'].map(s => <option key={s} value={s}>{s}</option>)}
                        </Form.Select>
                      </Form.Group>
                    </Col>
                  </Row>
                  <div className="d-grid">
                    <Button variant="success" type="submit" disabled={loading}>
                      {loading ? <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> : 'توثيق التسليم'}
                    </Button>
                  </div>
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