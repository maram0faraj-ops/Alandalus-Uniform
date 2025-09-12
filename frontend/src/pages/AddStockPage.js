import React, { useState } from 'react';
import { Container, Form, Button, Row, Col, Alert, Spinner } from 'react-bootstrap';
import api from '../api';

function AddStockPage() {
    const [formData, setFormData] = useState({
        stage: ' ابتدائي بنات',
        type: 'رسمي',
        size: 32,
        quantity: 1,
    });
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);

    const stages = ['رياض أطفال بنات', 'رياض أطفال بنين', 'ابتدائي بنات', 'ابتدائي بنين', 'متوسط', 'ثانوي'];
    const types = ['رسمي', 'رياضي', 'جاكيت'];
    const sizes = Array.from({ length: (60 - 10) + 1 }, (_, i) => 10 + i); // <-- تم التعديل هنا

    const handleChange = (e) => {
        setMessage('');
        setError('');
        const { name, value } = e.target;
        const finalValue = name === 'quantity' ? parseInt(value, 10) : value;
        setFormData({ ...formData, [name]: finalValue });
    };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');
    setError('');
    try {
      const response = await api.post('/api/inventory/add', formData);
      setMessage(response.data.msg);
    } catch (err) {
      setError(err.response?.data?.msg || 'حدث خطأ ما، يرجى المحاولة مرة أخرى.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container className="mt-5">
        <Row className="justify-content-md-center">
            <Col md={8}>
            <h2 className="text-center mb-4">إضافة مخزون جديد</h2>
            {message && <Alert variant="success" onClose={() => setMessage('')} dismissible>{message}</Alert>}
            {error && <Alert variant="danger" onClose={() => setError('')} dismissible>{error}</Alert>}
            <Form onSubmit={handleSubmit}>
                <Form.Group as={Row} className="mb-3">
                <Form.Label column sm={3}>المرحلة الدراسية</Form.Label>
                <Col sm={9}>
                    <Form.Select name="stage" value={formData.stage} onChange={handleChange} required>
                    {stages.map(s => <option key={s} value={s}>{s}</option>)}
                    </Form.Select>
                </Col>
                </Form.Group>
                <Form.Group as={Row} className="mb-3">
                <Form.Label column sm={3}>نوع الزي</Form.Label>
                <Col sm={9}>
                    <Form.Select name="type" value={formData.type} onChange={handleChange} required>
                    {types.map(t => <option key={t} value={t}>{t}</option>)}
                    </Form.Select>
                </Col>
                </Form.Group>
                <Form.Group as={Row} className="mb-3">
                <Form.Label column sm={3}>المقاس</Form.Label>
                <Col sm={9}>
                    <Form.Select name="size" value={formData.size} onChange={handleChange} required>
                    {sizes.map(s => <option key={s} value={s}>{s}</option>)}
                    </Form.Select>
                </Col>
                </Form.Group>
                <Form.Group as={Row} className="mb-3">
                <Form.Label column sm={3}>الكمية</Form.Label>
                <Col sm={9}>
                    <Form.Control type="number" name="quantity" value={formData.quantity} onChange={handleChange} min="1" required />
                </Col>
                </Form.Group>
                <div className="d-grid mt-4">
                <Button variant="primary" type="submit" disabled={loading}>
                    {loading ? <><Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" /> جاري الإضافة...</> : 'إضافة للمخزون'}
                </Button>
                </div>
            </Form>
            </Col>
        </Row>
    </Container>
  );
}

 export default AddStockPage;