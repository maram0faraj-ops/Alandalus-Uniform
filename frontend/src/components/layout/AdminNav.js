import React, { useState, useEffect } from 'react';
import { Navbar, Nav, Container } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
// استبدل new-logo-name.png بالاسم الجديد الفعلي الذي اخترته للشعار الثاني

function AdminNav() {
  const [user, setUser] = useState(null);
  const navigate = useNavigate();

  useEffect(() => {
    const userData = localStorage.getItem('user');
    if (userData) {
      setUser(JSON.parse(userData));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user'); // حذف بيانات المستخدم أيضاً
    navigate('/login');
  };

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="no-print">
      <Container>
        <Navbar.Brand as={Link} to={user?.role === 'admin' ? "/admin/dashboard" : "/staff/deliver"}>
          لوحة تحكم الأندلس
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="me-auto">
            {/* روابط تظهر للأدمن فقط */}
            {user?.role === 'admin' && (
              <>
                <Nav.Link as={Link} to="/admin/dashboard">الرئيسية</Nav.Link>
                <Nav.Link as={Link} to="/admin/add-stock">إضافة مخزون</Nav.Link>
                <Nav.Link as={Link} to="/admin/print-barcodes">طباعة الباركود</Nav.Link>
              </>
            )}
            
            {/* رابط يظهر للأدمن والموظف */}
            {(user?.role === 'admin' || user?.role === 'user') && (
              <Nav.Link as={Link} to="/staff/deliver">تسليم الزي</Nav.Link>
            )}
          </Nav>
          <Nav>
            <Nav.Link onClick={handleLogout}>تسجيل الخروج</Nav.Link>
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default AdminNav;
