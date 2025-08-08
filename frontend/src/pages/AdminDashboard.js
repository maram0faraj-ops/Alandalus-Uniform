// AdminDashboard.js
import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Dropdown, Badge } from 'react-bootstrap';
import api from '../api';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [notifications, setNotifications] = useState([]); // <-- إضافة حالة للإشعارات


// AdminDashboard.js
// AdminDashboard.js

useEffect(() => {
  setLoading(true);
  const fetchDashboardData = async () => {
    try {
      // استدعاء كلا الطلبين في نفس الوقت
      const [statsResponse, notificationsResponse] = await Promise.all([
        api.get('/api/dashboard/stats'),
        api.get('/api/notifications')
      ]);

      // عرض النتائج في الـ console للتأكد
      console.log("Stats data received:", statsResponse.data);
      console.log("Notifications data received:", notificationsResponse.data);

      // تحديث الـ state بالبيانات المستلمة
      setStats(statsResponse.data);
      setNotifications(notificationsResponse.data);

    } catch (err) {
      console.error("Failed to fetch dashboard data:", err);
      setError('فشل في تحميل بعض بيانات لوحة التحكم.');
    } finally {
      setLoading(false);
    }
  };

  fetchDashboardData();
}, []);

  const handleMarkAsRead = async (id) => {
      try {
          await api.patch(`/api/notifications/${id}/read`);
          setNotifications(notifications.filter(n => n._id !== id)); // إزالة الإشعار من القائمة
      } catch (err) {
          console.error("Failed to mark notification as read", err);
      }
  }

  // ... (كود الـ loading و error)

  return (
    <Container className="mt-4">
      <div className="d-flex justify-content-between align-items-center mb-4">
        <h2>نظرة عامة</h2>
        {/* --  مكون الإشعارات -- */}
        <Dropdown>
          <Dropdown.Toggle variant="light" id="dropdown-basic">
            🔔
            {notifications.length > 0 && <Badge pill bg="danger">{notifications.length}</Badge>}
          </Dropdown.Toggle>

          <Dropdown.Menu>
            {notifications.length > 0 ? (
              notifications.map(n => (
                <Dropdown.Item key={n._id} onClick={() => handleMarkAsRead(n._id)}>
                  {n.message}
                </Dropdown.Item>
              ))
            ) : (
              <Dropdown.Item disabled>لا توجد إشعارات جديدة</Dropdown.Item>
            )}
          </Dropdown.Menu>
        </Dropdown>
      </div>

      {/* ... باقي كود عرض الإحصائيات ... */}
      {/* ================================================================== */}
      {/* ==============   ضع هذا الكود لعرض الإحصائيات   ================== */}
      {/* ================================================================== */}

      {stats && (
        <Row>
          {/* Card for Total Stock */}
          <Col md={4} className="mb-3">
            <Card className="text-center shadow-sm h-100">
              <Card.Body>
                <Card.Title>إجمالي المخزون الحالي</Card.Title>
                <Card.Text className="fs-2 fw-bold text-primary">
                  {stats.totalStock ?? 0}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>

          {/* Card for Delivered Stock */}
          <Col md={4} className="mb-3">
            <Card className="text-center shadow-sm h-100">
              <Card.Body>
                <Card.Title>الزي الذي تم تسليمه</Card.Title>
                <Card.Text className="fs-2 fw-bold text-success">
                  {stats.deliveredStock ?? 0}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>

          {/* Card for Total Parents */}
        
          <Col md={4} className="mb-3">
            <Card className="text-center shadow-sm h-100">
              <Card.Body>
                <Card.Title>إجمالي أولياء الأمور</Card.Title>
                <Card.Text className="fs-2 fw-bold text-info">
                  {stats.totalParents ?? 0}
                </Card.Text>
              </Card.Body>
            </Card>
          </Col>
        </Row>
      )}
      
      
      
      
      
      <Row>
        <Col md={4} className="mb-3">
          {/* ... */}
        </Col>
      </Row>
    </Container>
  );
}

export default AdminDashboard; 