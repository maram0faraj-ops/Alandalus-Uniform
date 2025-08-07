import React from 'react';
import { Navbar, Container, Nav } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
// استبدل new-logo-name.png بالاسم الجديد الفعلي الذي اخترته للشعار الثاني
import logo from '../../assets/images/logo2.png';
function AdminLayout({ children }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    // Clear user session from localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    // Redirect to login page
    navigate('/login');
  };

  return (
    <div>
      <Navbar bg="dark" variant="dark" expand="lg" collapseOnSelect>
        <Container>
          {/* 2. Add the new logo to the Navbar */}
          <Navbar.Brand as={Link} to="/admin/dashboard">
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
              <Nav.Link as={Link} to="/admin/dashboard">الرئيسية</Nav.Link>
              <Nav.Link as={Link} to="/staff/deliver">تسليم الزي</Nav.Link>
              <Nav.Link as={Link} to="/admin/add-stock">إضافة مخزون</Nav.Link>
              <Nav.Link as={Link} to="/admin/print-barcodes">طباعة الباركود</Nav.Link>
            </Nav>
            <Nav>
              <Nav.Link onClick={handleLogout}>تسجيل الخروج</Nav.Link>
            </Nav>
          </Navbar.Collapse>
        </Container>
      </Navbar>
      <main className="container py-4">{children}</main>
    </div>
  );
}

 export default AdminLayout;