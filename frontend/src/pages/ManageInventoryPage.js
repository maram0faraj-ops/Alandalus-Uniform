import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Spinner, Alert, Modal, Card, Form, Row, Col } from 'react-bootstrap';
import api from '../api';
import BarcodeScanner from '../components/BarcodeScanner'; // <-- استيراد مكون الماسح الضوئي

function ManageInventoryPage() {
    const [allItems, setAllItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [filters, setFilters] = useState({ stage: 'all', type: 'all', size: 'all' });
    const [filterOptions, setFilterOptions] = useState({ stages: [], types: [], sizes: [] });
     const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
     const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);
    
    // --- حالة جديدة للتحكم في ظهور الكاميرا ---
    const [showScanner, setShowScanner] = useState(false);

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
                setError('فشل في جلب بيانات المخزون.');
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
        setFilteredItems(result);
    }, [filters, allItems]);

    // --- دوال جديدة خاصة بمسح الباركود ---
    const handleScanSuccess = (scannedBarcode) => {
        setShowScanner(false); // إغلاق الكاميرا
        const itemFound = allItems.find(item => item.barcode === scannedBarcode);

        if (itemFound) {
            handleShowConfirmModal(itemFound); // إظهار نافذة التأكيد للقطعة
        } else {
            setError('الباركود غير موجود في المخزون الحالي.');
        }
    };

    const handleScanError = (err) => {
        setShowScanner(false);
        setError('فشل في قراءة الباركود، يرجى المحاولة مرة أخرى.');
        console.error(err);
    };

    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const handleShowConfirmModal = (item) => {
        setItemToDelete(item);
        setShowConfirmModal(true);
    };

    const handleCloseConfirmModal = () => {
        setItemToDelete(null);
        setShowConfirmModal(false);
    };

    const handleDeleteItem = async () => {
        if (!itemToDelete) return;
        try {
            await api.delete(`/api/inventory/${itemToDelete._id}`);
             setAllItems(currentItems => currentItems.filter(item => item._id !== itemToDelete._id));
            setFilteredItems(currentItems => currentItems.filter(item => item._id !== itemToDelete._id));
            handleCloseConfirmModal();
        } catch (err) {
            setError('فشل في حذف القطعة. يرجى المحاولة مرة أخرى.');
            console.error(err);
        }
    };

     if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;

    return (
        <>
            <Container className="mt-5">
                {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
                
                {/* --- عرض الماسح الضوئي عند تفعيله --- */}
                {showScanner && (
                    <Modal show={showScanner} onHide={() => setShowScanner(false)} centered>
                        <Modal.Header closeButton>
                            <Modal.Title>امسح الباركود للحذف</Modal.Title>
                        </Modal.Header>
                        <Modal.Body>
                            <BarcodeScanner 
                                onScanSuccess={handleScanSuccess}
                                onScanError={handleScanError}
                            />
                        </Modal.Body>
                    </Modal>
                )}

                 <h2 className="mb-4">إدارة المخزون</h2>
                <Card className="mb-4">
                    <Card.Header><h5>بحث وتصفية</h5></Card.Header>
                    <Card.Body>
                        <Row>
                            <Col md={3}>
                                <Form.Group><Form.Label>المرحلة</Form.Label><Form.Select name="stage" value={filters.stage} onChange={handleFilterChange}><option value="all">الكل</option>{filterOptions.stages.map(stage => <option key={stage} value={stage}>{stage}</option>)}</Form.Select></Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group><Form.Label>نوع الزي</Form.Label><Form.Select name="type" value={filters.type} onChange={handleFilterChange}><option value="all">الكل</option>{filterOptions.types.map(type => <option key={type} value={type}>{type}</option>)}</Form.Select></Form.Group>
                            </Col>
                            <Col md={3}>
                                <Form.Group><Form.Label>المقاس</Form.Label><Form.Select name="size" value={filters.size} onChange={handleFilterChange}><option value="all">الكل</option>{filterOptions.sizes.map(size => <option key={size} value={size}>{size}</option>)}</Form.Select></Form.Group>
                            </Col>
                             {/* --- زر المسح بالكاميرا الجديد --- */}
                            <Col md={3} className="d-flex align-items-end">
                                <Button variant="primary" className="w-100" onClick={() => setShowScanner(true)}>
                                    📸 مسح باركود للحذف
                                </Button>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                <Table striped bordered hover responsive>
                    <thead>
                        <tr>
                            <th>#</th><th>المرحلة</th><th>نوع الزي</th><th>المقاس</th><th>الباركود</th><th>تاريخ الإضافة</th><th>إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.map((item, index) => (
                            <tr key={item._id}>
                                <td>{index + 1}</td><td>{item.uniform?.stage}</td><td>{item.uniform?.type}</td><td>{item.uniform?.size}</td><td>{item.barcode}</td><td>{new Date(item.entryDate).toLocaleDateString('ar-SA')}</td>
                                <td><Button variant="danger" size="sm" onClick={() => handleShowConfirmModal(item)}>حذف</Button></td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Container>

            <Modal show={showConfirmModal} onHide={handleCloseConfirmModal} centered>
                <Modal.Header closeButton><Modal.Title>تأكيد الحذف</Modal.Title></Modal.Header>
                <Modal.Body>
                    هل أنت متأكد من رغبتك في حذف هذه القطعة بشكل نهائي؟<br /><strong>الباركود: {itemToDelete?.barcode}</strong>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseConfirmModal}>إلغاء</Button>
                    <Button variant="danger" onClick={handleDeleteItem}>تأكيد الحذف</Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default ManageInventoryPage;