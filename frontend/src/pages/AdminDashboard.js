import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Alert } from 'react-bootstrap';
import api from '../api';

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStats = async () => {
      try {
        const response = await api.get('/api/dashboard/stats');
        setStats(response.data);
      } catch (err) {
        setError('فشل في تحميل الإحصائيات. يرجى المحاولة مرة أخرى.');
        console.error("Failed to fetch stats:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, []);

  if (loading) {
    return (
      <Container className="text-center mt-5">
        <Spinner animation="border" role="status">
          <span className="visually-hidden">Loading...</span>
        </Spinner>
      </Container>
    );
  }

  if (error) {
    return <Container className="mt-4"><Alert variant="danger">{error}</Alert></Container>;
  }

  return (
    <Container className="mt-4">
      <h2 className="mb-4">نظرة عامة</h2>
      <Row>
        <Col md={4} className="mb-3">
          <Card className="text-center shadow-sm h-100">
            <Card.Body>
              <Card.Title>إجمالي المخزون الحالي</Card.Title>
              <Card.Text className="fs-2 fw-bold text-primary">{stats?.totalStock ?? 0}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          <Card className="text-center shadow-sm h-100">
            <Card.Body>
              <Card.Title>القطع المسلمة</Card.Title>
              <Card.Text className="fs-2 fw-bold text-success">{stats?.deliveredStock ?? 0}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          <Card className="text-center shadow-sm h-100">
            <Card.Body>
              <Card.Title>عدد أولياء الأمور</Card.Title>
              <Card.Text className="fs-2 fw-bold text-info">{stats?.totalParents ?? 0}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default AdminDashboard;
