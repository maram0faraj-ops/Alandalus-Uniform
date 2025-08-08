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

useEffect(() => {
  const fetchData = async () => {
    try {
      // --- سنجرب جلب الإحصائيات فقط ---
      const statsResponse = await api.get('/api/dashboard/stats');
      setStats(statsResponse.data);
      // لا نطلب الإشعارات الآن
      // const notificationsResponse = await api.get('/api/notifications');
      // setNotifications(notificationsResponse.data);

    } catch (err) {
      setError('فشل في تحميل البيانات.');
      console.error("Failed to fetch data:", err);
    } finally {
      setLoading(false);
    }
  };

  fetchData();
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
      <Row>
        <Col md={4} className="mb-3">
          {/* ... */}
        </Col>
      </Row>
    </Container>
  );
}

export default AdminDashboard; 