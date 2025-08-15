import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Spinner, Alert, Form, Card } from 'react-bootstrap';
import api from '../api';
import BarcodeRenderer from '../components/BarcodeRenderer';

function PrintBarcodesPage() {
  const [allItems, setAllItems] = useState([]); // لتخزين كل القطع الأصلية
  const [filteredItems, setFilteredItems] = useState([]); // لتخزين القطع بعد الفلترة
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  // حالة لتخزين خيارات الفلترة المتاحة (المراحل، الأنواع، المقاسات)
  const [filterOptions, setFilterOptions] = useState({ stages: [], types: [], sizes: [] });

  // حالة لتخزين قيم الفلاتر المختارة
  const [filters, setFilters] = useState({
    stage: 'all',
    type: 'all',
    size: 'all',
  });

  // 1. جلب البيانات واستخلاص خيارات الفلترة عند تحميل الصفحة لأول مرة
  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await api.get('/api/inventory?status=in_stock');
        const data = response.data;
        setAllItems(data);
        setFilteredItems(data);

        // استخلاص القيم الفريدة لخيارات الفلترة
        const uniqueStages = [...new Set(data.map(item => item.uniform?.stage).filter(Boolean))];
        const uniqueTypes = [...new Set(data.map(item => item.uniform?.type).filter(Boolean))];
        const uniqueSizes = [...new Set(data.map(item => item.uniform?.size).filter(Boolean))].sort((a, b) => a - b);
        
        setFilterOptions({ stages: uniqueStages, types: uniqueTypes, sizes: uniqueSizes });

      } catch (err) {
        setError('فشل في جلب بيانات المخزون');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  // 2. تطبيق الفلاتر عند تغيير أي من خيارات الفلترة
  useEffect(() => {
    let result = allItems;

    if (filters.stage !== 'all') {
      result = result.filter(item => item.uniform?.stage === filters.stage);
    }
    if (filters.type !== 'all') {
      result = result.filter(item => item.uniform?.type === filters.type);
    }
    if (filters.size !== 'all') {
      // تحويل المقاس إلى رقم للمقارنة الصحيحة
      result = result.filter(item => item.uniform?.size === Number(filters.size));
    }
    
    setFilteredItems(result);
  }, [filters, allItems]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prevFilters => ({
      ...prevFilters,
      [name]: value,
    }));
  };
  
  const handlePrint = () => {
    window.print();
  };

  return (
    <Container className="mt-5">
      {/* --- قسم الفلاتر (لا يظهر عند الطباعة) --- */}
      <div className="no-print">
        <Card className="mb-4">
          <Card.Header>
            <h5>فلترة النتائج</h5>
          </Card.Header>
          <Card.Body>
            <Row>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>المرحلة الدراسية</Form.Label>
                  <Form.Select name="stage" value={filters.stage} onChange={handleFilterChange}>
                    <option value="all">الكل</option>
                    {filterOptions.stages.map(stage => <option key={stage} value={stage}>{stage}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>نوع الزي</Form.Label>
                  <Form.Select name="type" value={filters.type} onChange={handleFilterChange}>
                    <option value="all">الكل</option>
                    {filterOptions.types.map(type => <option key={type} value={type}>{type}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
              <Col md={4}>
                <Form.Group>
                  <Form.Label>المقاس</Form.Label>
                  <Form.Select name="size" value={filters.size} onChange={handleFilterChange}>
                    <option value="all">الكل</option>
                    {filterOptions.sizes.map(size => <option key={size} value={size}>{size}</option>)}
                  </Form.Select>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </div>

      {/* --- قسم التحكم بالطباعة (لا يظهر عند الطباعة) --- */}
      <div className="d-flex justify-content-between align-items-center mb-4 no-print">
        <h2>طباعة الباركود ({filteredItems.length} قطعة)</h2>
        <Button variant="success" onClick={handlePrint} disabled={filteredItems.length === 0}>
          طباعة الملصقات
        </Button>
      </div>

      {loading && <div className="text-center"><Spinner animation="border" /></div>}
      {error && <Alert variant="danger" className="no-print">{error}</Alert>}

      {/* --- قسم الطباعة --- */}
      {!loading && !error && (
        <div className="printable">
          <Row>
            {filteredItems.length > 0 ? filteredItems.map((item) => (
              <Col xs={4} key={item._id} className="barcode-wrapper">
                {item.uniform ? (
                  <div className="barcode-card">
                    <p className="school-name">مدارس الأندلس الأهلية</p>
                    <div className="barcode-container">
                      <BarcodeRenderer value={item.barcode} />
                    </div>
                    <p className="item-details">
                      {item.uniform.stage} - {item.uniform.type} (مقاس: {item.uniform.size})
                    </p>
                  </div>
                ) : null}
              </Col>
            )) : (
              <Col>
                <Alert variant="info" className="no-print">لا توجد نتائج تطابق خيارات البحث.</Alert>
              </Col>
            )}
          </Row>
        </div>
      )}
    </Container>
  );
}

export default PrintBarcodesPage;