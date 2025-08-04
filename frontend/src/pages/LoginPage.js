import React, { useState } from 'react';
import { Container, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import api from '../api'; // التأكد من استخدام الملف المركزي

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
      localStorage.setItem('token', response.data.token);
      alert('تم تسجيل الدخول بنجاح!');
      window.location.href = '/admin/dashboard';
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
        </Col>
      </Row>

      {/* ====================================================== */}
      {/* ## صندوق معلومات التشخيص ## */}
      {/* ====================================================== */}
      <Row className="justify-content-md-center mt-4">
        <Col md={6}>
          <Alert variant="info">
            <p className="mb-0" style={{ direction: 'ltr', textAlign: 'left', wordWrap: 'break-word' }}>
              <strong>Debugging Info:</strong><br />
              API URL: {process.env.REACT_APP_API_URL || 'Not Set - Using http://localhost:5000'}
            </p>
          </Alert>
        </Col>
      </Row>
    </Container>
  );
}

export default LoginPage;
