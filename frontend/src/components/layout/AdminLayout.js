import React from 'react';
import { Container, Navbar, Nav, Button } from 'react-bootstrap';

const AdminLayout = ({ children }) => {
    // دالة تسجيل الخروج
    const handleLogout = () => {
        localStorage.clear(); // مسح كل البيانات
        window.location.href = '/login'; // العودة للدخول
    };

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f4f7f6', direction: 'rtl' }}>
            {/* الشريط العلوي */}
            <Navbar bg="dark" variant="dark" className="px-4 shadow-sm mb-4">
                <Navbar.Brand className="fw-bold" href="#">
                    🛡️ لوحة تحكم الأدمن
                </Navbar.Brand>
                <Nav className="me-auto">
                     <Button variant="danger" size="sm" onClick={handleLogout}>
                        تسجيل خروج
                    </Button>
                </Nav>
            </Navbar>

            {/* محتوى الصفحة */}
            <Container fluid className="px-4">
                {children}
            </Container>
        </div>
    );
};

export default AdminLayout;