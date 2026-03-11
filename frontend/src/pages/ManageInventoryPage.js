import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Spinner, Alert, Modal, Card, Form, Row, Col } from 'react-bootstrap';
import api from '../api';
import BarcodeScanner from '../components/BarcodeScanner';

function ManageInventoryPage() {
    const [allItems, setAllItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [filters, setFilters] = useState({ stage: 'all', type: 'all', size: 'all', startDate: '', endDate: '' });
    const [filterOptions, setFilterOptions] = useState({ stages: [], types: [], sizes: [] });
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [itemsToDelete, setItemsToDelete] = useState([]);
    const [selectedIds, setSelectedIds] = useState(new Set());
    const [showScanner, setShowScanner] = useState(false);

    const fetchItems = async () => {
        try {
            const response = await api.get('/api/inventory?status=in_stock');
            setAllItems(response.data);
            setFilteredItems(response.data);
            const data = response.data;
            const uniqueStages = [...new Set(data.map(item => item.uniform?.stage?.trim()).filter(Boolean))];
            const uniqueTypes = [...new Set(data.map(item => item.uniform?.type?.trim()).filter(Boolean))];
            const uniqueSizes = [...new Set(data.map(item => item.uniform?.size).filter(Boolean))].sort((a, b) => a - b);
            setFilterOptions({ stages: uniqueStages, types: uniqueTypes, sizes: uniqueSizes });
        } catch (err) {
            setError('فشل في جلب بيانات المخزون.');
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchItems(); }, []);

    useEffect(() => {
        let result = allItems;
        if (filters.stage !== 'all') result = result.filter(item => item.uniform?.stage?.trim() === filters.stage);
        if (filters.type !== 'all') result = result.filter(item => item.uniform?.type?.trim() === filters.type);
        if (filters.size !== 'all') result = result.filter(item => item.uniform?.size === Number(filters.size));
        if (filters.startDate) result = result.filter(item => new Date(item.entryDate) >= new Date(filters.startDate).setHours(0,0,0,0));
        if (filters.endDate) result = result.filter(item => new Date(item.entryDate) <= new Date(filters.endDate).setHours(23,59,59,999));
        setFilteredItems(result);
        setSelectedIds(new Set()); 
    }, [filters, allItems]);

    // وظيفة حذف كامل المخزون
    const handleClearAllStock = async () => {
        const confirmMsg = "⚠️ تحذير: هل أنتِ متأكدة من حذف كامل المخزون؟ سيتم مسح جميع الباركودات المسجلة حالياً.";
        if (window.confirm(confirmMsg)) {
            try {
                setLoading(true);
                await api.delete('/api/inventory/clear-all');
                setAllItems([]);
                setFilteredItems([]);
                alert("تم تصفير المخزون بنجاح.");
            } catch (err) {
                setError('حدث خطأ أثناء تصفير المخزون. تأكدي من صلاحيات الأدمن.');
            } finally {
                setLoading(false);
            }
        }
    };

    const handleSelectAll = (e) => {
        setSelectedIds(e.target.checked ? new Set(filteredItems.map(i => i._id)) : new Set());
    };

    const handleSelectOne = (id) => {
        const newSelected = new Set(selectedIds);
        newSelected.has(id) ? newSelected.delete(id) : newSelected.add(id);
        setSelectedIds(newSelected);
    };

    const handleShowConfirmModal = (items) => { setItemsToDelete(items); setShowConfirmModal(true); };
    const handleCloseConfirmModal = () => { setItemsToDelete([]); setShowConfirmModal(false); };

    const handleDeleteConfirmed = async () => {
        try {
            await Promise.all(itemsToDelete.map(item => api.delete(`/api/inventory/${item._id}`)));
            const deletedIds = new Set(itemsToDelete.map(i => i._id));
            setAllItems(curr => curr.filter(item => !deletedIds.has(item._id)));
            handleCloseConfirmModal();
        } catch (err) { setError('فشل الحذف الجزئي.'); }
    };

    if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;

    return (
        <Container className="mt-5">
            {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
            <h2 className="mb-4">إدارة المخزون</h2>
            <Card className="mb-4 shadow-sm">
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <h5>بحث وتصفية</h5>
                    <div>
                        <Button variant="danger" size="sm" onClick={handleClearAllStock} className="me-2">🛑 مسح كامل المخزون</Button>
                        <Button variant="secondary" size="sm" onClick={() => setFilters({ stage: 'all', type: 'all', size: 'all', startDate: '', endDate: '' })}>إعادة تعيين</Button>
                    </div>
                </Card.Header>
                <Card.Body>
                    <Row className="mb-3">
                        <Col md={3}><Form.Select name="stage" value={filters.stage} onChange={(e)=>setFilters({...filters, stage: e.target.value})}><option value="all">كل المراحل</option>{filterOptions.stages.map(s => <option key={s} value={s}>{s}</option>)}</Form.Select></Col>
                        <Col md={3}><Form.Select name="type" value={filters.type} onChange={(e)=>setFilters({...filters, type: e.target.value})}><option value="all">كل الأنواع</option>{filterOptions.types.map(t => <option key={t} value={t}>{t}</option>)}</Form.Select></Col>
                        <Col md={3}><Form.Select name="size" value={filters.size} onChange={(e)=>setFilters({...filters, size: e.target.value})}><option value="all">كل المقاسات</option>{filterOptions.sizes.map(z => <option key={z} value={z}>{z}</option>)}</Form.Select></Col>
                        <Col md={3}><Button variant="primary" className="w-100" onClick={() => setShowScanner(true)}>📸 مسح باركود</Button></Col>
                    </Row>
                </Card.Body>
            </Card>

            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th><Form.Check type="checkbox" onChange={handleSelectAll} checked={filteredItems.length > 0 && selectedIds.size === filteredItems.length} /></th>
                        <th>#</th><th>المرحلة</th><th>نوع الزي</th><th>المقاس</th><th>الباركود</th><th>الإجراءات</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredItems.map((item, index) => (
                        <tr key={item._id}>
                            <td><Form.Check type="checkbox" checked={selectedIds.has(item._id)} onChange={() => handleSelectOne(item._id)} /></td>
                            <td>{index + 1}</td><td>{item.uniform?.stage}</td><td>{item.uniform?.type}</td><td>{item.uniform?.size}</td><td>{item.barcode}</td>
                            <td><Button variant="outline-danger" size="sm" onClick={() => handleShowConfirmModal([item])}>حذف</Button></td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            <Modal show={showConfirmModal} onHide={handleCloseConfirmModal} centered>
                <Modal.Header closeButton className="bg-danger text-white"><Modal.Title>تأكيد الحذف</Modal.Title></Modal.Header>
                <Modal.Body><p>هل أنتِ متأكدة من حذف {itemsToDelete.length} قطعة؟</p></Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseConfirmModal}>إلغاء</Button>
                    <Button variant="danger" onClick={handleDeleteConfirmed}>تأكيد الحذف</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}

export default ManageInventoryPage;