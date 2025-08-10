import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, ListGroup } from 'react-bootstrap';
import { Bar, Doughnut } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement,
} from 'chart.js';
import api from '../api';

// Register the components Chart.js needs
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

function AdminDashboard() {
  // State for all dashboard data
  const [stats, setStats] = useState(null);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [stageChartData, setStageChartData] = useState(null);
  const [statusChartData, setStatusChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        // Fetch all data in parallel for speed
        const [
          statsRes,
          alertsRes,
          stageStatsRes,
          statusStatsRes
        ] = await Promise.all([
          api.get('/api/dashboard/stats'),
          api.get('/api/dashboard/low-stock-alerts'),
          api.get('/api/dashboard/stage-payment-stats'),
          api.get('/api/dashboard/delivery-status-stats'),
        ]);

        // 1. Set main stats
        setStats(statsRes.data);

        // 2. Set low stock alerts
        setLowStockAlerts(alertsRes.data);

        // 3. Process and set data for the Bar Chart
        const stageLabels = [...new Set(stageStatsRes.data.map(item => item._id.stage))];
        setStageChartData({
          labels: stageLabels,
          datasets: [{
            label: 'مدفوع',
            data: stageLabels.map(label =>
              stageStatsRes.data.find(item => item._id.stage === label && item._id.status === 'paid')?.count || 0
            ),
            backgroundColor: '#4bc0c0',
          },
          {
            label: 'مجاني',
            data: stageLabels.map(label =>
              stageStatsRes.data.find(item => item._id.stage === label && item._id.status === 'free')?.count || 0
            ),
            backgroundColor: '#ff6384',
          },
          ],
        });

        // 4. Process and set data for the Doughnut Chart
        setStatusChartData({
          labels: statusStatsRes.data.map(item => item._id === 'in_stock' ? 'في المخزون' : 'تم التسليم'),
          datasets: [{
            data: statusStatsRes.data.map(item => item.count),
            backgroundColor: ['#36a2eb', '#ffce56'],
          },],
        });

      } catch (err) {
        console.error("Failed to fetch dashboard data:", err);
        setError('فشل في تحميل بيانات لوحة التحكم.');
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, []);

  if (loading) {
    return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
  }
  if (error) {
    return <Container className="mt-4"><Alert variant="danger">{error}</Alert></Container>;
  }

  return (
    <Container fluid className="p-4">
      {/* --- Top Stats Cards --- */}
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
              <Card.Title>الزي الذي تم تسليمه</Card.Title>
              <Card.Text className="fs-2 fw-bold text-success">{stats?.deliveredStock ?? 0}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
        <Col md={4} className="mb-3">
          <Card className="text-center shadow-sm h-100">
            <Card.Body>
              <Card.Title>إجمالي أولياء الأمور</Card.Title>
              <Card.Text className="fs-2 fw-bold text-info">{stats?.totalParents ?? 0}</Card.Text>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* --- Charts Row --- */}
      <Row className="mt-4">
        <Col lg={7} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Body>
              <Card.Title>الزي المدفوع والمجاني لكل مرحلة</Card.Title>
              <div style={{ position: 'relative', height: '300px' }}>
                {stageChartData && <Bar data={stageChartData} options={{ responsive: true, maintainAspectRatio: false }} />}
              </div>
            </Card.Body>
          </Card>
        </Col>
        <Col lg={5} className="mb-4">
          <Card className="shadow-sm h-100">
            <Card.Body>
              <Card.Title>حالة المخزون الإجمالية</Card.Title>
              <div style={{ position: 'relative', height: '300px' }}>
                {statusChartData && <Doughnut data={statusChartData} options={{ responsive: true, maintainAspectRatio: false }} />}
              </div>
            </Card.Body>
          </Card>
        </Col>
      </Row>

      {/* --- Low Stock Alerts --- */}
      <Row className="mt-4">
        <Col>
          <Card className="shadow-sm">
            <Card.Header className="bg-warning text-dark">
              <h5>تنبيهات المخزون المنخفض (50 قطعة أو أقل) ⚠️</h5>
            </Card.Header>
            <ListGroup variant="flush">
              {lowStockAlerts.length > 0 ? (
                lowStockAlerts.map(item => (
                  <ListGroup.Item key={item._id}>
                    <strong>{item.quantity}</strong> قطعة متبقية من: {item.name} (المرحلة: {item.stage}, المقاس: {item.size})
                  </ListGroup.Item>
                ))
              ) : (
                <ListGroup.Item>لا توجد تنبيهات حاليًا، المخزون بحالة جيدة!</ListGroup.Item>
              )}
            </ListGroup>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default AdminDashboard;