import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Spinner, Alert, Table, Badge } from 'react-bootstrap';
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

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend, ArcElement);

function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [lowStockAlerts, setLowStockAlerts] = useState([]);
  const [stageChartData, setStageChartData] = useState(null);
  const [statusChartData, setStatusChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // --- دالة ذكية لتوحيد المسميات ودمج المكرر ---
  const normalizeStage = (stageName) => {
    if (!stageName) return 'غير محدد';
    let name = stageName.trim();
    
    // تصحيح الهمزات الشائعة
    name = name.replace('اطفال', 'أطفال'); // تحويل اطفال -> أطفال
    name = name.replace('إبتدائي', 'ابتدائي'); // توحيد همزة ابتدائي

    // دمج "ابتدائي" العامة مع "ابتدائي بنات" (أو حسب رغبتك)
    // هذا السطر يحل مشكلة ظهور الابتدائي مرتين بدمجهم في مسمى واحد
    if (name === 'ابتدائي') return 'ابتدائي بنات'; 

    return name;
  };

  useEffect(() => {
    const fetchDashboardData = async () => {
      setLoading(true);
      try {
        const [statsRes, alertsRes, stageStatsRes, statusStatsRes] = await Promise.all([
          api.get('/api/dashboard/stats'),
          api.get('/api/dashboard/low-stock-alerts'),
          api.get('/api/dashboard/stage-payment-stats'),
          api.get('/api/dashboard/delivery-status-stats'),
        ]);

        setStats(statsRes.data);
        setLowStockAlerts(alertsRes.data);

        // --- معالجة بيانات الرسم البياني (دمج القيم المكررة) ---
        const rawStageData = stageStatsRes.data;
        const processedData = {};

        rawStageData.forEach(item => {
            // نستخدم الدالة لتوحيد الاسم قبل التجميع
            const cleanName = normalizeStage(item._id);
            // جمع الأرقام للمسميات المتشابهة
            processedData[cleanName] = (processedData[cleanName] || 0) + item.count;
        });

        const labels = Object.keys(processedData).sort();
        const dataValues = labels.map(label => processedData[label]);

        if (labels.length > 0) {
            setStageChartData({
              labels: labels,
              datasets: [
                {
                  label: 'إجمالي الزي المسلّم',
                  data: dataValues,
                  backgroundColor: '#36A2EB',
                  borderRadius: 5,
                  barThickness: 40,
                }
              ],
            });
        }

        // --- إعداد بيانات المخطط الدائري ---
        const statusMap = { 'in_stock': 'في المخزون', 'delivered': 'تم التسليم' };
        const statusDataOrdered = statusStatsRes.data.map(item => ({
            label: statusMap[item._id] || item._id,
            value: item.count,
            id: item._id
        }));

        setStatusChartData({
          labels: statusDataOrdered.map(d => d.label),
          datasets: [{
            data: statusDataOrdered.map(d => d.value),
            backgroundColor: statusDataOrdered.map(d => d.id === 'in_stock' ? '#FFCE56' : '#4BC0C0'),
            hoverOffset: 4
          }],
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

  const StatCard = ({ title, value, icon, color, bg }) => (
    <Card className="border-0 shadow-sm h-100" style={{ backgroundColor: bg || '#fff' }}>
      <Card.Body className="d-flex align-items-center justify-content-between">
        <div>
          <h6 className="text-muted mb-2">{title}</h6>
          <h3 className="fw-bold mb-0" style={{ color: color }}>{value}</h3>
        </div>
        <div className="d-flex align-items-center justify-content-center rounded-circle" 
             style={{ width: '60px', height: '60px', backgroundColor: `${color}20`, fontSize: '2rem' }}>
          {icon}
        </div>
      </Card.Body>
    </Card>
  );

  if (loading) return <Container className="d-flex justify-content-center align-items-center" style={{height: '80vh'}}><Spinner animation="grow" variant="primary" /></Container>;
  if (error) return <Container className="mt-4"><Alert variant="danger">{error}</Alert></Container>;

  return (
    <Container fluid className="py-4 bg-light" style={{ minHeight: '100vh' }}>
      <div className="mb-4">
        <h2 className="fw-bold text-dark">لوحة التحكم</h2>
        <p className="text-muted">نظرة عامة على حالة المخزون والتسليم</p>
      </div>

      {/* تم تعديل التصميم: حذف بطاقة الأولياء وجعل البطاقتين الباقيتين تأخذان نصف الشاشة لكل منهما */}
      <Row className="g-4 mb-4">
        <Col md={6}>
          <StatCard title="إجمالي المخزون" value={stats?.totalStock ?? 0} icon="👕" color="#FFCE56" />
        </Col>
        <Col md={6}>
          <StatCard title="تم التسليم" value={stats?.deliveredStock ?? 0} icon="✅" color="#4BC0C0" />
        </Col>
      </Row>

      <Row className="g-4">
        <Col lg={8}>
            <Card className="border-0 shadow-sm mb-4">
                <Card.Header className="bg-white border-0 pt-4 px-4">
                    <h5 className="fw-bold">📊 مستوى تسليم الزي حسب المرحلة</h5>
                </Card.Header>
                <Card.Body className="px-4 pb-4">
                    <div style={{ height: '350px' }}>
                        {stageChartData ? 
                            <Bar 
                                data={stageChartData} 
                                options={{ 
                                    responsive: true, 
                                    maintainAspectRatio: false,
                                    plugins: { legend: { display: false } },
                                    scales: { y: { beginAtZero: true, grid: { display: true, color: '#f0f0f0' } }, x: { grid: { display: false } } }
                                }} 
                            /> 
                        : <p className="text-center text-muted mt-5">جاري تجميع البيانات...</p>}
                    </div>
                </Card.Body>
            </Card>

             <Card className="border-0 shadow-sm">
                <Card.Header className="bg-white border-0 pt-4 px-4 d-flex justify-content-between align-items-center">
                    <h5 className="fw-bold text-danger">⚠️ تنبيهات المخزون المنخفض</h5>
                    <Badge bg="danger" pill>{lowStockAlerts.length} تنبيهات</Badge>
                </Card.Header>
                <Card.Body className="p-0">
                    {lowStockAlerts.length > 0 ? (
                        <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
                            <Table hover responsive className="mb-0 align-middle">
                                <thead className="bg-light sticky-top">
                                    <tr>
                                        <th className="px-4">المرحلة</th>
                                        <th>النوع</th>
                                        <th>المقاس</th>
                                        <th className="text-center">الكمية المتبقية</th>
                                        <th className="text-center">الحالة</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {lowStockAlerts.map((item, idx) => (
                                        <tr key={idx}>
                                            <td className="px-4 fw-bold">{item.uniformDetails.stage}</td>
                                            <td>{item.uniformDetails.type}</td>
                                            <td><Badge bg="secondary">{item.uniformDetails.size}</Badge></td>
                                            <td className="text-center fw-bold text-dark">{item.quantity}</td>
                                            <td className="text-center">
                                                {item.quantity <= 5 ? 
                                                    <Badge bg="danger">حرج جداً</Badge> : 
                                                    <Badge bg="warning" text="dark">منخفض</Badge>
                                                }
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </Table>
                        </div>
                    ) : (
                        <div className="text-center p-5">
                            <h1 className="display-4">✅</h1>
                            <p className="text-muted">المخزون بحالة ممتازة!</p>
                        </div>
                    )}
                </Card.Body>
            </Card>
        </Col>

        <Col lg={4}>
            <Card className="border-0 shadow-sm h-100">
                <Card.Header className="bg-white border-0 pt-4 px-4">
                    <h5 className="fw-bold">نسبة التوزيع الكلية</h5>
                </Card.Header>
                <Card.Body className="d-flex flex-column justify-content-center align-items-center">
                    <div style={{ width: '100%', height: '300px', position: 'relative' }}>
                        {statusChartData && 
                            <Doughnut 
                                data={statusChartData} 
                                options={{ 
                                    responsive: true, 
                                    maintainAspectRatio: false,
                                    cutout: '70%',
                                    plugins: { legend: { position: 'bottom', labels: { usePointStyle: true, padding: 20 } } }
                                }} 
                            />
                        }
                        <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -60%)', textAlign: 'center' }}>
                            <h2 className="fw-bold mb-0">{stats?.totalStock + stats?.deliveredStock || 0}</h2>
                            <small className="text-muted">إجمالي القطع</small>
                        </div>
                    </div>
                    <div className="mt-4 w-100">
                        <Alert variant="info" className="mb-0 text-center border-0 bg-opacity-10">
                             <small>يتم تحديث البيانات تلقائياً</small>
                        </Alert>
                    </div>
                </Card.Body>
            </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default AdminDashboard;