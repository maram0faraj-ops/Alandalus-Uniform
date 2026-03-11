import React, { useState, useEffect, useCallback } from 'react';
import { Container, Table, Button, Spinner, Alert, Modal, Card, Form, Row, Col } from 'react-bootstrap';
import api from '../api';
import BarcodeScanner from '../components/BarcodeScanner';

function ManageInventoryPage() {
    const [allItems, setAllItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    
    const [filters, setFilters] = useState({ 
        stage: 'all', 
        type: 'all', 
        size: 'all',
        startDate: '',
        endDate: '' 
    });
    
    const [filterOptions, setFilterOptions] = useState({ stages: [], types: [], sizes: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [itemsToDelete, setItemsToDelete] = useState([]);
    const [showScanner, setShowScanner] = useState(false);

    const fetchItems = useCallback(async () => {
        try {
            const response = await api.get('/api/inventory?status=in_stock');
            const data = response.data;
            setAllItems(data);
            setFilteredItems(data);

            const uniqueStages = [...new Set(data.map(item => item.uniform?.stage?.trim()).filter(Boolean))];
            const uniqueTypes = [...new Set(data.map(item => item.uniform?.type?.trim()).filter(Boolean))];
            const uniqueSizes = [...new Set(data.map(item => item.uniform?.size).filter(Boolean))].sort((a, b) => a - b);
            
            setFilterOptions({ stages: uniqueStages, types: uniqueTypes, sizes: uniqueSizes });
        } catch (err) {
            setError('فشل في جلب بيانات المخزون.');
        } finally {
            setLoading(false);
        }
    }, []);

    useEffect(() => {
        fetchItems();
    }, [fetchItems]);

    useEffect(() => {
        let result = allItems;

        if (filters.stage !== 'all') {
            result = result.filter(item => item.uniform?.stage?.trim() === filters.stage);
        }
        if (filters.type !== 'all') {
            result = result.filter(item => item.uniform?.type?.trim() === filters.type);
        }
        if (filters.size !== 'all') {
            result = result.filter(item => item.uniform?.size === Number(filters.size));
        }
        if (filters.startDate) {
            const start = new Date(filters.startDate);
            start.setHours(0, 0, 0, 0); 
            result = result.filter(item => new Date(item.entryDate) >= start);
        }
        if (filters.endDate) {
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59, 999); 
            result = result.filter(item => new Date(item.entryDate) <= end);
        }

        setFilteredItems(result);
    }, [filters, allItems]);

    const handleClearAllStock = async () => {
        if (window.confirm("⚠️ هل أنتِ متأكدة من حذف كامل المخزون؟ سيتم مسح جميع الباركودات المسجلة حالياً.")) {
            try {
                setLoading(true);
                await api.delete('/api/inventory/clear-all');
                setAllItems([]);
                setFilteredItems([]);
                alert("تم تصفير المخزون بنجاح.");
            } catch (err) {
                setError('حدث خطأ أثناء تصفير المخزون.');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleScanSuccess = (scannedBarcode) => {
        setShowScanner(false);
        const itemFound = allItems.find(item => item.barcode === scannedBarcode);
        if (itemFound) {
            setItemsToDelete([itemFound]);
            setShowConfirmModal(true);
        } else {
            setError('الباركود غير موجود في المخزون الحالي.');
        }
    };

    const handleFilterChange = (e) => {
        setFilters(prev => ({ ...prev, [e.target.name]: e.target.value }));
    };

    const resetFilters = () => {
        setFilters({ stage: 'all', type: 'all', size: 'all', startDate: '', endDate: '' });
    };

    const handleDeleteConfirmed = async () => {
        try {
            const deletePromises = itemsToDelete.map(item => api.delete(`/api/inventory/${item._id}`));
            await Promise.all(deletePromises);
            const deletedIds = new Set(itemsToDelete.map(i => i._id));
            setAllItems(current => current.filter(item => !deletedIds.has(item._id)));
            setShowConfirmModal(false);
        } catch (err) {
            setError('فشل في حذف العناصر.');
        }
    };

    if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;

    return (
        <>
            <Container className="mt-5">
                {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
                
                {showScanner && (
                    <Modal show={showScanner} onHide={() => setShowScanner(false)} centered>
                        <Modal.Header closeButton><Modal.Title>امسح QR Code للحذف</Modal.Title></Modal.Header>
                        <Modal.Body><BarcodeScanner onScanSuccess={handleScanSuccess} onScanError={() => setError('فشل المسح')} /></Modal.Body>
                    </Modal>
                )}

                <h2 className="mb-4">إدارة المخزون</h2>
                <Card className="mb-4 shadow-sm">
                    <Card.Header>
                        <div className="d-flex justify-content-between align-items-center">
                            <h5>بحث وتصفية</h5>
                            <div>
                                <Button variant="danger" size="sm" onClick={handleClearAllStock} className="me-2">🛑 مسح كامل المخزون</Button>
                                <Button variant="secondary" size="sm" onClick={resetFilters}>إعادة تعيين</Button>
                            </div>
                        </div>
                    </Card.Header>
                    <Card.Body>
                        <Row className="mb-3">
                            <Col md={3}><Form.Group><Form.Label>المرحلة</Form.Label><Form.Select name="stage" value={filters.stage} onChange={handleFilterChange}><option value="all">الكل</option>{filterOptions.stages.map(s => <option key={s} value={s}>{s}</option>)}</Form.Select></Form.Group></Col>
                            <Col md={3}><Form.Group><Form.Label>النوع</Form.Label><Form.Select name="type" value={filters.type} onChange={handleFilterChange}><option value="all">الكل</option>{filterOptions.types.map(t => <option key={t} value={t}>{t}</option>)}</Form.Select></Form.Group></Col>
                            <Col md={3}><Form.Group><Form.Label>المقاس</Form.Label><Form.Select name="size" value={filters.size} onChange={handleFilterChange}><option value="all">الكل</option>{filterOptions.sizes.map(z => <option key={z} value={z}>{z}</option>)}</Form.Select></Form.Group></Col>
                            <Col md={3} className="d-flex align-items-end"><Button variant="primary" className="w-100" onClick={() => setShowScanner(true)}>📸 مسح QR للحذف</Button></Col>
                        </Row>
                        <Row>
                            <Col md={4}><Form.Group><Form.Label>من تاريخ</Form.Label><Form.Control type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} /></Form.Group></Col>
                            <Col md={4}><Form.Group><Form.Label>إلى تاريخ</Form.Label><Form.Control type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} /></Form.Group></Col>
                        </Row>
                    </Card.Body>
                </Card>

                <Table striped bordered hover responsive>
                    <thead>
                        <tr>
                            <th>#</th><th>المرحلة</th><th>النوع</th><th>المقاس</th><th>الباركود</th><th>تاريخ الإضافة</th><th>إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.map((item, index) => (
                            <tr key={item._id}>
                                <td>{index + 1}</td>
                                <td>{item.uniform?.stage}</td>
                                <td>{item.uniform?.type}</td>
                                <td>{item.uniform?.size}</td>
                                <td>{item.barcode}</td>
                                <td>{new Date(item.entryDate).toLocaleDateString('ar-SA')}</td>
                                <td><Button variant="outline-danger" size="sm" onClick={() => {setItemsToDelete([item]); setShowConfirmModal(true);}}>حذف</Button></td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Container>

            <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
                <Modal.Header closeButton className="bg-danger text-white"><Modal.Title>تأكيد الحذف</Modal.Title></Modal.Header>
                <Modal.Body><p>هل أنتِ متأكدة من حذف <strong>{itemsToDelete.length}</strong> عنصر؟</p></Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>إلغاء</Button>
                    <Button variant="danger" onClick={handleDeleteConfirmed}>تأكيد الحذف</Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default ManageInventoryPage;