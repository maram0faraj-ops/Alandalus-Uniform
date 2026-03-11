import React, { useState, useEffect, useCallback } from 'react';
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

    useEffect(() => { fetchItems(); }, [fetchItems]);

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

    const handleClearAllStock = async () => {
        if (window.confirm("⚠️ هل أنتِ متأكدة من حذف كامل المخزون؟")) {
            try {
                setLoading(true);
                await api.delete('/api/inventory/clear-all');
                setAllItems([]);
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
            setError('الباركود غير موجود.');
        }
    };

    const handleDeleteConfirmed = async () => {
        try {
            await Promise.all(itemsToDelete.map(item => api.delete(`/api/inventory/${item._id}`)));
            const deletedIds = new Set(itemsToDelete.map(i => i._id));
            setAllItems(curr => curr.filter(item => !deletedIds.has(item._id)));
            setShowConfirmModal(false);
            setSelectedIds(new Set());
        } catch (err) { setError('فشل الحذف.'); }
    };

    if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;

    return (
        <Container className="mt-5">
            {error && <Alert variant="danger" dismissible onClose={() => setError('')}>{error}</Alert>}
            {showScanner && (
                <Modal show={showScanner} onHide={() => setShowScanner(false)} centered>
                    <Modal.Header closeButton><Modal.Title>امسح QR Code</Modal.Title></Modal.Header>
                    <Modal.Body><BarcodeScanner onScanSuccess={handleScanSuccess} onScanError={() => setShowScanner(false)} /></Modal.Body>
                </Modal>
            )}
            <Card className="mb-4 shadow-sm">
                <Card.Header className="d-flex justify-content-between align-items-center">
                    <h5>إدارة المخزون</h5>
                    <div>
                        <Button variant="danger" size="sm" onClick={handleClearAllStock} className="me-2">🛑 مسح كامل المخزون</Button>
                        {selectedIds.size > 0 && (
                            <Button variant="warning" size="sm" onClick={() => {
                                setItemsToDelete(filteredItems.filter(i => selectedIds.has(i._id)));
                                setShowConfirmModal(true);
                            }}>حذف المحدد ({selectedIds.size})</Button>
                        )}
                    </div>
                </Card.Header>
                <Card.Body>
                    <Row className="mb-3">
                        <Col md={3}><Form.Select value={filters.stage} onChange={(e)=>setFilters({...filters, stage: e.target.value})}><option value="all">المرحلة</option>{filterOptions.stages.map(s => <option key={s} value={s}>{s}</option>)}</Form.Select></Col>
                        <Col md={3}><Form.Select value={filters.type} onChange={(e)=>setFilters({...filters, type: e.target.value})}><option value="all">النوع</option>{filterOptions.types.map(t => <option key={t} value={t}>{t}</option>)}</Form.Select></Col>
                        <Col md={3}><Form.Select value={filters.size} onChange={(e)=>setFilters({...filters, size: e.target.value})}><option value="all">المقاس</option>{filterOptions.sizes.map(z => <option key={z} value={z}>{z}</option>)}</Form.Select></Col>
                        <Col md={3}><Button variant="primary" className="w-100" onClick={() => setShowScanner(true)}>📸 مسح QR</Button></Col>
                    </Row>
                </Card.Body>
            </Card>
            <Table striped bordered hover responsive>
                <thead>
                    <tr>
                        <th><Form.Check type="checkbox" onChange={(e) => setSelectedIds(e.target.checked ? new Set(filteredItems.map(i => i._id)) : new Set())} checked={filteredItems.length > 0 && selectedIds.size === filteredItems.length} /></th>
                        <th>#</th><th>المرحلة</th><th>النوع</th><th>الباركود</th><th>الإجراء</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredItems.map((item, index) => (
                        <tr key={item._id}>
                            <td><Form.Check type="checkbox" checked={selectedIds.has(item._id)} onChange={() => { const next = new Set(selectedIds); next.has(item._id) ? next.delete(item._id) : next.add(item._id); setSelectedIds(next); }} /></td>
                            <td>{index + 1}</td><td>{item.uniform?.stage}</td><td>{item.uniform?.type}</td><td>{item.barcode}</td>
                            <td><Button variant="outline-danger" size="sm" onClick={() => {setItemsToDelete([item]); setShowConfirmModal(true);}}>حذف</Button></td>
                        </tr>
                    ))}
                </tbody>
            </Table>
            <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
                <Modal.Header closeButton className="bg-danger text-white"><Modal.Title>تأكيد الحذف</Modal.Title></Modal.Header>
                <Modal.Body><p>هل أنتِ متأكدة من حذف {itemsToDelete.length} عنصر؟</p></Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>إلغاء</Button>
                    <Button variant="danger" onClick={handleDeleteConfirmed}>تأكيد الحذف</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}

export default ManageInventoryPage;