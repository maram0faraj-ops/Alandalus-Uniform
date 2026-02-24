import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Spinner, Form, Card } from 'react-bootstrap';
import api from '../api';
import BarcodeRenderer from '../components/BarcodeRenderer';

function PrintBarcodesPage() {
  const [allItems, setAllItems] = useState([]); 
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [stages, setStages] = useState([]);
  const [types, setTypes] = useState([]);
  const [sizes, setSizes] = useState([]);
  const [filters, setFilters] = useState({ stage: 'all', type: 'all', size: 'all', entryDate: '' });
  const [selectedItems, setSelectedItems] = useState(new Set());

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await api.get('/api/inventory?status=in_stock');
        const data = response.data;
        setAllItems(data);
        setFilteredItems(data);
        setStages([...new Set(data.map(i => i.uniform?.stage).filter(Boolean))]);
        setTypes([...new Set(data.map(i => i.uniform?.type).filter(Boolean))]);
        setSizes([...new Set(data.map(i => i.uniform?.size).filter(Boolean))].sort((a, b) => a - b));
      } catch (err) { console.error('Error'); } finally { setLoading(false); }
    };
    fetchItems();
  }, []);

  useEffect(() => {
    let result = allItems;
    if (filters.stage !== 'all') result = result.filter(i => i.uniform?.stage === filters.stage);
    if (filters.type !== 'all') result = result.filter(i => i.uniform?.type === filters.type);
    if (filters.size !== 'all') result = result.filter(i => i.uniform?.size === Number(filters.size));
    if (filters.entryDate) result = result.filter(i => i.entryDate?.startsWith(filters.entryDate));
    setFilteredItems(result);
    setSelectedItems(new Set()); 
  }, [filters, allItems]);

  const handleSelectionChange = (itemId) => {
    const next = new Set(selectedItems);
    next.has(itemId) ? next.delete(itemId) : next.add(itemId);
    setSelectedItems(next);
  };

  return (
    <Container className="mt-4">
      <div className="no-print">
        <h2 className="system-title text-center mb-4">نظام إدارة ملصقات الزي</h2>
        <Card className="mb-4 shadow-sm"><Card.Body>
          <Row className="align-items-end">
            <Col md={3}><Form.Group><Form.Label>المرحلة</Form.Label>
              <Form.Select onChange={(e) => setFilters({...filters, stage: e.target.value})}>
                <option value="all">الكل</option>{stages.map(s => <option key={s} value={s}>{s}</option>)}
              </Form.Select></Form.Group>
            </Col>
            <Col md={3}><Form.Group><Form.Label>النوع</Form.Label>
              <Form.Select onChange={(e) => setFilters({...filters, type: e.target.value})}>
                <option value="all">الكل</option>{types.map(t => <option key={t} value={t}>{t}</option>)}
              </Form.Select></Form.Group>
            </Col>
            <Col md={2}><Form.Group><Form.Label>المقاس</Form.Label>
              <Form.Select onChange={(e) => setFilters({...filters, size: e.target.value})}>
                <option value="all">الكل</option>{sizes.map(sz => <option key={sz} value={sz}>{sz}</option>)}
              </Form.Select></Form.Group>
            </Col>
            <Col md={4}><Form.Group><Form.Label>التاريخ</Form.Label>
              <Form.Control type="date" onChange={(e) => setFilters({...filters, entryDate: e.target.value})} />
            </Form.Group></Col>
          </Row>
        </Card.Body></Card>
        <div className="d-flex justify-content-between mb-3">
          <Button variant="outline-primary" size="sm" onClick={() => setSelectedItems(new Set(filteredItems.map(i => i._id)))}>تحديد الكل</Button>
          <Button variant="success" onClick={() => window.print()} disabled={selectedItems.size === 0}>🖨️ طباعة المختار</Button>
        </div>
      </div>

      {loading ? <div className="text-center my-5"><Spinner animation="border" /></div> : (
        <div className="printable">
          <Row className="g-1">
            {filteredItems.map((item) => (
              <Col xs={3} key={item._id} className={`barcode-wrapper ${selectedItems.size > 0 && !selectedItems.has(item._id) ? 'hide-on-print' : ''}`}>
                <div className="barcode-card">
                  <Form.Check type="checkbox" className="no-print barcode-checkbox" checked={selectedItems.has(item._id)} onChange={() => handleSelectionChange(item._id)} />
                  <p className="school-name">مدارس الأندلس الأهلية</p>
                  <div className="qr-container"><BarcodeRenderer value={item.barcode} /></div>
                  <div className="item-details">
                    <p className="mb-0">{item.uniform.stage} - {item.uniform.type}</p>
                    <p className="fw-bold mb-0 text-dark">المقاس: {item.uniform.size}</p>
                  </div>
                </div>
              </Col>
            ))}
          </Row>
        </div>
      )}
    </Container>
  );
}
export default PrintBarcodesPage;