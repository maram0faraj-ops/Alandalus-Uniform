import React from 'react';
import { Navbar, Container, Nav, NavDropdown } from 'react-bootstrap';
import { Link, useNavigate } from 'react-router-dom';
import logo from '../../assets/images/logo2.png';

function AdminLayout({ children }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div>
      <Navbar bg="dark" variant="dark" expand="lg" collapseOnSelect>
        <Container>
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
              
              {/* --- الرابط الجديد لصفحة إدارة المخزون --- */}
              <Nav.Link as={Link} to="/admin/manage-inventory">إدارة المخزون</Nav.Link>
              
              <Nav.Link as={Link} to="/admin/print-barcodes">طباعة الباركود</Nav.Link>
              
              <NavDropdown title="التقارير" id="reports-dropdown">
                <NavDropdown.Item as={Link} to="/admin/reports">تقرير التسليم</NavDropdown.Item>
                <NavDropdown.Item as={Link} to="/admin/reports/inventory">تقرير المخزون</NavDropdown.Item>
              </NavDropdown>

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