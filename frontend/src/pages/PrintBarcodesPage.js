import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Spinner, Alert } from 'react-bootstrap';
import api from '../api';
import BarcodeRenderer from '../components/BarcodeRenderer';

function PrintBarcodesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchItems = async () => {
      try {
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
      {/* Non-printable section */}
      <div className="d-flex justify-content-between align-items-center mb-4 no-print">
        <h2>طباعة الباركود</h2>
        <Button variant="success" onClick={handlePrint} disabled={items.length === 0}>
          طباعة الملصقات
        </Button>
      </div>

      {loading && <div className="text-center"><Spinner animation="border" /></div>}
      {error && <Alert variant="danger" className="no-print">{error}</Alert>}

      {/* Printable section with a Flexbox Grid */}
      {!loading && !error && (
        <div className="printable">
          <Row>
            {items.length > 0 ? items.map((item) => (
              // xs={6} creates a 2-column layout (12 / 6 = 2)
              <Col xs={6} key={item._id} className="barcode-wrapper">
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
                <Alert variant="info" className="no-print">لا يوجد قطع في المخزون لعرضها.</Alert>
              </Col>
            )}
          </Row>
        </div>
      )}
    </Container>
  );
}

export default PrintBarcodesPage;
