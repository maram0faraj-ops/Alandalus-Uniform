import React, { useState } from 'react';
import { Container, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import api from '../api';

function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await api.post('/api/auth/login', formData);
      
      // حفظ التوكن وبيانات المستخدم (بما في ذلك الدور)
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));

      alert('تم تسجيل الدخول بنجاح!');
      
      // توجيه المستخدم بناءً على دوره
      const userRole = response.data.user.role;
      if (userRole === 'admin') {
        window.location.href = '/admin/dashboard';
      } else if (userRole === 'staff') {
        window.location.href = '/staff/deliver';
      } else {
        // لاحقاً سنوجه ولي الأمر إلى صفحته الخاصة
        window.location.href = '/'; 
      }

    } catch (err) {
      const errorMsg = err.response?.data?.msg || 'حدث خطأ ما، يرجى المحاولة مرة أخرى';
      setError(errorMsg);
    }
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-md-center">
        <Col md={6}>
          <h2 className="text-center mb-4">تسجيل الدخول</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>البريد الإلكتروني</Form.Label>
              <Form.Control type="email" name="email" value={formData.email} onChange={handleChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>كلمة المرور</Form.Label>
              <Form.Control type="password" name="password" value={formData.password} onChange={handleChange} required />
            </Form.Group>
            <div className="d-grid">
              <Button variant="primary" type="submit">دخول</Button>
            </div>
          </Form>
          <p className="mt-3 text-center">
            ليس لديك حساب؟ <Link to="/register">أنشئ حساباً جديداً</Link>
          </p>
        </Col>
      </Row>
    </Container>
  );
}

export default LoginPage;
