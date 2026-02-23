import React, { useState } from 'react';
import { Container, Row, Col, Card, Form, Button, Alert, Spinner } from 'react-bootstrap';
import { useNavigate } from 'react-router-dom';
import api from '../api'; 

function LoginPage({ setAuth }) { 
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
      // إرسال طلب الدخول
      const res = await api.post('/api/auth/login', formData);
      
      // 1. تخزين التوكن والدور في المتصفح
      localStorage.setItem('token', res.data.token);
      localStorage.setItem('role', res.data.role); // مفيد للتحقق لاحقاً

      // 2. تحديث حالة الدخول في التطبيق
      if (setAuth) {
          setAuth(true);
      }
      
      // 3. التوجيه الذكي حسب الصلاحية (هذا هو الحل لمشكلتك)
      const userRole = res.data.role;
      
      if (userRole === 'admin') {
          console.log("Redirecting to Admin Dashboard...");
          navigate('/admin/dashboard'); // نقل الأدمن للوحة التحكم
      } else if (userRole === 'staff') {
          navigate('/delivery'); // نقل الموظفين لصفحة التسليم
      } else {
          navigate('/'); // الصفحة الافتراضية للبقية
      }

    } catch (err) {
      console.error("Login Error:", err);
      const backendMsg = err.response?.data?.msg || 'فشل تسجيل الدخول. تأكد من البيانات.';
      setError(backendMsg);
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
                {/* تأكد من وجود صورة logo.png في مجلد public */}
                <img 
                    src="/logo.png" 
                    alt="شعار المدرسة" 
                    className="login-logo" 
                    onError={(e) => { e.target.style.display = 'none'; }} 
                />
                <h4 className="mb-0 fw-bold mt-2">نظام الزي المدرسي</h4>
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
                      placeholder="admin@alandalus.com" 
                      name="email"
                      value={email}
                      onChange={onChange}
                      required
                      autoFocus
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