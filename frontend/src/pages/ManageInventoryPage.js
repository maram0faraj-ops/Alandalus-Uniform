import React, { useState, useEffect } from 'react';
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
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [showScanner, setShowScanner] = useState(false);

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const response = await api.get('/api/inventory?status=in_stock');
                const data = response.data;
                setAllItems(data);
                setFilteredItems(data);

                // --- التعديل هنا: استخدام .trim() لتوحيد الأسماء المكررة ---
                const uniqueStages = [...new Set(data.map(item => item.uniform?.stage?.trim()).filter(Boolean))];
                const uniqueTypes = [...new Set(data.map(item => item.uniform?.type?.trim()).filter(Boolean))];
                // --------------------------------------------------------

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

        // --- التعديل هنا: استخدام .trim() عند المقارنة لدمج البيانات ---
        if (filters.stage !== 'all') {
            result = result.filter(item => item.uniform?.stage?.trim() === filters.stage);
        }
        if (filters.type !== 'all') {
            result = result.filter(item => item.uniform?.type?.trim() === filters.type);
        }
        // -----------------------------------------------------------
        
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
        setSelectedIds(new Set()); 
    }, [filters, allItems]);

    const handleScanSuccess = (scannedBarcode) => {
        setShowScanner(false);
        const itemFound = allItems.find(item => item.barcode === scannedBarcode);
        if (itemFound) {
            handleShowConfirmModal([itemFound]);
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

    const resetFilters = () => {
        setFilters({ stage: 'all', type: 'all', size: 'all', startDate: '', endDate: '' });
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = filteredItems.map(item => item._id);
            setSelectedIds(new Set(allIds));
        } else {
            setSelectedIds(new Set());
        }
    };

    const handleSelectOne = (id) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleShowConfirmModal = (items) => {
        setItemsToDelete(items);
        setShowConfirmModal(true);
    };

    const handleCloseConfirmModal = () => {
        setItemsToDelete([]);
        setShowConfirmModal(false);
    };

    const handleDeleteConfirmed = async () => {
        if (itemsToDelete.length === 0) return;
        
        try {
            const deletePromises = itemsToDelete.map(item => api.delete(`/api/inventory/${item._id}`));
            await Promise.all(deletePromises);

            const deletedIds = new Set(itemsToDelete.map(i => i._id));
            setAllItems(current => current.filter(item => !deletedIds.has(item._id)));
            setFilteredItems(current => current.filter(item => !deletedIds.has(item._id)));
            
            const newSelectedIds = new Set(selectedIds);
            itemsToDelete.forEach(item => newSelectedIds.delete(item._id));
            setSelectedIds(newSelectedIds);

            handleCloseConfirmModal();
        } catch (err) {
            setError('فشل في حذف بعض العناصر. يرجى المحاولة مرة أخرى.');
            console.error(err);
        }
    };

    if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;

    return (
        <>
            <Container className="mt-5">
                {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
                
                {showScanner && (
                    <Modal show={showScanner} onHide={() => setShowScanner(false)} centered>
                        <Modal.Header closeButton><Modal.Title>امسح الباركود للحذف</Modal.Title></Modal.Header>
                        <Modal.Body><BarcodeScanner onScanSuccess={handleScanSuccess} onScanError={handleScanError} /></Modal.Body>
                    </Modal>
                )}

                <h2 className="mb-4">إدارة المخزون</h2>
                <Card className="mb-4 shadow-sm">
                    <Card.Header>
                        <div className="d-flex justify-content-between align-items-center">
                            <h5>بحث وتصفية</h5>
                            <div>
                                <Button variant="secondary" size="sm" onClick={resetFilters} className="me-2">إعادة تعيين</Button>
                                {selectedIds.size > 0 && (
                                    <Button 
                                        variant="danger" 
                                        size="sm"
                                        onClick={() => {
                                            const items = filteredItems.filter(i => selectedIds.has(i._id));
                                            handleShowConfirmModal(items);
                                        }}
                                    >
                                        حذف المحدد ({selectedIds.size})
                                    </Button>
                                )}
                            </div>
                        </div>
                    </Card.Header>
                    <Card.Body>
                        <Row className="mb-3">
                            <Col md={3}><Form.Group><Form.Label>المرحلة</Form.Label><Form.Select name="stage" value={filters.stage} onChange={handleFilterChange}><option value="all">الكل</option>{filterOptions.stages.map(stage => <option key={stage} value={stage}>{stage}</option>)}</Form.Select></Form.Group></Col>
                            <Col md={3}><Form.Group><Form.Label>نوع الزي</Form.Label><Form.Select name="type" value={filters.type} onChange={handleFilterChange}><option value="all">الكل</option>{filterOptions.types.map(type => <option key={type} value={type}>{type}</option>)}</Form.Select></Form.Group></Col>
                            <Col md={3}><Form.Group><Form.Label>المقاس</Form.Label><Form.Select name="size" value={filters.size} onChange={handleFilterChange}><option value="all">الكل</option>{filterOptions.sizes.map(size => <option key={size} value={size}>{size}</option>)}</Form.Select></Form.Group></Col>
                            <Col md={3} className="d-flex align-items-end"><Button variant="primary" className="w-100" onClick={() => setShowScanner(true)}>📸 مسح باركود للحذف</Button></Col>
                        </Row>
                        
                        <Row>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>من تاريخ</Form.Label>
                                    <Form.Control type="date" name="startDate" value={filters.startDate} onChange={handleFilterChange} />
                                </Form.Group>
                            </Col>
                            <Col md={4}>
                                <Form.Group>
                                    <Form.Label>إلى تاريخ</Form.Label>
                                    <Form.Control type="date" name="endDate" value={filters.endDate} onChange={handleFilterChange} />
                                </Form.Group>
                            </Col>
                        </Row>
                    </Card.Body>
                </Card>

                <Table striped bordered hover responsive>
                    <thead>
                        <tr>
                            <th style={{width: '40px'}}>
                                <Form.Check 
                                    type="checkbox"
                                    onChange={handleSelectAll}
                                    checked={filteredItems.length > 0 && selectedIds.size === filteredItems.length}
                                />
                            </th>
                            <th>#</th><th>المرحلة</th><th>نوع الزي</th><th>المقاس</th><th>الباركود</th><th>تاريخ ووقت الإضافة</th><th>إجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.map((item, index) => (
                            <tr key={item._id}>
                                <td>
                                    <Form.Check 
                                        type="checkbox"
                                        checked={selectedIds.has(item._id)}
                                        onChange={() => handleSelectOne(item._id)}
                                    />
                                </td>
                                <td>{index + 1}</td><td>{item.uniform?.stage}</td><td>{item.uniform?.type}</td><td>{item.uniform?.size}</td><td>{item.barcode}</td>
                                <td>{new Date(item.entryDate).toLocaleString('ar-SA')}</td>
                                <td><Button variant="outline-danger" size="sm" onClick={() => handleShowConfirmModal([item])}>حذف</Button></td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Container>

            <Modal show={showConfirmModal} onHide={handleCloseConfirmModal} centered>
                <Modal.Header closeButton className="bg-danger text-white">
                    <Modal.Title>تأكيد الحذف</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>هل أنت متأكد من رغبتك في حذف <strong>{itemsToDelete.length}</strong> عنصر/عناصر؟</p>
                    {itemsToDelete.length === 1 && (
                         <p>الباركود: <strong>{itemsToDelete[0].barcode}</strong></p>
                    )}
                    <Alert variant="warning">لا يمكن التراجع عن هذا الإجراء.</Alert>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseConfirmModal}>إلغاء</Button>
                    <Button variant="danger" onClick={handleDeleteConfirmed}>تأكيد الحذف النهائي</Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default ManageInventoryPage;