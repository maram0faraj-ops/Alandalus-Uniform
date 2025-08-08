import React, { useEffect, useState, useCallback } from 'react';
import { Navbar, Container, Nav } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../assets/images/logo2.png'; // تأكد من صحة هذا المسار

function AdminNav() {
  const navigate = useNavigate();
  const [userRole, setUserRole] = useState(null);

   const handleLogout = useCallback(() => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  }, [navigate]);

  useEffect(() => {
    try {
      const userData = localStorage.getItem('user');
      if (userData) {
        const user = JSON.parse(userData);
        setUserRole(user.role);
      }
    } catch (error) {
      console.error("Failed to parse user data from localStorage", error);
      handleLogout();
    }
  }, [handleLogout]);

  return (
    <Navbar bg="dark" variant="dark" expand="lg" collapseOnSelect>
      <Container>
        <Navbar.Brand as={Link} to={userRole === 'admin' ? '/admin/dashboard' : '/staff/deliver'}>
          <img
            src={logo}
            height="30"
            className="d-inline-block align-top"
            alt="Al Andalus Schools Logo"
          />
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="responsive-navbar-nav" />
        <Navbar.Collapse id="responsive-navbar-nav">
          <Nav className="me-auto">
            {/* === الجزء الأهم: العرض الشرطي للروابط === */}

            {/* يظهر للمسؤول فقط */}
            {userRole === 'admin' && (
              <Nav.Link as={Link} to="/admin/dashboard">الرئيسية</Nav.Link>
            )}

            {/* يظهر للمسؤول والموظف */}
            <Nav.Link as={Link} to="/staff/deliver">تسليم الزي</Nav.Link>
            
            {/* يظهر للمسؤول فقط */}
            {userRole === 'admin' && (
              <>
                <Nav.Link as={Link} to="/admin/add-stock">إضافة مخزون</Nav.Link>
                <Nav.Link as={Link} to="/admin/print-barcodes">طباعة الباركود</Nav.Link>
              </>
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