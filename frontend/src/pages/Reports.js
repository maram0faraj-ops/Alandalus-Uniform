import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Row, Col, Spinner, Card, Tabs, Tab, Table, Alert } from 'react-bootstrap';
import api from '../api';

function Reports() {
  // State for Delivery Report
  const [deliveryFilters, setDeliveryFilters] = useState({
    stage: '',
    grade: '',
    section: '',
    paymentType: '', // حقل جديد
    deliveryDateFrom: '',
    deliveryDateTo: ''
  });
  const [deliveryLoading, setDeliveryLoading] = useState(false);

  // State for Inventory Report
  const [inventoryFilters, setInventoryFilters] = useState({
    stage: '',
    type: '',
    size: '',
    entryDateFrom: '',
    entryDateTo: ''
  });
  const [inventoryLoading, setInventoryLoading] = useState(false);
  const [summaryData, setSummaryData] = useState([]);
  const [detailsData, setDetailsData] = useState([]);
  
  // Dynamic options for filters
  const [stageOptions, setStageOptions] = useState([]);
  const [typeOptions, setTypeOptions] = useState([]);
  const [sizeOptions, setSizeOptions] = useState([]);

  // Fetch dynamic options for filters on component mount
  useEffect(() => {
    const fetchFilterOptions = async () => {
        try {
            const response = await api.get('/api/uniforms/options');
            const { stages, types, sizes } = response.data;
            setStageOptions(stages.sort());
            setTypeOptions(types.sort());
            setSizeOptions(sizes.sort((a, b) => a - b));
        } catch (error) {
            console.error('Failed to fetch filter options:', error);
        }
    };
    fetchFilterOptions();
  }, []);

  // --- Delivery Report Handlers ---
  const handleDeliveryInputChange = (e) => {
    setDeliveryFilters({ ...deliveryFilters, [e.target.name]: e.target.value });
  };

  const handleDeliveryExport = async () => {
    setDeliveryLoading(true);
    try {
      const response = await api.post('/api/reports/delivery-export', deliveryFilters, { responseType: 'blob' });
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', 'delivery_report.xlsx');
      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error('Failed to export delivery report:', error);
      alert('حدث خطأ أثناء تصدير تقرير التسليم.');
    } finally {
      setDeliveryLoading(false);
    }
  };

  // --- Inventory Report Handlers ---
  const handleInventoryInputChange = (e) => {
    setInventoryFilters({ ...inventoryFilters, [e.target.name]: e.target.value });
  };

  const fetchInventorySummary = async () => {
    setInventoryLoading(true);
    setDetailsData([]);
    try {
        const response = await api.post('/api/reports/inventory-summary', inventoryFilters);
        setSummaryData(response.data);
    } catch (error) {
        console.error('Failed to fetch inventory summary:', error);
        alert('حدث خطأ أثناء جلب ملخص المخزون.');
    } finally {
        setInventoryLoading(false);
    }
  };

  const fetchInventoryDetails = async () => {
    setInventoryLoading(true);
    setSummaryData([]);
    try {
        const response = await api.post('/api/reports/inventory-details', inventoryFilters);
        setDetailsData(response.data);
    } catch (error) {
        console.error('Failed to fetch inventory details:', error);
        alert('حدث خطأ أثناء جلب تفاصيل المخزون.');
    } finally {
        setInventoryLoading(false);
    }
  };
  
  const exportInventoryDetails = async () => {
    setInventoryLoading(true);
    try {
        const response = await api.post('/api/reports/inventory-export', inventoryFilters, { responseType: 'blob' });
        const url = window.URL.createObjectURL(new Blob([response.data]));
        const link = document.createElement('a');
        link.href = url;
        link.setAttribute('download', 'inventory_details_report.xlsx');
        document.body.appendChild(link);
        link.click();
        link.remove();
    } catch (error) {
        console.error('Failed to export inventory details:', error);
        alert('حدث خطأ أثناء تصدير تفاصيل المخزون.');
    } finally {
        setInventoryLoading(false);
    }
  };

  return (
    <Container className="mt-4">
      <Tabs defaultActiveKey="delivery" id="reports-tabs" className="mb-3">
        {/* Delivery Report Tab */}
        <Tab eventKey="delivery" title="تقرير التسليم">
          <Card className="p-4 shadow-sm">
            <Card.Title as="h3" className="text-center mb-4">إنشاء تقرير التسليم</Card.Title>
            <Form>
              <Row className="mb-3 align-items-end">
                <Col md={3}><Form.Group><Form.Label>المرحلة</Form.Label><Form.Control as="select" name="stage" onChange={handleDeliveryInputChange}><option value="">الكل</option>{stageOptions.map(s => <option key={s} value={s}>{s}</option>)}</Form.Control></Form.Group></Col>
                <Col md={2}><Form.Group><Form.Label>الصف</Form.Label><Form.Control as="select" name="grade" onChange={handleDeliveryInputChange}><option value="">الكل</option>{['الأول', 'الثاني', 'الثالث', 'الرابع', 'الخامس', 'السادس'].map(g=><option key={g} value={g}>{g}</option>)}</Form.Control></Form.Group></Col>
                <Col md={2}><Form.Group><Form.Label>الشعبة</Form.Label><Form.Control as="select" name="section" onChange={handleDeliveryInputChange}><option value="">الكل</option>{['أ', 'ب', 'ج', 'د', 'هـ'].map(s=><option key={s} value={s}>{s}</option>)}</Form.Control></Form.Group></Col>
                
                <Col md={2}>
                  <Form.Group>
                    <Form.Label>نوع الدفع</Form.Label>
                    <Form.Control as="select" name="paymentType" onChange={handleDeliveryInputChange}>
                        <option value="">الكل</option>
                        <option value="مدفوع">مدفوع</option>
                        <option value="مجاني">مجاني</option>
                    </Form.Control>
                  </Form.Group>
                </Col>

                <Col md={3}>
                  <Form.Group>
                    <Form.Label>تاريخ التسليم</Form.Label>
                    <Row>
                      <Col><Form.Control type="date" name="deliveryDateFrom" onChange={handleDeliveryInputChange} /></Col>
                      <Col><Form.Control type="date" name="deliveryDateTo" onChange={handleDeliveryInputChange} /></Col>
                    </Row>
                  </Form.Group>
                </Col>
              </Row>
              <div className="d-grid mt-4"><Button variant="success" size="lg" onClick={handleDeliveryExport} disabled={deliveryLoading}>{deliveryLoading ? <Spinner as="span" size="sm" /> : 'تصدير تقرير التسليم إلى Excel'}</Button></div>
            </Form>
          </Card>
        </Tab>

        {/* Inventory Report Tab */}
        <Tab eventKey="inventory" title="تقرير المخزون">
          <Card className="p-4 shadow-sm">
            <Card.Title as="h3" className="text-center mb-4">إنشاء تقرير المخزون</Card.Title>
            <Form>
              <Row className="mb-3 align-items-end">
                <Col md={3}><Form.Group><Form.Label>المرحلة</Form.Label><Form.Control as="select" name="stage" onChange={handleInventoryInputChange}><option value="">الكل</option>{stageOptions.map(s => <option key={s} value={s}>{s}</option>)}</Form.Control></Form.Group></Col>
                <Col md={2}><Form.Group><Form.Label>النوع</Form.Label><Form.Control as="select" name="type" onChange={handleInventoryInputChange}><option value="">الكل</option>{typeOptions.map(t => <option key={t} value={t}>{t}</option>)}</Form.Control></Form.Group></Col>
                <Col md={2}><Form.Group><Form.Label>المقاس</Form.Label><Form.Control as="select" name="size" onChange={handleInventoryInputChange}><option value="">الكل</option>{sizeOptions.map(s => <option key={s} value={s}>{s}</option>)}</Form.Control></Form.Group></Col>
                <Col md={5}><Form.Group><Form.Label>تاريخ الإدخال</Form.Label><Row><Col><Form.Control type="date" name="entryDateFrom" onChange={handleInventoryInputChange} /></Col><Col><Form.Control type="date" name="entryDateTo" onChange={handleInventoryInputChange} /></Col></Row></Form.Group></Col>
              </Row>
              <Row className="mt-4">
                <Col md={4}><div className="d-grid"><Button variant="primary" onClick={fetchInventorySummary} disabled={inventoryLoading}>عرض الملخص</Button></div></Col>
                <Col md={4}><div className="d-grid"><Button variant="info" onClick={fetchInventoryDetails} disabled={inventoryLoading}>عرض التفصيلي</Button></div></Col>
                <Col md={4}><div className="d-grid"><Button variant="success" onClick={exportInventoryDetails} disabled={inventoryLoading}>تصدير التفصيلي لـ Excel</Button></div></Col>
              </Row>
            </Form>
            
            <div className="mt-4">
                {inventoryLoading && <div className="text-center"><Spinner animation="border" /></div>}
                
                {summaryData.length > 0 && (
                    <>
                        <h4>ملخص المخزون الحالي</h4>
                        <Table striped bordered hover responsive>
                            <thead><tr><th>المرحلة</th><th>النوع</th><th>المقاس</th><th>الكمية المتوفرة</th></tr></thead>
                            <tbody>{summaryData.map((item, index) => <tr key={index}><td>{item._id.stage}</td><td>{item._id.type}</td><td>{item._id.size}</td><td>{item.quantity}</td></tr>)}</tbody>
                        </Table>
                    </>
                )}

                {detailsData.length > 0 && (
                     <>
                        <h4>تفاصيل المخزون الحالي</h4>
                        <Table striped bordered hover responsive>
                            <thead><tr><th>الباركود</th><th>المرحلة</th><th>النوع</th><th>المقاس</th><th>تاريخ الإدخال</th></tr></thead>
                            <tbody>{detailsData.map(item => <tr key={item._id}><td>{item.barcode}</td><td>{item.uniform?.stage}</td><td>{item.uniform?.type}</td><td>{item.uniform?.size}</td><td>{new Date(item.entryDate).toLocaleDateString('ar-SA')}</td></tr>)}</tbody>
                        </Table>
                    </>
                )}

                {!inventoryLoading && summaryData.length === 0 && detailsData.length === 0 && <Alert variant="light" className="text-center">الرجاء تحديد الفلاتر والضغط على أحد الأزرار لعرض التقارير.</Alert>}
            </div>
          </Card>
        </Tab>
      </Tabs>
    </Container>
  );
}

export default Reports;