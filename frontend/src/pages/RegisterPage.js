import React, { useState } from 'react';
import { Container, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

function RegisterPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phoneNumber: '',
    password: '',
    password2: '',
  });
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const navigate = useNavigate();

  const { name, email, phoneNumber, password, password2 } = formData;

  const handleChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setSuccess('');

    if (password !== password2) {
      return setError('كلمتا المرور غير متطابقتين');
    }

    try {
      const response = await api.post('/api/auth/register', { name, email, password, phoneNumber });
      setSuccess(response.data.msg + '. سيتم توجيهك لصفحة الدخول.');
      
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (err) {
      setError(err.response?.data?.msg || 'حدث خطأ ما، يرجى المحاولة مرة أخرى');
    }
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-md-center">
        <Col md={6}>
          <h2 className="text-center mb-4">إنشاء حساب ولي أمر جديد</h2>
          {success && <Alert variant="success">{success}</Alert>}
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>الاسم الكامل</Form.Label>
              <Form.Control type="text" name="name" value={name} onChange={handleChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>البريد الإلكتروني</Form.Label>
              <Form.Control type="email" name="email" value={email} onChange={handleChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>رقم الجوال</Form.Label>
              <Form.Control type="text" name="phoneNumber" value={phoneNumber} onChange={handleChange} required />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>كلمة المرور</Form.Label>
              <Form.Control type="password" name="password" value={password} onChange={handleChange} required minLength="6" />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>تأكيد كلمة المرور</Form.Label>
              <Form.Control type="password" name="password2" value={password2} onChange={handleChange} required minLength="6" />
            </Form.Group>
            <div className="d-grid">
              <Button variant="primary" type="submit">
                إنشاء الحساب
              </Button>
            </div>
          </Form>
          <p className="mt-3 text-center">
            لديك حساب بالفعل؟ <Link to="/login">سجل الدخول من هنا</Link>
          </p>
        </Col>
      </Row>
    </Container>
  );
}

export default RegisterPage;
