import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Button, Spinner, Alert, Form, Card, InputGroup } from 'react-bootstrap';
import api from '../api';
import BarcodeRenderer from '../components/BarcodeRenderer';

function PrintBarcodesPage() {
  const [allItems, setAllItems] = useState([]); 
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [filterOptions, setFilterOptions] = useState({ stages: [], types: [], sizes: [] });

  const [filters, setFilters] = useState({
    stage: 'all',
    type: 'all',
    size: 'all',
    entryDate: '', // State for the new date filter
  });

  const [selectedItems, setSelectedItems] = useState(new Set());

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await api.get('/api/inventory?status=in_stock');
        const data = response.data;
        setAllItems(data);
        setFilteredItems(data);

        const uniqueStages = [...new Set(data.map(item => item.uniform?.stage).filter(Boolean))];
        const uniqueTypes = [...new Set(data.map(item => item.uniform?.type).filter(Boolean))];
        const uniqueSizes = [...new Set(data.map(item => item.uniform?.size).filter(Boolean))].sort((a, b) => a - b);
        
        setFilterOptions({ stages: uniqueStages, types: uniqueTypes, sizes: uniqueSizes });

      } catch (err) {
        setError('فشل في جلب بيانات المخزون');
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  useEffect(() => {
    let result = allItems;

    if (filters.stage !== 'all') {
      result = result.filter(item => item.uniform?.stage === filters.stage);
    }
    if (filters.type !== 'all') {
      result = result.filter(item => item.uniform?.type === filters.type);
    }
    if (filters.size !== 'all') {
      result = result.filter(item => item.uniform?.size === Number(filters.size));
    }
    // Apply the new date filter
    if (filters.entryDate) {
      result = result.filter(item => item.entryDate && item.entryDate.startsWith(filters.entryDate));
    }
    
    setFilteredItems(result);
    setSelectedItems(new Set()); 
  }, [filters, allItems]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prevFilters => ({ ...prevFilters, [name]: value }));
  };

  const clearDateFilter = () => {
    setFilters(prevFilters => ({ ...prevFilters, entryDate: '' }));
  };

  const handleSelectionChange = (itemId) => {
    const newSelection = new Set(selectedItems);
    if (newSelection.has(itemId)) {
      newSelection.delete(itemId);
    } else {
      newSelection.add(itemId);
    }
    setSelectedItems(newSelection);
  };

  const handleSelectAll = () => {
    const allFilteredIds = new Set(filteredItems.map(item => item._id));
    setSelectedItems(allFilteredIds);
  };

  const handleDeselectAll = () => {
    setSelectedItems(new Set());
  };
  
  const handlePrint = () => {
    window.print();
  };

  return (
    <Container className="mt-5">
      <div className="no-print">
        <Card className="mb-4">
          <Card.Header><h5>فلترة النتائج</h5></Card.Header>
          <Card.Body>
            <Row className="align-items-end">
              <Col md={3}><Form.Group><Form.Label>المرحلة الدراسية</Form.Label><Form.Select name="stage" value={filters.stage} onChange={handleFilterChange}><option value="all">الكل</option>{filterOptions.stages.map(stage => <option key={stage} value={stage}>{stage}</option>)}</Form.Select></Form.Group></Col>
              <Col md={3}><Form.Group><Form.Label>نوع الزي</Form.Label><Form.Select name="type" value={filters.type} onChange={handleFilterChange}><option value="all">الكل</option>{filterOptions.types.map(type => <option key={type} value={type}>{type}</option>)}</Form.Select></Form.Group></Col>
              <Col md={3}><Form.Group><Form.Label>المقاس</Form.Label><Form.Select name="size" value={filters.size} onChange={handleFilterChange}><option value="all">الكل</option>{filterOptions.sizes.map(size => <option key={size} value={size}>{size}</option>)}</Form.Select></Form.Group></Col>
              
              {/* --- فلتر التاريخ الجديد --- */}
              <Col md={3}>
                <Form.Group>
                  <Form.Label>تاريخ إضافة المخزون</Form.Label>
                  <InputGroup>
                    <Form.Control 
                      type="date" 
                      name="entryDate" 
                      value={filters.entryDate} 
                      onChange={handleFilterChange}
                    />
                    <Button variant="outline-secondary" onClick={clearDateFilter}>مسح</Button>
                  </InputGroup>
                </Form.Group>
              </Col>
            </Row>
          </Card.Body>
        </Card>
      </div>

      <div className="d-flex justify-content-between align-items-center mb-4 no-print">
        <div>
          <Button variant="outline-primary" size="sm" onClick={handleSelectAll} disabled={filteredItems.length === 0}>تحديد الكل</Button>
          <Button variant="outline-secondary" size="sm" className="ms-2" onClick={handleDeselectAll} disabled={selectedItems.size === 0}>إلغاء تحديد الكل</Button>
        </div>
        <div className="text-start">
          <h2 className="h4">طباعة الباركود ({selectedItems.size} / {filteredItems.length} قطعة محددة)</h2>
          <Button variant="success" onClick={handlePrint} disabled={selectedItems.size === 0}>🖨️ طباعة المحدد فقط</Button>
        </div>
      </div>

      {loading && <div className="text-center"><Spinner animation="border" /></div>}
      {error && <Alert variant="danger" className="no-print">{error}</Alert>}

      {!loading && !error && (
        <div className="printable">
          <Row>
            {filteredItems.length > 0 ? filteredItems.map((item) => {
              const isSelected = selectedItems.has(item._id);
              const hideOnPrint = selectedItems.size > 0 && !isSelected;
              
              return (
                <Col 
                  xs={4} 
                  key={item._id} 
                  className={`barcode-wrapper ${hideOnPrint ? 'hide-on-print' : ''}`}
                >
                  <div className="barcode-card">
                    <Form.Check 
                      type="checkbox"
                      id={`check-${item._id}`}
                      className="no-print barcode-checkbox"
                      checked={isSelected}
                      onChange={() => handleSelectionChange(item._id)}
                    />
                    <p className="school-name">مدارس الأندلس الأهلية</p>
                    <div className="barcode-container">
                      <BarcodeRenderer value={item.barcode} />
                    </div>
                    <p className="item-details">
                      {item.uniform.stage} - {item.uniform.type} (مقاس: {item.uniform.size})
                    </p>
                  </div>
                </Col>
              );
            }) : (
              <Col><Alert variant="info" className="no-print">لا توجد نتائج تطابق خيارات البحث.</Alert></Col>
            )}
          </Row>
        </div>
      )}
    </Container>
  );
}

export default PrintBarcodesPage;