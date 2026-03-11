import React, { useState } from 'react';
import { Container, Form, Button, Row, Col, Alert } from 'react-bootstrap';
import api from '../api';

function AddStockPage() {
    const [formData, setFormData] = useState({ stage: 'ابتدائي بنات', type: 'رسمي', size: 32, quantity: 1 });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const stages = ['رياض أطفال بنات', 'رياض أطفال بنين', 'ابتدائي بنات', 'ابتدائي بنين', 'متوسط', 'ثانوي'];
    const types = ['رسمي', 'رياضي', 'جاكيت'];
    const sizes = Array.from({ length: 91 }, (_, i) => 10 + i); // من 10 إلى 100

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            const response = await api.post('/api/inventory/add', formData);
            setMessage(response.data.msg);
            setError('');
        } catch (err) {
            setError(err.response?.data?.msg || 'فشل الاتصال بالسيرفر، تأكدي من تحديث الـ Backend');
        } finally { setLoading(false); }
    };

    return (
        <Container className="mt-5 text-end" dir="rtl">
            <Row className="justify-content-md-center">
                <Col md={8}>
                    <h2 className="mb-4">إضافة مخزون جديد</h2>
                    {message && <Alert variant="success">{message}</Alert>}
                    {error && <Alert variant="danger">{error}</Alert>}
                    <Form onSubmit={handleSubmit}>
                        <Form.Group as={Row} className="mb-3">
                            <Form.Label column sm={3}>المرحلة</Form.Label>
                            <Col sm={9}>
                                <Form.Select value={formData.stage} onChange={(e) => setFormData({...formData, stage: e.target.value})}>
                                    {stages.map(s => <option key={s} value={s}>{s}</option>)}
                                </Form.Select>
                            </Col>
                        </Form.Group>
                        <Form.Group as={Row} className="mb-3">
                            <Form.Label column sm={3}>المقاس</Form.Label>
                            <Col sm={9}>
                                <Form.Select value={formData.size} onChange={(e) => setFormData({...formData, size: parseInt(e.target.value)})}>
                                    {sizes.map(s => <option key={s} value={s}>{s}</option>)}
                                </Form.Select>
                            </Col>
                        </Form.Group>
                        <Form.Group as={Row} className="mb-3">
                            <Form.Label column sm={3}>الكمية</Form.Label>
                            <Col sm={9}>
                                <Form.Control type="number" value={formData.quantity} onChange={(e) => setFormData({...formData, quantity: parseInt(e.target.value)})} min="1" />
                            </Col>
                        </Form.Group>
                        <Button variant="primary" type="submit" className="w-100" disabled={loading}>
                            {loading ? 'جاري الإضافة...' : 'إضافة للمخزون'}
                        </Button>
                    </Form>
                </Col>
            </Row>
        </Container>
    );
}
export default AddStockPage;