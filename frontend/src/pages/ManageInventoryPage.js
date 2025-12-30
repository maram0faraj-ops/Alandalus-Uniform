import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Spinner, Alert, Modal, Card, Form, Row, Col, Badge } from 'react-bootstrap';
import api from '../api';
import * as XLSX from 'xlsx'; // يحتاج تثبيت مكتبة xlsx
import { saveAs } from 'file-saver';

function ManageInventoryPage() {
    const [allItems, setAllItems] = useState([]);
    const [filteredItems, setFilteredItems] = useState([]);
    const [lowStockAlerts, setLowStockAlerts] = useState([]);
    const [filters, setFilters] = useState({ stage: 'all', type: 'all', size: 'all', startDate: '', endDate: '' });
    const [filterOptions, setFilterOptions] = useState({ stages: [], types: [], sizes: [] });
    const [selectedIds, setSelectedIds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    const [showConfirmModal, setShowConfirmModal] = useState(false);

    useEffect(() => {
        fetchInitialData();
    }, []);

    const fetchInitialData = async () => {
        try {
            setLoading(true);
            const [invRes, alertRes] = await Promise.all([
                api.get('/api/inventory?status=in_stock'),
                api.get('/api/inventory/low-stock-alerts')
            ]);
            
            setAllItems(invRes.data);
            setFilteredItems(invRes.data);
            setLowStockAlerts(alertRes.data);

            const data = invRes.data;
            setFilterOptions({
                stages: [...new Set(data.map(i => i.uniform?.stage).filter(Boolean))],
                types: [...new Set(data.map(i => i.uniform?.type).filter(Boolean))],
                sizes: [...new Set(data.map(i => i.uniform?.size).filter(Boolean))].sort((a, b) => a - b)
            });
        } catch (err) {
            setError('فشل في جلب البيانات.');
        } finally {
            setLoading(false);
        }
    };

    // منطق الفلترة (يشمل التاريخ)
    useEffect(() => {
        let result = allItems;
        if (filters.stage !== 'all') result = result.filter(i => i.uniform?.stage === filters.stage);
        if (filters.type !== 'all') result = result.filter(i => i.uniform?.type === filters.type);
        if (filters.size !== 'all') result = result.filter(i => i.uniform?.size === Number(filters.size));
        
        if (filters.startDate) {
            result = result.filter(i => new Date(i.entryDate) >= new Date(filters.startDate));
        }
        if (filters.endDate) {
            const end = new Date(filters.endDate);
            end.setHours(23, 59, 59);
            result = result.filter(i => new Date(i.entryDate) <= end);
        }
        
        setFilteredItems(result);
        setSelectedIds([]);
    }, [filters, allItems]);

    // وظيفة تصدير Excel
    const exportToExcel = () => {
        const reportData = filteredItems.map(item => ({
            'المرحلة': item.uniform?.stage,
            'النوع': item.uniform?.type,
            'المقاس': item.uniform?.size,
            'الباركود': item.barcode,
            'تاريخ الإضافة': new Date(item.entryDate).toLocaleDateString('ar-SA')
        }));

        const worksheet = XLSX.utils.json_to_sheet(reportData);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Inventory");
        const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' });
        const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;charset=UTF-8' });
        saveAs(data, `تقرير_المخزون_${new Date().toLocaleDateString()}.xlsx`);
    };

    const handleBulkDelete = async () => {
        try {
            await api.post('/api/inventory/bulk-delete', { ids: selectedIds });
            setAllItems(prev => prev.filter(item => !selectedIds.includes(item._id)));
            setSelectedIds([]);
            setShowConfirmModal(false);
        } catch (err) {
            setError('فشل في عملية الحذف الجماعي.');
        }
    };

    if (loading) return <div className="text-center mt-5"><Spinner animation="border" /></div>;

    return (
        <Container className="mt-4">
            {/* قسم تنبيهات نقص المخزون */}
            {lowStockAlerts.length > 0 && (
                <Alert variant="warning">
                    <h5>⚠️ تنبيهات انخفاض المخزون (أقل من 20 قطعة):</h5>
                    <ul className="mb-0">
                        {lowStockAlerts.map(alert => (
                            <li key={alert._id}>
                                {alert.details.stage} - {alert.details.type} (مقاس: {alert.details.size}) - 
                                <strong> المتبقي: {alert.count} قطعة فقط</strong>
                            </li>
                        ))}
                    </ul>
                </Alert>
            )}

            <h2 className="mb-4">إدارة المخزون المتقدمة</h2>

            <Card className="mb-4 shadow-sm">
                <Card.Body>
                    <Row className="g-3">
                        <Col md={2}>
                            <Form.Label>المرحلة</Form.Label>
                            <Form.Select value={filters.stage} onChange={e => setFilters({...filters, stage: e.target.value})}>
                                <option value="all">الكل</option>
                                {filterOptions.stages.map(s => <option key={s} value={s}>{s}</option>)}
                            </Form.Select>
                        </Col>
                        <Col md={3}>
                            <Form.Label>من تاريخ</Form.Label>
                            <Form.Control type="date" value={filters.startDate} onChange={e => setFilters({...filters, startDate: e.target.value})} />
                        </Col>
                        <Col md={3}>
                            <Form.Label>إلى تاريخ</Form.Label>
                            <Form.Control type="date" value={filters.endDate} onChange={e => setFilters({...filters, endDate: e.target.value})} />
                        </Col>
                        <Col md={4} className="d-flex align-items-end gap-2">
                            <Button variant="outline-success" onClick={exportToExcel}>📊 تصدير Excel</Button>
                            {selectedIds.length > 0 && (
                                <Button variant="danger" onClick={() => setShowConfirmModal(true)}>🗑️ حذف ({selectedIds.length})</Button>
                            )}
                        </Col>
                    </Row>
                </Card.Body>
            </Card>

            <Table striped bordered hover responsive className="text-center">
                <thead className="table-dark">
                    <tr>
                        <th>
                            <Form.Check 
                                type="checkbox" 
                                checked={selectedIds.length === filteredItems.length && filteredItems.length > 0}
                                onChange={() => setSelectedIds(selectedIds.length === filteredItems.length ? [] : filteredItems.map(i => i._id))}
                            />
                        </th>
                        <th>#</th><th>المرحلة</th><th>النوع</th><th>المقاس</th><th>الباركود</th><th>تاريخ الإضافة</th>
                    </tr>
                </thead>
                <tbody>
                    {filteredItems.map((item, index) => (
                        <tr key={item._id} className={selectedIds.includes(item._id) ? 'table-active' : ''}>
                            <td>
                                <Form.Check 
                                    type="checkbox" 
                                    checked={selectedIds.includes(item._id)}
                                    onChange={() => setSelectedIds(prev => prev.includes(item._id) ? prev.filter(id => id !== item._id) : [...prev, item._id])}
                                />
                            </td>
                            <td>{index + 1}</td>
                            <td>{item.uniform?.stage}</td>
                            <td>{item.uniform?.type}</td>
                            <td>{item.uniform?.size}</td>
                            <td><code>{item.barcode}</code></td>
                            <td>{new Date(item.entryDate).toLocaleDateString('ar-SA')}</td>
                        </tr>
                    ))}
                </tbody>
            </Table>

            <Modal show={showConfirmModal} onHide={() => setShowConfirmModal(false)} centered>
                <Modal.Header closeButton><Modal.Title>تأكيد الحذف الجماعي</Modal.Title></Modal.Header>
                <Modal.Body>سيتم حذف <strong>{selectedIds.length}</strong> قطعة نهائياً من النظام. هل أنت متأكد؟</Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowConfirmModal(false)}>إلغاء</Button>
                    <Button variant="danger" onClick={handleBulkDelete}>نعم، احذف الكل</Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}

export default ManageInventoryPage;