import React, { useState } from 'react';
import { Container, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import axios from 'axios';

function LoginPage() {
  //  لإدارة البيانات التي يدخلها المستخدم useState استخدام
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState(''); // لعرض رسائل الخطأ

  // هذه الدالة تعمل عند تغيير أي حقل في النموذج
  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError(''); // إخفاء الخطأ عند البدء في الكتابة
  };

  // هذه الدالة تعمل عند الضغط على زر "دخول"
  const handleSubmit = async (e) => {
    e.preventDefault(); // منع التحديث التلقائي للصفحة

    try {
      // إرسال طلب إلى الخادم باستخدام مكتبة axios
      const response = await axios.post('http://localhost:5000/api/auth/login', {
        email: formData.email,
        password: formData.password,
      });

      // حفظ التوكن في التخزين المحلي للمتصفح
      localStorage.setItem('token', response.data.token);

      alert('تم تسجيل الدخول بنجاح!');
      
      // إعادة توجيه المستخدم إلى لوحة التحكم
      window.location.href = '/admin/dashboard';

    } catch (err) {
      // في حال حدوث خطأ
      const errorMsg = err.response?.data?.msg || 'حدث خطأ ما، يرجى المحاولة مرة أخرى';
      setError(errorMsg);
      console.error('خطأ في تسجيل الدخول:', errorMsg);
    }
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-md-center">
        <Col md={6}>
          <h2 className="text-center mb-4">تسجيل الدخول</h2>
          {/* عرض رسالة الخطأ إذا وجدت */}
          {error && <Alert variant="danger">{error}</Alert>}

          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3" controlId="formBasicEmail">
              <Form.Label>البريد الإلكتروني</Form.Label>
              <Form.Control
                type="email"
                name="email"
                placeholder="ادخل البريد الإلكتروني"
                value={formData.email}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <Form.Group className="mb-3" controlId="formBasicPassword">
              <Form.Label>كلمة المرور</Form.Label>
              <Form.Control
                type="password"
                name="password"
                placeholder="كلمة المرور"
                value={formData.password}
                onChange={handleChange}
                required
              />
            </Form.Group>

            <div className="d-grid">
              <Button variant="primary" type="submit">
                دخول
              </Button>
            </div>
          </Form>
        </Col>
      </Row>
    </Container>
  );
}

export default LoginPage;