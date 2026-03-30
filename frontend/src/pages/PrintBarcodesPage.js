import React, { useState, useEffect, useCallback } from 'react';
import { Container, Button, Row, Col, Card, Spinner, Form } from 'react-bootstrap';
import api from '../api';
import { QRCodeSVG } from 'qrcode.react';

function PrintBarcodesPage() {
    const [allItems, setAllItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [filters, setFilters] = useState({ stage: 'all', type: 'all', size: 'all', date: '' });
    const [filterOptions, setFilterOptions] = useState({ stages: [], types: [], sizes: [] });
    const [loading, setLoading] = useState(true);

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
            console.error('Fetch Error:', err);
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
        if (newSelected.has(id)) { newSelected.delete(id); } 
        else { newSelected.add(id); }
        setSelectedIds(newSelected);
    };

    const handleSelectAll = () => {
        if (selectedIds.size === filteredItems.length) { setSelectedIds(new Set()); } 
        else { setSelectedIds(new Set(filteredItems.map(item => item._id))); }
    };

    if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;

    const itemsToPrint = allItems.filter(i => selectedIds.has(i._id));

    return (
        <Container className="mt-4" dir="rtl" style={{ maxWidth: '98%' }}>
            {/* واجهة التحكم - مخفية تماماً عند الطباعة */}
            <div className="no-print">
                <h2 className="text-center mb-4 fw-bold">نظام إدارة ملصقات الزي</h2>
                
                <Card className="mb-4 shadow-sm border-0 p-3 bg-white">
                    <Row className="g-3 align-items-end text-center">
                        <Col md={3}>
                            <Form.Label className="small fw-bold">المرحلة</Form.Label>
                            <Form.Select value={filters.stage} onChange={(e) => setFilters({...filters, stage: e.target.value})}>
                                <option value="all">الكل</option>
                                {filterOptions.stages.map(s => <option key={s} value={s}>{s}</option>)}
                            </Form.Select>
                        </Col>
                        <Col md={3}>
                            <Form.Label className="small fw-bold">النوع</Form.Label>
                            <Form.Select value={filters.type} onChange={(e) => setFilters({...filters, type: e.target.value})}>
                                <option value="all">الكل</option>
                                {filterOptions.types.map(t => <option key={t} value={t}>{t}</option>)}
                            </Form.Select>
                        </Col>
                        <Col md={3}>
                            <Form.Label className="small fw-bold">المقاس</Form.Label>
                            <Form.Select value={filters.size} onChange={(e) => setFilters({...filters, size: e.target.value})}>
                                <option value="all">الكل</option>
                                {filterOptions.sizes.map(z => <option key={z} value={z}>{z}</option>)}
                            </Form.Select>
                        </Col>
                        <Col md={3}>
                            <Form.Label className="small fw-bold">التاريخ</Form.Label>
                            <Form.Control type="date" value={filters.date} onChange={(e) => setFilters({...filters, date: e.target.value})} />
                        </Col>
                    </Row>
                </Card>

                <div className="d-flex justify-content-between mb-4 px-2">
                    <Button variant="success" className="px-4 fw-bold shadow-sm" onClick={() => window.print()} disabled={selectedIds.size === 0}>
                        🖨️ طباعة المختار ({selectedIds.size})
                    </Button>
                    <Button variant="outline-primary" className="px-4 fw-bold" onClick={handleSelectAll}>
                        {selectedIds.size === filteredItems.length ? 'إلغاء التحديد' : 'تحديد الكل'}
                    </Button>
                </div>

                {/* تم تعديل lg={4} إلى lg={5} ليصبح عدد الباركود 5 في الصف الواحد */}
                <Row xs={1} md={3} lg={5} className="g-3 px-2 mb-5">
                    {filteredItems.map((item) => (
                        <Col key={item._id}>
                            <Card 
                                className={`h-100 text-center p-2 border-2 shadow-sm ${selectedIds.has(item._id) ? 'border-primary bg-light' : 'border-light'}`} 
                                onClick={() => handleSelectOne(item._id)} 
                                style={{ cursor: 'pointer', borderRadius: '15px' }}
                            >
                                <div className="d-flex justify-content-center mb-1">
                                    <Form.Check type="checkbox" checked={selectedIds.has(item._id)} readOnly />
                                </div>
                                <div className="fw-bold mb-1" style={{ fontSize: '0.85rem' }}>مدارس الأندلس الأهلية</div>
                                <div className="my-1 d-flex justify-content-center">
                                    <QRCodeSVG value={item.barcode} size={90} />
                                </div>
                                <div className="font-monospace fw-bold mb-1 text-primary" style={{ fontSize: '0.75rem' }}>{item.barcode}</div>
                                <div className="text-muted mb-1" style={{ fontSize: '0.7rem' }}>{item.uniform?.stage} - {item.uniform?.type}</div>
                                <div className="fw-bold bg-dark text-white d-inline-block px-2 py-1 rounded-pill" style={{ fontSize: '0.75rem' }}>المقاس: {item.uniform?.size}</div>
                            </Card>
                        </Col>
                    ))}
                </Row>
            </div>

            {/* منطقة الطباعة المحسنة */}
            <div className="print-section">
                <style>
                    {`
                    @media screen {
                        .print-section { display: none; }
                    }
                    @media print {
                        @page { 
                            size: letter portrait; 
                            margin: 0.5in 0.15in; 
                        }
                        
                        body * { visibility: hidden !important; }
                        .print-section, .print-section * { 
                            visibility: visible !important; 
                        }
                        .print-section {
                            display: block !important;
                            position: absolute !important;
                            left: 0 !important;
                            top: 0 !important;
                            width: 100% !important;
                        }

                        .labels-grid { 
                            display: grid !important; 
                            grid-template-columns: 4in 4in !important; 
                            grid-auto-rows: 2in !important; 
                            column-gap: 0.125in !important; 
                            row-gap: 0 !important; 
                            justify-content: center !important; 
                        }

                        .label-item { 
                            width: 4in !important; 
                            height: 2in !important; 
                            padding: 0.15in !important; 
                            text-align: center !important; 
                            display: flex !important; 
                            flex-direction: column !important; 
                            align-items: center !important; 
                            justify-content: center !important; 
                            page-break-inside: avoid !important;
                        }

                        .school-title { font-size: 14pt !important; font-weight: bold !important; margin-bottom: 2pt !important; color: #001f3f !important; }
                        .qr-print { width: 1.1in !important; height: 1.1in !important; }
                        .barcode-txt { font-size: 10pt !important; font-family: monospace !important; font-weight: bold !important; margin-top: 2pt !important; }
                        .details { font-size: 9pt !important; margin-top: 1pt !important; }
                    }
                    `}
                </style>
                <div className="labels-grid">
                    {itemsToPrint.map((item) => (
                        <div key={item._id} className="label-item">
                            <div className="school-title">مدارس الأندلس الأهلية</div>
                            <QRCodeSVG value={item.barcode} className="qr-print" level="H" includeMargin={false} />
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