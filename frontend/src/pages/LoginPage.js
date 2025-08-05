import React, { useState } from 'react';
import { Container, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';

// Professional solution for handling login and redirection
function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    setError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');

    try {
      const response = await api.post('/api/auth/login', formData);
      
      // Store user data and token in localStorage
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      const userRole = response.data.user.role;

      // Navigate based on user role
      if (userRole === 'admin' || userRole === 'parent') {
        navigate('/admin/dashboard');
      } else if (userRole === 'user') {
        navigate('/staff/deliver');
      } else {
        // Fallback for any other roles
        navigate('/'); 
      }

    } catch (err) {
      const errorMsg = err.response?.data?.msg || 'فشل تسجيل الدخول. يرجى التحقق من البيانات.';
      setError(errorMsg);
      setLoading(false);
    }
  };

  return (
    <Container className="mt-5">
      <Row className="justify-content-md-center">
        <Col md={6}>
          <h2 className="text-center mb-4">تسجيل الدخول للنظام</h2>
          {error && <Alert variant="danger">{error}</Alert>}
          <Form onSubmit={handleSubmit}>
            <Form.Group className="mb-3">
              <Form.Label>البريد الإلكتروني</Form.Label>
              <Form.Control 
                type="email" 
                name="email" 
                value={formData.email} 
                onChange={handleChange} 
                required 
                placeholder="ادخل البريد الإلكتروني"
              />
            </Form.Group>
            <Form.Group className="mb-3">
              <Form.Label>كلمة المرور</Form.Label>
              <Form.Control 
                type="password" 
                name="password" 
                value={formData.password} 
                onChange={handleChange} 
                required 
                placeholder="كلمة المرور"
              />
            </Form.Group>
            <div className="d-grid">
              <Button variant="primary" type="submit" disabled={loading}>
                {loading ? 'جاري الدخول...' : 'دخول'}
              </Button>
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
