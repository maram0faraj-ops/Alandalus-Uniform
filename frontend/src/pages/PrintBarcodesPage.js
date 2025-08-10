import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Spinner, Alert, Card } from 'react-bootstrap';
import api from '../api';
import BarcodeRenderer from '../components/BarcodeRenderer';

function PrintBarcodesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchItems = async () => {
      try {
        // We only need to print items that are in stock
        const response = await api.get('/api/inventory?status=in_stock');
        setItems(response.data);
      } catch (err) {
        setError('فشل في جلب بيانات المخزون');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);
  
  const handlePrint = () => {
    window.print();
  };

  return (
    <Container className="mt-5">
      {/* This entire section will NOT be printed */}
      <div className="d-flex justify-content-between align-items-center mb-4 no-print">
        <h2>طباعة الباركود</h2>
        <Button variant="success" onClick={handlePrint} disabled={items.length === 0}>
          <i className="fas fa-print me-2"></i> طباعة الملصقات
        </Button>
      </div>

      {loading && (
        <div className="text-center">
          <Spinner animation="border" />
        </div>
      )}

      {error && <Alert variant="danger" className="no-print">{error}</Alert>}

      {/* This Row is the only part that WILL be printed */}
      {!loading && !error && (
        <Row className="printable">
          {items.length > 0 ? items.map((item) => (
            // Check if item and item.uniform exist to prevent errors
            item && item.uniform && (
              <Col key={item._id} lg={3} md={4} sm={6} xs={12} className="mb-4 barcode-card-container">
                <Card className="barcode-card">
                  <Card.Body className="d-flex flex-column justify-content-center align-items-center p-2">
                    <p className="fw-bold school-name mb-2">مدارس الأندلس الأهلية</p>
                    <BarcodeRenderer value={item.barcode} />
                    <p className="item-details mt-2">
                      {item.uniform.stage} - {item.uniform.type} (مقاس: {item.uniform.size})
                    </p>
                  </Card.Body>
                </Card>
              </Col>
            )
          )) : (
            <Col>
              <Alert variant="info" className="no-print">لا يوجد قطع في المخزون لعرضها.</Alert>
            </Col>
          )}
        </Row>
      )}
    </Container>
  );
}

 export default PrintBarcodesPage;