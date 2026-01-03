import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Spinner, Alert, Modal, Card, Form, Row, Col } from 'react-bootstrap';
import axios from 'axios';
import BarcodeScanner from '../components/BarcodeScanner';

function ManageInventoryPage() {
    const [allItems, setAllItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [filters, setFilters] = useState({ stage: 'all', type: 'all', size: 'all' });
    const [filterOptions, setFilterOptions] = useState({ stages: [], types: [], sizes: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // حالات الحذف
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [itemsToDelete, setItemsToDelete] = useState([]); 
    
    // حالات التحديد المتعدد
    const [selectedIds, setSelectedIds] = useState(new Set());

    const [showScanner, setShowScanner] = useState(false);

    // إعداد axios مع التوكن
    const getAuthHeader = () => {
        const token = localStorage.getItem('token');
        return { headers: { 'x-auth-token': token } };
    };

    const API_URL = 'http://localhost:5001'; 

    useEffect(() => {
        const fetchItems = async () => {
            try {
                // استخدام axios مباشرة مع الرابط الكامل
                const response = await axios.get(`${API_URL}/api/inventory?status=in_stock`, getAuthHeader());
                const data = response.data;
                // إضافة dateAdded إذا لم يكن موجوداً
                const processedData = data.map(item => ({
                    ...item,
                    entryDate: item.entryDate || new Date().toISOString()
                }));
                
                setAllItems(processedData);
                setFilteredItems(processedData);
                
                const uniqueStages = [...new Set(processedData.map(item => item.uniform?.stage).filter(Boolean))];
                const uniqueTypes = [...new Set(processedData.map(item => item.uniform?.type).filter(Boolean))];
                const uniqueSizes = [...new Set(processedData.map(item => item.uniform?.size).filter(Boolean))].sort((a, b) => a - b);
                
                setFilterOptions({ stages: uniqueStages, types: uniqueTypes, sizes: uniqueSizes });
            } catch (err) {
                console.error("Error fetching items:", err);
                setError('فشل في تحميل بيانات المخزون.');
            } finally {
                setLoading(false);
            }
        };

        fetchItems();
    }, []);

    // الفلترة
    useEffect(() => {
        let result = allItems;
        if (filters.stage !== 'all') result = result.filter(item => item.uniform?.stage === filters.stage);
        if (filters.type !== 'all') result = result.filter(item => item.uniform?.type === filters.type);
        if (filters.size !== 'all') result = result.filter(item => item.uniform?.size === filters.size);
        setFilteredItems(result);
        setSelectedIds(new Set()); // إعادة تعيين التحديد عند الفلترة
    }, [filters, allItems]);


    // --- دوال التحديد المتعدد ---

    const handleSelectOne = (id) => {
        const newSelected = new Set(selectedIds);
        if (newSelected.has(id)) {
            newSelected.delete(id);
        } else {
            newSelected.add(id);
        }
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
            const deletePromises = itemsToDelete.map(item => axios.delete(`${API_URL}/api/inventory/${item._id}`, getAuthHeader()));
            await Promise.all(deletePromises);

            // تحديث الواجهة
            const deletedIds = new Set(itemsToDelete.map(i => i._id));
            setAllItems(prev => prev.filter(item => !deletedIds.has(item._id)));
            setSelectedIds(new Set());
            
            handleCloseConfirmModal();
        } catch (err) {
            console.error("Error deleting items:", err);
            alert('حدث خطأ أثناء عملية الحذف.');
        }
    };

    if (loading) return <Container className="text-center mt-5"><Spinner animation="border" variant="primary" /></Container>;
    if (error) return <Container className="mt-5"><Alert variant="danger">{error}</Alert></Container>;

    return (
        <>
            <Container className="mt-4">
                <Card className="mb-4 shadow-sm">
                    <Card.Body>
                        <Row className="align-items-center">
                            <Col><h3>إدارة المخزون ({filteredItems.length})</h3></Col>
                            <Col xs="auto">
                                {/* زر الحذف الجماعي */}
                                {selectedIds.size > 0 && (
                                    <Button 
                                        variant="danger" 
                                        onClick={() => {
                                            const items = filteredItems.filter(i => selectedIds.has(i._id));
                                            handleShowDeleteConfirm(items);
                                        }}
                                        className="me-2"
                                    >
                                        حذف المحدد ({selectedIds.size})
                                    </Button>
                                )}
                            </Col>
                        </Row>
                         <Row className="mt-3">
                            <Col md={3}>
                                <Form.Select value={filters.stage} onChange={(e) => setFilters({...filters, stage: e.target.value})}>
                                    <option value="all">كل المراحل</option>
                                    {filterOptions.stages.map(s => <option key={s} value={s}>{s}</option>)}
                                </Form.Select>
                            </Col>
                            <Col md={3}>
                                <Form.Select value={filters.type} onChange={(e) => setFilters({...filters, type: e.target.value})}>
                                    <option value="all">كل الأنواع</option>
                                    {filterOptions.types.map(t => <option key={t} value={t}>{t}</option>)}
                                </Form.Select>
                            </Col>
                             <Col md={3}>
                                <Form.Select value={filters.size} onChange={(e) => setFilters({...filters, size: e.target.value})}>
                                    <option value="all">كل المقاسات</option>
                                    {filterOptions.sizes.map(s => <option key={s} value={s}>{s}</option>)}
                                </Form.Select>
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
                            <th>#</th>
                            <th>المرحلة</th>
                            <th>نوع الزي</th>
                            <th>المقاس</th>
                            <th>الباركود</th>
                            <th>تاريخ الإضافة</th>
                            <th>إجراءات</th>
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
                                <td>{index + 1}</td>
                                <td>{item.uniform?.stage}</td>
                                <td>{item.uniform?.type}</td>
                                <td>{item.uniform?.size}</td>
                                <td>{item.barcode}</td>
                                <td>{new Date(item.entryDate).toLocaleString('ar-SA')}</td>
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
                        ))}
                    </tbody>
                </Table>
            </Container>

            <Modal show={showConfirmModal} onHide={handleCloseConfirmModal} centered>
                <Modal.Header closeButton className="bg-danger text-white">
                    <Modal.Title>تأكيد الحذف</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <p>هل أنت متأكد من رغبتك في حذف <strong>{itemsToDelete.length}</strong> عنصر/عناصر من المخزون؟</p>
                    {itemsToDelete.length === 1 && (
                        <p>الباركود: <strong>{itemsToDelete[0].barcode}</strong></p>
                    )}
                    <Alert variant="warning">لا يمكن التراجع عن هذا الإجراء.</Alert>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseConfirmModal}>إلغاء</Button>
                    <Button variant="danger" onClick={handleDeleteItems}>تأكيد الحذف النهائي</Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default ManageInventoryPage;