import React, { useState } from 'react';
import { Container, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import logo from '../assets/images/logo1.png';

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
      
      localStorage.setItem('token', response.data.token);
      localStorage.setItem('user', JSON.stringify(response.data.user));
      
      const userRole = response.data.user.role;

      // Conditional redirection based on the user's role
      if (userRole === 'admin') {
        navigate('/admin/dashboard');
      } else if (userRole === 'staff') { // ✅ **Correction Made Here**
        navigate('/staff/deliver');
      } else if (userRole === 'parent') {
        // Example: Redirect parents to a specific dashboard
        navigate('/admin/dashboard'); // Or a future parent dashboard
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
          <div className="text-center mb-4">
            <img src={logo} alt="Al Andalus Schools Logo" style={{ width: '150px' }} />
          </div>

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