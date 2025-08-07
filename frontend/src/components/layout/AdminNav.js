import React from 'react';
import { Navbar, Container, Nav } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../assets/images/logo-2.png'; // Make sure this path is correct

function AdminNav() {
  const navigate = useNavigate();

  // 1. Get user data from localStorage
  const user = JSON.parse(localStorage.getItem('user'));
  const userRole = user ? user.role : null;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

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
            {/* Links visible to everyone */}
            {userRole === 'admin' && <Nav.Link as={Link} to="/admin/dashboard">الرئيسية</Nav.Link>}
            <Nav.Link as={Link} to="/staff/deliver">تسليم الزي</Nav.Link>
            
            {/* 2. Conditionally render Admin-only links */}
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