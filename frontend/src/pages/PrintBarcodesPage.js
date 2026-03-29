import React, { useState, useEffect, useCallback } from 'react';
import { Container, Button, Row, Col, Card, Alert, Spinner, Form } from 'react-bootstrap';
import api from '../api';
import { QRCodeSVG } from 'qrcode.react';

function PrintBarcodesPage() {
    const [allItems, setAllItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [filters, setFilters] = useState({ stage: 'all', type: 'all', size: 'all' });
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
            setError('فشل في جلب بيانات الباركود.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    useEffect(() => {
        let result = allItems;
        if (filters.stage !== 'all') result = result.filter(item => item.uniform?.stage?.trim() === filters.stage);
        if (filters.type !== 'all') result = result.filter(item => item.uniform?.type?.trim() === filters.type);
        if (filters.size !== 'all') result = result.filter(item => item.uniform?.size === Number(filters.size));
        setFilteredItems(result);
    }, [filters, allItems]);

    const handleSelectAll = (e) => {
        setSelectedIds(e.target.checked ? new Set(filteredItems.map(item => item._id)) : new Set());
    };

    const handleSelectOne = (id) => {
        const newSelected = new Set(selectedIds);
        newSelected.has(id) ? newSelected.delete(id) : newSelected.add(id);
        setSelectedIds(newSelected);
    };

    const handlePrint = () => {
        window.print();
    };

    const itemsToPrint = filteredItems.filter(item => selectedIds.has(item._id));

    if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;

    return (
        <Container className="mt-4 no-print-container" dir="rtl">
            <div className="no-print">
                <h2 className="mb-4">طباعة باركود الزي المدرسي (2" × 4")</h2>
                
                {error && <Alert variant="danger">{error}</Alert>}

                <Card className="mb-4 shadow-sm">
                    <Card.Body>
                        <Row className="align-items-end">
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>المرحلة</Form.Label>
                                    <Form.Select value={filters.stage} onChange={(e) => setFilters({...filters, stage: e.target.value})}>
                                        <option value="all">الكل</option>
                                        {filterOptions.stages.map(s => <option key={s} value={s}>{s}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label>النوع</Form.Label>
                                    <Form.Select value={filters.type} onChange={(e) => setFilters({...filters, type: e.target.value})}>
                                        <option value="all">الكل</option>
                                        {filterOptions.types.map(t => <option key={t} value={t}>{t}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={4} className="d-flex gap-2">
                                <Button variant="primary" onClick={handlePrint} disabled={selectedIds.size === 0}>
                                    🖨️ طباعة المحدد ({selectedIds.size})
                                </Button>
                                <Button variant="secondary" onClick={fetchData}>تحديث</Button>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                <Table striped bordered hover responsive className="text-center">
                    <thead>
                        <tr>
                            <th><Form.Check type="checkbox" onChange={handleSelectAll} checked={filteredItems.length > 0 && selectedIds.size === filteredItems.length} /></th>
                            <th>#</th><th>المرحلة</th><th>النوع</th><th>المقاس</th><th>الباركود</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.map((item, index) => (
                            <tr key={item._id}>
                                <td><Form.Check type="checkbox" checked={selectedIds.has(item._id)} onChange={() => handleSelectOne(item._id)} /></td>
                                <td>{index + 1}</td><td>{item.uniform?.stage}</td><td>{item.uniform?.type}</td><td>{item.uniform?.size}</td><td>{item.barcode}</td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>

            {/* منطقة الطباعة المخصصة لـ MACO ML-1000 */}
            <div className="print-area">
                <style>
                    {`
                    @media print {
                        @page { size: letter; margin: 0.5in 0.15in; }
                        body { margin: 0; padding: 0; background: white !important; direction: rtl; }
                        .no-print, .navbar, .no-print-container, header, footer { display: none !important; }
                        .print-area { display: block !important; width: 100%; }
                        
                        .labels-grid {
                            display: grid;
                            grid-template-columns: 4in 4in;
                            grid-auto-rows: 2in;
                            column-gap: 0.125in;
                            row-gap: 0;
                            justify-content: center;
                        }

                        .label-item {
                            width: 4in; height: 2in;
                            padding: 0.1in; box-sizing: border-box;
                            display: flex; flex-direction: column;
                            align-items: center; justify-content: center;
                            text-align: center; page-break-inside: avoid;
                        }

                        .qr-svg { width: 1.2in !important; height: 1.2in !important; }
                        .school-name { font-size: 14pt; font-weight: bold; margin-bottom: 3pt; color: #001f3f; }
                        .barcode-text { font-size: 10pt; font-weight: bold; font-family: monospace; }
                        .item-details { font-size: 10pt; margin-top: 2pt; }
                    }
                    `}
                </style>

                <div className="labels-grid">
                    {itemsToPrint.map((item) => (
                        <div key={item._id} className="label-item">
                            <div className="school-name">مدارس الأندلس الأهلية - جدة</div>
                            <QRCodeSVG 
                                value={item.barcode} 
                                className="qr-svg"
                                level={"H"}
                            />
                            <div className="barcode-text">{item.barcode}</div>
                            <div className="item-details">
                                {item.uniform?.stage} - {item.uniform?.type} | <strong>المقاس: {item.uniform?.size}</strong>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Container>
    );
}

const Table = ({ children, ...props }) => <table className="table" {...props}>{children}</table>;

export default PrintBarcodesPage;