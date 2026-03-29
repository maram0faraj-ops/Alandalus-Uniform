import React, { useState, useEffect, useCallback } from 'react';
import { Container, Button, Row, Col, Card, Alert, Spinner } from 'react-bootstrap';
import api from '../api';
import { QRCodeSVG } from 'qrcode.react';

function PrintBarcodesPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    const fetchInventory = useCallback(async () => {
        try {
            setLoading(true);
            // جلب العناصر المتوفرة فقط لطباعتها
            const response = await api.get('/api/inventory?status=in_stock');
            setItems(Array.isArray(response.data) ? response.data : []);
        } catch (err) {
            setError('فشل في جلب بيانات الباركود للطباعة.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchInventory();
    }, [fetchInventory]);

    const handlePrint = () => {
        window.print();
    };

    if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;

    return (
        <Container className="mt-4 no-print-container">
            <div className="d-flex justify-content-between align-items-center mb-4 no-print">
                <h2>طباعة باركود الزي المدرسي (مقاس 2" × 4")</h2>
                <div>
                    <Button variant="secondary" className="me-2" onClick={fetchInventory}>تحديث البيانات</Button>
                    <Button variant="primary" onClick={handlePrint} disabled={items.length === 0}>🖨️ بدء الطباعة</Button>
                </div>
            </div>

            {error && <Alert variant="danger" className="no-print">{error}</Alert>}
            {items.length === 0 && !loading && <Alert variant="info" className="no-print">لا يوجد قطع في المخزون حالياً لطباعة باركود لها.</Alert>}

            {/* منطقة الطباعة المخصصة لمقاس ML-1000 */}
            <div className="print-area">
                <style>
                    {`
                    @media print {
                        @page {
                            size: letter; /* الورق الأمريكي القياسي */
                            margin: 0.5in 0.15in; /* هوامش دقيقة لتناسب الملصقات */
                        }
                        body { margin: 0; padding: 0; background: white !important; }
                        .no-print, .navbar, .no-print-container { display: none !important; }
                        .print-area { display: block !important; width: 100%; }
                        
                        .labels-grid {
                            display: grid;
                            grid-template-columns: repeat(2, 4in); /* عمودين بعرض 4 إنش لكل ملصق */
                            grid-auto-rows: 2in; /* ارتفاع الملصق 2 إنش */
                            column-gap: 0.12in; /* فجوة بسيطة بين الأعمدة */
                            row-gap: 0;
                            justify-content: center;
                        }

                        .label-item {
                            width: 4in;
                            height: 2in;
                            padding: 0.2in;
                            box-sizing: border-box;
                            display: flex;
                            flex-direction: column;
                            align-items: center;
                            justify-content: center;
                            text-align: center;
                            overflow: hidden;
                            border: 0.1pt solid #eee; /* إطار خفيف جداً للمساعدة في المحاذاة، يمكن إزالته */
                        }

                        .school-name { font-size: 14pt; font-weight: bold; margin-bottom: 5pt; }
                        .item-details { font-size: 10pt; margin-top: 5pt; }
                        .barcode-text { font-size: 9pt; font-family: monospace; margin-top: 3pt; font-weight: bold; }
                    }
                    `}
                </style>

                <div className="labels-grid">
                    {items.map((item) => (
                        <div key={item._id} className="label-item">
                            <div className="school-name text-dark">مدارس الأندلس الأهلية - جدة</div>
                            <QRCodeSVG 
                                value={item.barcode} 
                                size={80} 
                                level={"H"}
                                includeMargin={false}
                            />
                            <div className="barcode-text">{item.barcode}</div>
                            <div className="item-details">
                                {item.uniform?.stage} - {item.uniform?.type} <br/>
                                <strong>المقاس: {item.uniform?.size}</strong>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* عرض معاينة في الصفحة قبل الطباعة */}
            <Row className="no-print">
                {items.slice(0, 10).map((item) => (
                    <Col md={6} key={item._id} className="mb-3">
                        <Card className="text-center p-3 shadow-sm" style={{ height: '200px' }}>
                            <h6>{item.uniform?.stage} - {item.uniform?.type}</h6>
                            <div className="my-2">
                                <QRCodeSVG value={item.barcode} size={70} />
                            </div>
                            <small className="fw-bold text-primary">{item.barcode}</small>
                            <div className="mt-1">المقاس: {item.uniform?.size}</div>
                        </Card>
                    </Col>
                ))}
            </Row>
        </Container>
    );
}

export default PrintBarcodesPage;