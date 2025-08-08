// src/pages/Reports.js
import React, { useState } from 'react';
import { Container, Form, Button, Row, Col, Spinner, Card } from 'react-bootstrap';
import api from '../api';

function Reports() {
  const [filters, setFilters] = useState({
    stage: '',
    grade: '',
    section: '', // <-- إضافة حقل الشعبة الجديد
    deliveryDate: ''
  });
  const [loading, setLoading] = useState(false);

  const handleInputChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  const handleExport = async () => {
    setLoading(true);
    try {
      const response = await api.post('/api/reports/export',
        { ...filters, exportType: 'excel' },
        { responseType: 'blob' }
      );

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'delivery_report.xlsx');
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
            {/* تم تحديث الأعمدة لتصبح 4 أعمدة */}
            <Col md={3}>
              <Form.Group>
                <Form.Label>المرحلة الدراسية</Form.Label>
                <Form.Control as="select" name="stage" onChange={handleInputChange}>
                  <option value="">الكل</option>
                  <option value="رياض أطفال">رياض أطفال</option>
                  <option value="طفولة مبكرة">طفولة مبكرة</option>
                  <option value="ابتدائي">ابتدائي</option>
                  <option value="متوسط">متوسط</option>
                  <option value="ثانوي">ثانوي</option>
                </Form.Control>
              </Form.Group>
            </Col>

            <Col md={3}>
              <Form.Group>
                <Form.Label>الصف</Form.Label>
                {/* تم تحويل حقل الصف إلى قائمة منسدلة */}
                <Form.Control as="select" name="grade" onChange={handleInputChange}>
                    <option value="">الكل</option>
                    <option value="الأول">الأول</option>
                    <option value="الثاني">الثاني</option>
                    <option value="الثالث">الثالث</option>
                    <option value="الرابع">الرابع</option>
                    <option value="الخامس">الخامس</option>
                    <option value="السادس">السادس</option>
                </Form.Control>
              </Form.Group>
            </Col>

            {/* تم إضافة حقل الشعبة */}
            <Col md={3}>
              <Form.Group>
                <Form.Label>الشعبة</Form.Label>
                <Form.Control as="select" name="section" onChange={handleInputChange}>
                    <option value="">الكل</option>
                    <option value="أ">أ</option>
                    <option value="ب">ب</option>
                    <option value="ج">ج</option>
                    <option value="د">د</option>
                    <option value="هـ">هـ</option>
                </Form.Control>
              </Form.Group>
            </Col>

            <Col md={3}>
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