import React, { useState, useEffect, useCallback } from 'react';
import { Container, Button, Row, Col, Card, Alert, Spinner, Form, Table } from 'react-bootstrap';
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
            setError('فشل في جلب بيانات الباركود للطباعة.');
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

    const itemsToPrint = allItems.filter(item => selectedIds.has(item._id));

    if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;

    return (
        <Container className="mt-4 no-print-container" dir="rtl">
            <div className="no-print">
                <h2 className="mb-4 text-center">طباعة باركود الزي المدرسي (2" × 4")</h2>
                
                {error && <Alert variant="danger">{error}</Alert>}

                <Card className="mb-4 shadow-sm border-0 bg-light">
                    <Card.Body>
                        <Row className="align-items-end g-3">
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label className="fw-bold">المرحلة</Form.Label>
                                    <Form.Select value={filters.stage} onChange={(e) => setFilters({...filters, stage: e.target.value})}>
                                        <option value="all">الكل</option>
                                        {filterOptions.stages.map(s => <option key={s} value={s}>{s}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label className="fw-bold">النوع</Form.Label>
                                    <Form.Select value={filters.type} onChange={(e) => setFilters({...filters, type: e.target.value})}>
                                        <option value="all">الكل</option>
                                        {filterOptions.types.map(t => <option key={t} value={t}>{t}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label className="fw-bold">المقاس</Form.Label>
                                    <Form.Select value={filters.size} onChange={(e) => setFilters({...filters, size: e.target.value})}>
                                        <option value="all">الكل</option>
                                        {filterOptions.sizes.map(z => <option key={z} value={z}>{z}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3} className="d-flex gap-2">
                                <Button variant="primary" className="flex-grow-1 fw-bold" onClick={handlePrint} disabled={selectedIds.size === 0}>
                                    🖨️ طباعة المحدد ({selectedIds.size})
                                </Button>
                                <Button variant="outline-secondary" onClick={fetchData}>تحديث البيانات</Button>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                <Table striped bordered hover responsive className="text-center align-middle bg-white shadow-sm">
                    <thead className="table-dark">
                        <tr>
                            <th><Form.Check type="checkbox" onChange={handleSelectAll} checked={filteredItems.length > 0 && selectedIds.size === filteredItems.length} /></th>
                            <th>#</th>
                            <th>المرحلة</th>
                            <th>النوع</th>
                            <th>المقاس</th>
                            <th>الباركود</th>
                            <th>معاينة QR</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.map((item, index) => (
                            <tr key={item._id}>
                                <td><Form.Check type="checkbox" checked={selectedIds.has(item._id)} onChange={() => handleSelectOne(item._id)} /></td>
                                <td>{index + 1}</td>
                                <td>{item.uniform?.stage}</td>
                                <td>{item.uniform?.type}</td>
                                <td>{item.uniform?.size}</td>
                                <td className="font-monospace fw-bold">{item.barcode}</td>
                                <td>
                                    <div className="p-1 border bg-light d-inline-block">
                                        <QRCodeSVG value={item.barcode} size={50} level="M" />
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>

            {/* إعدادات الطباعة المخصصة لـ ML-1000 (10 ملصقات، 2" × 4") */}
            <div className="print-area">
                <style>
                    {`
                    @media print {
                        @page {
                            size: letter portrait; 
                            margin: 0.5in 0.15in; 
                        }
                        body { margin: 0; padding: 0; background: white !important; direction: rtl; -webkit-print-color-adjust: exact; }
                        .no-print, .navbar, .no-print-container, header, footer { display: none !important; }
                        .print-area { display: block !important; width: 100%; }
                        
                        .labels-grid {
                            display: grid !important;
                            grid-template-columns: 4in 4in !important; 
                            grid-auto-rows: 2in !important; 
                            column-gap: 0.125in !important; 
                            row-gap: 0 !important;
                            justify-content: center;
                        }

                        .label-item {
                            width: 4in !important;
                            height: 2in !important;
                            padding: 0.1in !important;
                            box-sizing: border-box !important;
                            display: flex !important;
                            flex-direction: column !important;
                            align-items: center !important;
                            justify-content: center !important;
                            text-align: center !important;
                            page-break-inside: avoid !important;
                            overflow: hidden !important;
                        }

                        .print-qr-svg { 
                            width: 1.1in !important; 
                            height: 1.1in !important; 
                            display: block !important;
                            margin: 1pt auto !important; 
                        }
                        
                        .school-name { font-size: 14pt !important; font-weight: bold !important; margin-bottom: 2pt !important; color: #001f3f !important; }
                        .barcode-text { font-size: 10pt !important; font-weight: bold !important; font-family: 'Courier New', monospace !important; margin-top: 2pt !important; }
                        .item-details { font-size: 10pt !important; margin-top: 1pt !important; }
                    }
                    `}
                </style>

                <div className="labels-grid">
                    {itemsToPrint.map((item) => (
                        <div key={item._id} className="label-item">
                            <div className="school-name">مدارس الأندلس الأهلية - جدة</div>
                            <QRCodeSVG 
                                value={item.barcode} 
                                className="print-qr-svg" 
                                level="H" 
                                includeMargin={false}
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

export default PrintBarcodesPage;