import React, { useState, useEffect, useCallback } from 'react';
import { Container, Button, Row, Col, Card, Alert, Spinner, Form } from 'react-bootstrap';
import api from '../api';
import { QRCodeSVG } from 'qrcode.react';

function PrintBarcodesPage() {
    const [allItems, setAllItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [filters, setFilters] = useState({ stage: 'all', type: 'all', size: 'all', date: '' });
    const [filterOptions, setFilterOptions] = useState({ stages: [], types: [], sizes: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/inventory?status=in_stock');
            const data = Array.isArray(response.data) ? response.data : [];
            setAllItems(data);
            setFilteredItems(data);

            const uniqueStages = [...new Set(data.map(item => item.uniform?.stage?.trim()).filter(Boolean))];
            const uniqueTypes = [...new Set(data.map(item => item.uniform?.type?.trim()).filter(Boolean))];
            const uniqueSizes = [...new Set(data.map(item => item.uniform?.size).filter(Boolean))].sort((a, b) => a - b);
            
            setFilterOptions({ stages: uniqueStages, types: uniqueTypes, sizes: uniqueSizes });
        } catch (err) {
            setError('فشل في جلب البيانات.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => { fetchData(); }, [fetchData]);

    useEffect(() => {
        let result = allItems;
        if (filters.stage !== 'all') result = result.filter(item => item.uniform?.stage?.trim() === filters.stage);
        if (filters.type !== 'all') result = result.filter(item => item.uniform?.type?.trim() === filters.type);
        if (filters.size !== 'all') result = result.filter(item => item.uniform?.size === Number(filters.size));
        if (filters.date) result = result.filter(item => new Date(item.entryDate).toISOString().split('T')[0] === filters.date);
        setFilteredItems(result);
    }, [filters, allItems]);

    const handleSelectOne = (id) => {
        const newSelected = new Set(selectedIds);
        newSelected.has(id) ? newSelected.delete(id) : newSelected.add(id);
        setSelectedIds(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedIds.size === filteredItems.length) {
            setSelectedIds(new Set());
        } else {
            setSelectedIds(new Set(filteredItems.map(item => item._id)));
        }
    };

    if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;

    return (
        <Container className="mt-4 no-print-container" dir="rtl">
            <div className="no-print">
                <h2 className="text-center mb-4">نظام إدارة ملصقات الزي</h2>
                
                <Card className="mb-4 shadow-sm p-3">
                    <Row className="g-3 align-items-end text-center">
                        <Col md={3}>
                            <Form.Label className="small text-muted">المرحلة</Form.Label>
                            <Form.Select value={filters.stage} onChange={(e) => setFilters({...filters, stage: e.target.value})}>
                                <option value="all">الكل</option>
                                {filterOptions.stages.map(s => <option key={s} value={s}>{s}</option>)}
                            </Form.Select>
                        </Col>
                        <Col md={3}>
                            <Form.Label className="small text-muted">النوع</Form.Label>
                            <Form.Select value={filters.type} onChange={(e) => setFilters({...filters, type: e.target.value})}>
                                <option value="all">الكل</option>
                                {filterOptions.types.map(t => <option key={t} value={t}>{t}</option>)}
                            </Form.Select>
                        </Col>
                        <Col md={3}>
                            <Form.Label className="small text-muted">المقاس</Form.Label>
                            <Form.Select value={filters.size} onChange={(e) => setFilters({...filters, size: e.target.value})}>
                                <option value="all">الكل</option>
                                {filterOptions.sizes.map(z => <option key={z} value={z}>{z}</option>)}
                            </Form.Select>
                        </Col>
                        <Col md={3}>
                            <Form.Label className="small text-muted">التاريخ</Form.Label>
                            <Form.Control type="date" value={filters.date} onChange={(e) => setFilters({...filters, date: e.target.value})} />
                        </Col>
                    </Row>
                </Card>

                <div className="d-flex justify-content-between mb-4">
                    <Button variant="success" onClick={() => window.print()} disabled={selectedIds.size === 0}>
                        🖨️ طباعة المختار ({selectedIds.size})
                    </Button>
                    <Button variant="outline-primary" onClick={handleSelectAll}>
                        {selectedIds.size === filteredItems.length ? 'إلغاء الكل' : 'تحديد الكل'}
                    </Button>
                </div>

                <Row xs={1} md={2} lg={4} className="g-4">
                    {filteredItems.map((item) => (
                        <Col key={item._id}>
                            <Card className={`h-100 text-center p-3 border-0 shadow-sm ${selectedIds.has(item._id) ? 'bg-light border-primary' : ''}`} 
                                  onClick={() => handleSelectOne(item._id)} style={{ cursor: 'pointer' }}>
                                <Form.Check type="checkbox" checked={selectedIds.has(item._id)} readOnly className="mb-2" />
                                <div className="fw-bold mb-1 small text-dark">مدارس الأندلس الأهلية</div>
                                <div className="my-2"><QRCodeSVG value={item.barcode} size={100} /></div>
                                <div className="font-monospace small fw-bold mb-1">{item.barcode}</div>
                                <div className="text-muted" style={{ fontSize: '0.75rem' }}>{item.uniform?.stage} - {item.uniform?.type}</div>
                                <div className="fw-bold small">المقاس: {item.uniform?.size}</div>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </div>

            <div className="print-area">
                <style>
                    {`
                    @media print {
                        @page { size: letter; margin: 0.5in 0.15in; }
                        body { direction: rtl; }
                        .no-print-container { display: none !important; }
                        .print-area { display: block !important; }
                        .labels-grid { display: grid; grid-template-columns: 4in 4in; grid-auto-rows: 2in; column-gap: 0.125in; }
                        .label-item { width: 4in; height: 2in; padding: 0.15in; text-align: center; display: flex; flex-direction: column; align-items: center; justify-content: center; page-break-inside: avoid; }
                        .school-title { font-size: 14pt; font-weight: bold; margin-bottom: 2pt; }
                        .qr-svg { width: 1.1in !important; height: 1.1in !important; }
                        .barcode-txt { font-size: 10pt; font-family: monospace; font-weight: bold; margin-top: 2pt; }
                        .details { font-size: 9pt; }
                    }
                    `}
                </style>
                <div className="labels-grid">
                    {allItems.filter(i => selectedIds.has(i._id)).map((item) => (
                        <div key={item._id} className="label-item">
                            <div className="school-title">مدارس الأندلس الأهلية</div>
                            <QRCodeSVG value={item.barcode} className="qr-svg" level="H" />
                            <div className="barcode-txt">{item.barcode}</div>
                            <div className="details">{item.uniform?.stage} - {item.uniform?.type} | المقاس: {item.uniform?.size}</div>
                        </div>
                    ))}
                </div>
            </div>
        </Container>
    );
}

export default PrintBarcodesPage;