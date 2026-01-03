import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Spinner, Alert, Modal, Card, Form, Row, Col, Badge } from 'react-bootstrap';
import axios from 'axios';
import BarcodeScanner from '../components/BarcodeScanner';

function ManageInventoryPage() {
    // --- الحالات (States) ---
    const [allItems, setAllItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');

    // حالات الفلترة
    const [filters, setFilters] = useState({ 
        stage: 'all', 
        type: 'all', 
        size: 'all',
        dateFrom: '',
        dateTo: '' 
    });
    const [filterOptions, setFilterOptions] = useState({ stages: [], types: [], sizes: [] });

    // حالات الحذف والتحديد
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [itemsToDelete, setItemsToDelete] = useState([]); 
    const [selectedIds, setSelectedIds] = useState(new Set());

    // إعداد رابط الـ API (تأكد من تغييره إذا كان مختلفًا في بيئتك)
    const API_URL = 'http://localhost:5001';
    
    const getAuthHeader = () => {
        const token = localStorage.getItem('token');
        return { headers: { 'x-auth-token': token } };
    };

    // --- جلب البيانات ---
    useEffect(() => {
        const fetchItems = async () => {
            try {
                const response = await axios.get(`${API_URL}/api/inventory?status=in_stock`, getAuthHeader());
                const data = response.data;
                
                // معالجة البيانات وتوحيد حقول التاريخ
                const processedData = data.map(item => ({
                    ...item,
                    entryDate: item.entryDate || item.dateAdded || new Date().toISOString()
                }));
                
                setAllItems(processedData);
                setFilteredItems(processedData);
                
                // استخراج خيارات الفلترة الفريدة
                const uniqueStages = [...new Set(processedData.map(item => item.uniform?.stage || item.stage).filter(Boolean))];
                const uniqueTypes = [...new Set(processedData.map(item => item.uniform?.type || item.uniformType).filter(Boolean))];
                const uniqueSizes = [...new Set(processedData.map(item => item.uniform?.size || item.size).filter(Boolean))].sort((a, b) => a - b);
                
                setFilterOptions({ stages: uniqueStages, types: uniqueTypes, sizes: uniqueSizes });
            } catch (err) {
                console.error("Error fetching items:", err);
                if (err.response) {
                    setError(`خطأ من الخادم: ${err.response.statusText}`);
                } else if (err.request) {
                    setError('فشل الاتصال بالخادم. تأكد من تشغيله.');
                } else {
                    setError('فشل في تحميل بيانات المخزون.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchItems();
    }, []);

    // --- منطق الفلترة ---
    useEffect(() => {
        let result = allItems;

        // فلترة المرحلة
        if (filters.stage !== 'all') {
            result = result.filter(item => (item.uniform?.stage || item.stage) === filters.stage);
        }
        // فلترة النوع
        if (filters.type !== 'all') {
            result = result.filter(item => (item.uniform?.type || item.uniformType) === filters.type);
        }
        // فلترة المقاس
        if (filters.size !== 'all') {
            result = result.filter(item => (item.uniform?.size || item.size) === filters.size);
        }
        // فلترة التاريخ (من)
        if (filters.dateFrom) {
            const fromDate = new Date(filters.dateFrom).setHours(0, 0, 0, 0);
            result = result.filter(item => new Date(item.entryDate).setHours(0, 0, 0, 0) >= fromDate);
        }
        // فلترة التاريخ (إلى)
        if (filters.dateTo) {
            const toDate = new Date(filters.dateTo).setHours(23, 59, 59, 999);
            result = result.filter(item => new Date(item.entryDate).setHours(0, 0, 0, 0) <= toDate);
        }

        setFilteredItems(result);
        setSelectedIds(new Set()); // إعادة تعيين التحديد عند تغيير الفلترة لتجنب الأخطاء
    }, [filters, allItems]);

    // --- دوال التحديد المتعدد ---
    const handleSelectOne = (id) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) newSelected.delete(id);
        else newSelected.add(id);
        setSelectedIds(newSelected);
    };

    const handleSelectAll = (e) => {
        if (e.target.checked) {
            const allIds = filteredItems.map(item => item._id);
            setSelectedIds(new Set(allIds));
        } else {
            setSelectedIds(new Set());
        }
    };

    // --- دوال الحذف ---
    const handleShowDeleteConfirm = (items = []) => {
        setItemsToDelete(items);
        setShowConfirmModal(true);
    };

    const handleCloseConfirmModal = () => {
        setShowConfirmModal(false);
        setItemsToDelete([]);
    };

    const handleDeleteItems = async () => {
        try {
            // حذف العناصر المتعددة
            const deletePromises = itemsToDelete.map(item => 
                axios.delete(`${API_URL}/api/inventory/${item._id}`, getAuthHeader())
            );
            await Promise.all(deletePromises);

            // تحديث الواجهة بعد الحذف الناجح
            const deletedIds = new Set(itemsToDelete.map(i => i._id));
            setAllItems(prev => prev.filter(item => !deletedIds.has(item._id)));
            setSelectedIds(new Set());
            
            handleCloseConfirmModal();
        } catch (err) {
            console.error("Error deleting items:", err);
            alert('حدث خطأ أثناء عملية الحذف.');
        }
    };

    // مسح الفلاتر
    const clearFilters = () => {
        setFilters({ stage: 'all', type: 'all', size: 'all', dateFrom: '', dateTo: '' });
    };

    if (loading) return <Container className="text-center mt-5"><Spinner animation="border" variant="primary" /></Container>;
    if (error) return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;

    return (
        <>
            <Container className="mt-4">
                <Card className="mb-4 shadow-sm">
                    <Card.Body>
                        <Row className="align-items-center mb-3">
                            <Col><h3>إدارة المخزون ({filteredItems.length})</h3></Col>
                            <Col xs="auto">
                                {/* زر الحذف يظهر فقط عند تحديد عناصر */}
                                {selectedIds.size > 0 && (
                                    <Button 
                                        variant="danger" 
                                        onClick={() => {
                                            const items = filteredItems.filter(i => selectedIds.has(i._id));
                                            handleShowDeleteConfirm(items);
                                        }}
                                    >
                                        حذف المحدد ({selectedIds.size})
                                    </Button>
                                )}
                            </Col>
                        </Row>

                        <Form>
                            {/* الصف الأول من الفلاتر: الخصائص */}
                            <Row className="mb-3">
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label>المرحلة</Form.Label>
                                        <Form.Select 
                                            value={filters.stage} 
                                            onChange={(e) => setFilters({...filters, stage: e.target.value})}
                                        >
                                            <option value="all">الكل</option>
                                            {filterOptions.stages.map(s => <option key={s} value={s}>{s}</option>)}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label>النوع</Form.Label>
                                        <Form.Select 
                                            value={filters.type} 
                                            onChange={(e) => setFilters({...filters, type: e.target.value})}
                                        >
                                            <option value="all">الكل</option>
                                            {filterOptions.types.map(t => <option key={t} value={t}>{t}</option>)}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label>المقاس</Form.Label>
                                        <Form.Select 
                                            value={filters.size} 
                                            onChange={(e) => setFilters({...filters, size: e.target.value})}
                                        >
                                            <option value="all">الكل</option>
                                            {filterOptions.sizes.map(s => <option key={s} value={s}>{s}</option>)}
                                        </Form.Select>
                                    </Form.Group>
                                </Col>
                                <Col md={3} className="d-flex align-items-end">
                                    <Button variant="outline-secondary" onClick={clearFilters} className="w-100">
                                        مسح الفلاتر
                                    </Button>
                                </Col>
                            </Row>

                            {/* الصف الثاني من الفلاتر: التاريخ */}
                            <Row>
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label>من تاريخ</Form.Label>
                                        <Form.Control 
                                            type="date" 
                                            value={filters.dateFrom} 
                                            onChange={(e) => setFilters({...filters, dateFrom: e.target.value})} 
                                        />
                                    </Form.Group>
                                </Col>
                                <Col md={3}>
                                    <Form.Group>
                                        <Form.Label>إلى تاريخ</Form.Label>
                                        <Form.Control 
                                            type="date" 
                                            value={filters.dateTo} 
                                            onChange={(e) => setFilters({...filters, dateTo: e.target.value})} 
                                        />
                                    </Form.Group>
                                </Col>
                            </Row>
                        </Form>
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
                            <th>#</th>
                            <th>الباركود</th>
                            <th>المرحلة</th>
                            <th>النوع</th>
                            <th>المقاس</th>
                            <th>تاريخ الإضافة</th>
                            <th>الإجراءات</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredItems.length > 0 ? (
                            filteredItems.map((item, index) => (
                                <tr key={item._id}>
                                    <td>
                                        <Form.Check 
                                            type="checkbox" 
                                            checked={selectedIds.has(item._id)}
                                            onChange={() => handleSelectOne(item._id)}
                                        />
                                    </td>
                                    <td>{index + 1}</td>
                                    <td>{item.barcode}</td>
                                    {/* دعم الهيكلين القديم والجديد للبيانات */}
                                    <td>{item.uniform?.stage || item.stage}</td>
                                    <td>{item.uniform?.type || item.uniformType}</td>
                                    <td>{item.uniform?.size || item.size}</td>
                                    <td>{new Date(item.entryDate).toLocaleDateString('ar-SA')}</td>
                                    <td>
                                        <Button 
                                            variant="outline-danger" 
                                            size="sm" 
                                            onClick={() => handleShowDeleteConfirm([item])}
                                        >
                                            حذف
                                        </Button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="8" className="text-center py-4">لا توجد عناصر تطابق الفلترة</td>
                            </tr>
                        )}
                    </tbody>
                </Table>
            </Container>

            {/* نافذة تأكيد الحذف */}
            <Modal show={showConfirmModal} onHide={handleCloseConfirmModal} centered>
                <Modal.Header closeButton className="bg-danger text-white">
                    <Modal.Title>تأكيد الحذف</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>هل أنت متأكد من رغبتك في حذف <strong>{itemsToDelete.length}</strong> عنصر/عناصر من المخزون بشكل نهائي؟</p>
                    {itemsToDelete.length === 1 && (
                        <p>الباركود: <strong>{itemsToDelete[0].barcode}</strong></p>
                    )}
                    <Alert variant="warning">لا يمكن التراجع عن هذا الإجراء بعد التنفيذ.</Alert>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseConfirmModal}>إلغاء</Button>
                    <Button variant="danger" onClick={handleDeleteItems}>تأكيد الحذف</Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default ManageInventoryPage;