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
    
    // خاصية التحديد المتعدد المضافة
    const [selectedIds, setSelectedIds] = useState(new Set());

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

        setFilteredItems(result);
        setSelectedIds(new Set()); // إعادة تعيين التحديد عند تغيير الفلترة
    }, [filters, allItems]);

    // دالة تحديد الكل
    const handleSelectAll = (e) => {
        if (e.target.checked) {
            setSelectedIds(new Set(filteredItems.map(item => item._id)));
        } else {
            setSelectedIds(new Set());
        }
    };

    // دالة تحديد عنصر واحد
    const handleSelectOne = (id) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
        setSelectedIds(newSelected);
    };

    const handleClearAllStock = async () => {
        if (window.confirm("⚠️ هل أنتِ متأكدة من حذف كامل المخزون؟")) {
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

    const handleDeleteConfirmed = async () => {
        try {
            const deletePromises = itemsToDelete.map(item => api.delete(`/api/inventory/${item._id}`));
            await Promise.all(deletePromises);
            const deletedIds = new Set(itemsToDelete.map(i => i._id));
            setAllItems(current => current.filter(item => !deletedIds.has(item._id)));
            setShowConfirmModal(false);
            setSelectedIds(new Set()); // تنظيف التحديد بعد الحذف
        } catch (err) {
            setError('فشل في حذف العناصر.');
        }
    };

    if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;

    return (
        <Container className="mt-5 text-end" dir="rtl">
            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
            
            {showScanner && (
                <Modal show={showScanner} onHide={() => setShowScanner(false)} centered>
                    <Modal.Header closeButton><Modal.Title>امسح QR Code للحذف</Modal.Title></Modal.Header>
                    <Modal.Body><BarcodeScanner onScanSuccess={handleScanSuccess} onScanError={() => setError('فشل المسح')} /></Modal.Body>
                </Modal>
            )}

            <Card className="mb-4 shadow-sm">
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <h5>إدارة المخزون</h5>
                    <div>
                        <Button variant="danger" size="sm" onClick={handleClearAllStock} className="me-2">🛑 مسح كامل المخزون</Button>
                        {/* زر حذف المحدد يظهر فقط عند وجود اختيار */}
                        {selectedIds.size > 0 && (
                            <Button 
                                variant="warning" 
                                size="sm" 
                                className="me-2"
                                onClick={() => {
                                    const selectedItems = allItems.filter(item => selectedIds.has(item._id));
                                    setItemsToDelete(selectedItems);
                                    setShowConfirmModal(true);
                                }}
                            >
                                حذف المحدد ({selectedIds.size})
                            </Button>
                        )}
                        <Button variant="primary" size="sm" onClick={() => setShowScanner(true)}>📸 مسح QR للحذف</Button>
                    </div>
                </Card.Header>
                <Card.Body>
                    <Row>
                        <Col md={4}><Form.Select onChange={(e)=>setFilters({...filters, stage: e.target.value})}><option value="all">كل المراحل</option>{filterOptions.stages.map(s => <option key={s} value={s}>{s}</option>)}</Form.Select></Col>
                        <Col md={4}><Form.Select onChange={(e)=>setFilters({...filters, type: e.target.value})}><option value="all">كل الأنواع</option>{filterOptions.types.map(t => <option key={t} value={t}>{t}</option>)}</Form.Select></Col>
                        <Col md={4}><Button variant="secondary" className="w-100" onClick={() => setFilters({stage:'all', type:'all', size:'all'})}>إعادة تعيين</Button></Col>
                    </Row>
                </Card.Body>
            </Card>

            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        {/* خانة اختيار الكل في رأس الجدول */}
                        <th>
                            <Form.Check 
                                type="checkbox" 
                                onChange={handleSelectAll} 
                                checked={filteredItems.length > 0 && selectedIds.size === filteredItems.length} 
                            />
                        </th>
                        <th>#</th><th>المرحلة</th><th>النوع</th><th>المقاس</th><th>الباركود</th><th>تاريخ الإضافة</th><th>إجراءات</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredItems.map((item, index) => (
                        <tr key={item._id}>
                            {/* خانة اختيار العنصر */}
                            <td>
                                <Form.Check 
                                    type="checkbox" 
                                    checked={selectedIds.has(item._id)} 
                                    onChange={() => handleSelectOne(item._id)} 
                                />
                            </td>
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

            <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
                <Modal.Header closeButton className="bg-danger text-white"><Modal.Title>تأكيد الحذف</Modal.Title></Modal.Header>
                <Modal.Body><p>هل أنتِ متأكدة من حذف <strong>{itemsToDelete.length}</strong> عنصر؟</p></Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>إلغاء</Button>
                    <Button variant="danger" onClick={handleDeleteConfirmed}>تأكيد الحذف</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}

export default ManageInventoryPage;