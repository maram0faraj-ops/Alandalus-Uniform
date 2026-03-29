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

    // جلب البيانات الأساسية من السيرفر
    const fetchData = useCallback(async () => {
        try {
            setLoading(true);
            const response = await api.get('/api/inventory?status=in_stock');
            const data = Array.isArray(response.data) ? response.data : [];
            setAllItems(data);
            setFilteredItems(data);

            // استخراج خيارات الفلترة المتاحة
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

    // منطق الفلترة (المرحلة، النوع، المقاس)
    useEffect(() => {
        let result = allItems;
        if (filters.stage !== 'all') result = result.filter(item => item.uniform?.stage?.trim() === filters.stage);
        if (filters.type !== 'all') result = result.filter(item => item.uniform?.type?.trim() === filters.type);
        if (filters.size !== 'all') result = result.filter(item => item.uniform?.size === Number(filters.size));
        setFilteredItems(result);
    }, [filters, allItems]);

    // منطق التحديد المتعدد
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

    // تصفية العناصر المختارة للطباعة فقط
    const itemsToPrint = allItems.filter(item => selectedIds.has(item._id));

    if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;

    return (
        <Container className="mt-4 no-print-container" dir="rtl">
            <div className="no-print">
                <h2 className="mb-4">طباعة باركود الزي المدرسي (2" × 4")</h2>
                
                {error && <Alert variant="danger">{error}</Alert>}

                {/* قسم البحث والفلترة */}
                <Card className="mb-4 shadow-sm border-0 bg-light">
                    <Card.Body>
                        <Row className="align-items-end g-3">
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label className="fw-bold">المرحلة الدراسية</Form.Label>
                                    <Form.Select value={filters.stage} onChange={(e) => setFilters({...filters, stage: e.target.value})}>
                                        <option value="all">الكل</option>
                                        {filterOptions.stages.map(s => <option key={s} value={s}>{s}</option>)}
                                    </Form.Select>
                                </Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group>
                                    <Form.Label className="fw-bold">نوع الزي</Form.Label>
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
                                <Button variant="outline-secondary" onClick={fetchData}>تحديث</Button>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                {/* جدول عرض البيانات مع ميزة التحديد */}
                <Table striped bordered hover responsive className="text-center bg-white shadow-sm">
                    <thead className="table-dark">
                        <tr>
                            <th><Form.Check type="checkbox" onChange={handleSelectAll} checked={filteredItems.length > 0 && selectedIds.size === filteredItems.length} /></th>
                            <th>#</th>
                            <th>المرحلة</th>
                            <th>النوع</th>
                            <th>المقاس</th>
                            <th>الباركود</th>
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
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </div>

            {/* منطقة الطباعة المخصصة لملصقات 2" × 4" (MACO ML-1000) */}
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
                            grid-template-columns: 4in 4in; /* عمودين */
                            grid-auto-rows: 2in; /* ارتفاع 2 إنش */
                            column-gap: 0.125in;
                            row-gap: 0;
                            justify-content: center;
                        }

                        .label-item {
                            width: 4in; height: 2in;
                            padding: 0.15in; box-sizing: border-box;
                            display: flex; flex-direction: column;
                            align-items: center; justify-content: center;
                            text-align: center; page-break-inside: avoid;
                        }

                        .qr-svg { width: 1.1in !important; height: 1.1in !important; }
                        .school-name { font-size: 13pt; font-weight: bold; margin-bottom: 2pt; color: #001f3f; }
                        .barcode-text { font-size: 10pt; font-weight: bold; font-family: monospace; margin-top: 2pt; }
                        .item-details { font-size: 9pt; margin-top: 1pt; }
                    }
                    `}
                </style>

                <div className="labels-grid">
                    {itemsToPrint.map((item) => (
                        <div key={item._id} className="label-item">
                            <div className="school-name">مدارس الأندلس الأهلية - جدة</div>
                            <div className="qr-container">
                                <QRCodeSVG value={item.barcode} size={90} className="qr-svg" level="H" />
                            </div>
                            <div className="barcode-text">{item.barcode}</div>
                            <div className="item-details">
                                {item.uniform?.stage} - {item.uniform?.type} | <strong>مقاس: {item.uniform?.size}</strong>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        </Container>
    );
}

export default PrintBarcodesPage;