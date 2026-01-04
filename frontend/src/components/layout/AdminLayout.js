import React from 'react';
import { Container, Navbar, Nav, Button } from 'react-bootstrap';
import { Link, useLocation } from 'react-router-dom';

const AdminLayout = ({ children }) => {
    const location = useLocation();

    // دالة لتسجيل الخروج
    const handleLogout = () => {
        localStorage.clear();
        window.location.href = '/login';
    };

    // دالة مساعدة لتحديد الرابط النشط حالياً
    const isActive = (path) => location.pathname === path;

    return (
        <div style={{ minHeight: '100vh', backgroundColor: '#f4f7f6', direction: 'rtl' }}>
            {/* الشريط العلوي الكامل */}
            <Navbar bg="dark" variant="dark" expand="lg" className="px-4 shadow-sm mb-4">
                <Container fluid>
                    {/* الشعار */}
                    <Navbar.Brand as={Link} to="/admin/dashboard" className="fw-bold text-warning">
                        🛡️ نظام الزي المدرسي
                    </Navbar.Brand>
                    
                    {/* زر القائمة للموبايل */}
                    <Navbar.Toggle aria-controls="navbar-menu" />
                    
                    {/* روابط القائمة */}
                    <Navbar.Collapse id="navbar-menu">
                        <Nav className="me-auto my-2 my-lg-0" style={{ maxHeight: '100px' }}>
                            
                            <Nav.Link as={Link} to="/admin/dashboard" active={isActive('/admin/dashboard')} className="mx-2">
                                📊 الإحصائيات
                            </Nav.Link>

                            <Nav.Link as={Link} to="/admin/add-stock" active={isActive('/admin/add-stock')} className="mx-2">
                                ➕ إضافة مخزون
                            </Nav.Link>

                            <Nav.Link as={Link} to="/admin/manage-inventory" active={isActive('/admin/manage-inventory')} className="mx-2">
                                📦 إدارة المخزون
                            </Nav.Link>

                            <Nav.Link as={Link} to="/admin/print-barcodes" active={isActive('/admin/print-barcodes')} className="mx-2">
                                🖨️ طباعة الباركود
                            </Nav.Link>

                            <Nav.Link as={Link} to="/admin/reports" active={isActive('/admin/reports')} className="mx-2">
                                📑 التقارير
                            </Nav.Link>
                        </Nav>
                        
                        {/* الجزء الأيسر: الترحيب وزر الخروج */}
                        <div className="d-flex align-items-center gap-3 mt-3 mt-lg-0">
                            <span className="text-white-50 small d-none d-lg-block">مرحباً، المدير العام</span>
                            <Button variant="danger" size="sm" onClick={handleLogout} className="px-3">
                                خروج
                            </Button>
                        </div>
                    </Navbar.Collapse>
                </Container>
            </Navbar>

            {/* محتوى الصفحة المتغير */}
            <Container fluid className="px-4 pb-5">
                {children}
            </Container>
        </div>
    );
};

export default AdminLayout;