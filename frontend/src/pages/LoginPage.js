import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom'; // افترض أنك تستخدم react-router
import api from '../api'; // افترض أن لديك هذا الملف للاتصال بالسيرفر

function LoginPage({ setAuth }) { // setAuth هي دالة لتحديث حالة تسجيل الدخول في App.js
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const { email, password } = formData;

  const onChange = e => setFormData({ ...formData, [e.target.name]: e.target.value });

  const onSubmit = async e => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      // استبدل هذا المسار بمسار تسجيل الدخول الخاص بك في السيرفر
      // const res = await api.post('/api/auth/login', formData);
      
      // محاكاة تسجيل دخول ناجح (لغرض العرض فقط، قم بتفعيل السطر أعلاه في الواقع)
      console.log("Logging in...");
      // localStorage.setItem('token', res.data.token);
      // setAuth(true);
      // navigate('/dashboard'); // التوجيه إلى لوحة التحكم

    } catch (err) {
      setError('البريد الإلكتروني أو كلمة المرور غير صحيحة');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login-background">
      <Container>
        <Row className="justify-content-center">
          <Col md={6} lg={5} xl={4}>
            <Card className="login-card">
              <div className="login-header">
                {/* ضع مسار شعار المدرسة هنا */}
                <img src="/logo.png" alt="School Logo" className="login-logo" onError={(e) => e.target.style.display='none'} />
                <h4 className="mb-0 fw-bold">نظام الزي المدرسي</h4>
                <small>مدارس الأندلس الأهلية</small>
              </div>
              <Card.Body className="p-4">
                <h5 className="text-center text-muted mb-4">تسجيل الدخول</h5>
                
                {error && <Alert variant="danger" className="text-center">{error}</Alert>}
                
                <Form onSubmit={onSubmit}>
                  <Form.Group className="mb-3" controlId="formBasicEmail">
                    <Form.Label className="fw-bold text-secondary">البريد الإلكتروني</Form.Label>
                    <Form.Control 
                      type="email" 
                      placeholder="name@alandalus.edu.sa" 
                      name="email"
                      value={email}
                      onChange={onChange}
                      required
                    />
                  </Form.Group>

                  <Form.Group className="mb-4" controlId="formBasicPassword">
                    <Form.Label className="fw-bold text-secondary">كلمة المرور</Form.Label>
                    <Form.Control 
                      type="password" 
                      placeholder="********" 
                      name="password"
                      value={password}
                      onChange={onChange}
                      required
                    />
                  </Form.Group>

                  <div className="d-grid gap-2">
                    <Button variant="primary" size="lg" type="submit" disabled={loading}>
                      {loading ? <Spinner as="span" animation="border" size="sm" /> : 'دخول النظام'}
                    </Button>
                  </div>
                </Form>
              </Card.Body>
              <Card.Footer className="text-center bg-light py-3 border-0">
                <small className="text-muted">جميع الحقوق محفوظة © 2026 مدارس الأندلس</small>
              </Card.Footer>
            </Card>
          </Col>
        </Row>
      </Container>
    </div>
  );
}

export default LoginPage;