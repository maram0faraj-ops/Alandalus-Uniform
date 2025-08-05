    import React, { useState, useEffect } from 'react';
    import { Container, Row, Col, Card, Spinner } from 'react-bootstrap';
    import api from '../api'; // استيراد الملف الجديد

    function AdminDashboard() {
      const [stats, setStats] = useState(null);
      const [loading, setLoading] = useState(true);

      useEffect(() => {
        const fetchStats = async () => {
          try {
            // استخدام api مباشرة، سيتم إضافة التوكن تلقائياً
            const response = await api.get('/api/dashboard/stats');
            setStats(response.data);
          } catch (error) {
            console.error("Failed to fetch stats", error);
          } finally {
            setLoading(false);
          }
        };

        fetchStats();
      }, []);
      
      // ... (بقية الكود الخاص بالعرض يبقى كما هو)
      if (loading) {
        return (
          <Container className="text-center mt-5">
            <Spinner animation="border" role="status">
              <span className="visually-hidden">Loading...</span>
            </Spinner>
          </Container>
        );
      }
    
      return (
        <Container className="mt-4">
          <h2 className="mb-4">نظرة عامة</h2>
          <Row>
            <Col md={4}>
              <Card className="text-center shadow-sm">
                <Card.Body>
                  <Card.Title>إجمالي المخزون الحالي</Card.Title>
                  <Card.Text className="fs-2 fw-bold">{stats?.totalStock ?? 0}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="text-center shadow-sm">
                <Card.Body>
                  <Card.Title>القطع المسلمة</Card.Title>
                  <Card.Text className="fs-2 fw-bold">{stats?.deliveredStock ?? 0}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
            <Col md={4}>
              <Card className="text-center shadow-sm">
                <Card.Body>
                  <Card.Title>عدد أولياء الأمور</Card.Title>
                  <Card.Text className="fs-2 fw-bold">{stats?.totalParents ?? 0}</Card.Text>
                </Card.Body>
              </Card>
            </Col>
          </Row>
        </Container>
      );
    }

    export default AdminDashboard;
    