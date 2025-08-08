// src/pages/Reports.js
import React, { useState } from 'react';
import { Container, Form, Button, Row, Col, Spinner, Card } from 'react-bootstrap';
import api from '../api';

function Reports() {
  const [filters, setFilters] = useState({
    stage: '',
    grade: '',
    deliveryDate: ''
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      // إرسال طلب للـ API مع الفلاتر ونوع التصدير
      const response = await api.post('/api/reports/export',
        { ...filters, exportType: 'excel' },
        { responseType: 'blob' } // مهم جدًا لاستقبال الملفات
      );

      // كود لتحميل الملف في المتصفح
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'delivery_report.xlsx'); // اسم الملف
      document.body.appendChild(link);
      link.click();
      link.remove();

    } catch (error) {
      console.error('Failed to export report:', error);
      alert('حدث خطأ أثناء تصدير التقرير.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-4">
      <Card className="p-4 shadow-sm">
        <Card.Title as="h2" className="text-center mb-4">إنشاء تقرير التسليم</Card.Title>
        <Form>
          <Row className="mb-3">
            <Col md={4}>
              <Form.Group>
                <Form.Label>المرحلة الدراسية</Form.Label>
                <Form.Control as="select" name="stage" onChange={handleInputChange}>
                  <option value="">الكل</option>
                  <option value="ابتدائي">ابتدائي</option>
                  <option value="متوسط">متوسط</option>
                  <option value="ثانوي">ثانوي</option>
                </Form.Control>
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>الصف</Form.Label>
                <Form.Control type="text" name="grade" placeholder="مثال: الأول المتوسط" onChange={handleInputChange} />
              </Form.Group>
            </Col>
            <Col md={4}>
              <Form.Group>
                <Form.Label>تاريخ التسليم (من)</Form.Label>
                <Form.Control type="date" name="deliveryDate" onChange={handleInputChange} />
              </Form.Group>
            </Col>
          </Row>
          <div className="d-grid">
              <Button variant="success" size="lg" onClick={handleExport} disabled={loading}>
                {loading ? <Spinner as="span" size="sm" /> : 'تصدير إلى Excel'}
              </Button>
          </div>
        </Form>
      </Card>
    </Container>
  );
}

export default Reports;