import React, { useState, useEffect } from 'react';
import { Container, Form, Button, Row, Col, Spinner, Card } from 'react-bootstrap';
import api from '../api';
import * as XLSX from 'xlsx';

function InventoryReportPage() {
  const [filters, setFilters] = useState({ 
    stage: '', 
    type: '', 
    size: '', 
    entryDateFrom: '', // <-- تم التعديل هنا
    entryDateTo: ''      // <-- تم التعديل هنا
  });
  const [filterOptions, setFilterOptions] = useState({ stages: [], types: [], sizes: [] });
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingDetails, setLoadingDetails] = useState(false);

  useEffect(() => {
    const fetchFilterOptions = async () => {
        try {
            const response = await api.post('/api/reports/inventory-details', {});
            const data = response.data;
            const uniqueStages = [...new Set(data.map(item => item.uniform?.stage).filter(Boolean))];
            const uniqueTypes = [...new Set(data.map(item => item.uniform?.type).filter(Boolean))];
            const uniqueSizes = [...new Set(data.map(item => item.uniform?.size).filter(Boolean))].sort((a,b) => a-b);
            setFilterOptions({ stages: uniqueStages, types: uniqueTypes, sizes: uniqueSizes });
        } catch (error) {
            console.error('Failed to fetch filter options:', error);
        }
    };
    fetchFilterOptions();
  }, []);

  const handleInputChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };

  // ... دوال تصدير البيانات (handleExportSummary, handleExportDetails) تبقى كما هي ...
  const handleExportSummary = async () => {
    setLoadingSummary(true);
    try {
      const response = await api.post('/api/reports/inventory-summary', filters);
      const dataToExport = response.data.map(item => ({
        'المرحلة': item._id.stage,
        'نوع الزي': item._id.type,
        'المقاس': item._id.size,
        'الكمية المتوفرة': item.quantity
      }));
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'تقرير المخزون الملخص');
      XLSX.writeFile(workbook, 'InventorySummary_Report.xlsx');
    } catch (error) {
      console.error('Failed to export summary report:', error);
      alert('حدث خطأ أثناء تصدير التقرير الملخص.');
    } finally {
      setLoadingSummary(false);
    }
  };

  const handleExportDetails = async () => {
    setLoadingDetails(true);
    try {
      const response = await api.post('/api/reports/inventory-details', filters);
      const dataToExport = response.data.map(item => ({
        'المرحلة': item.uniform?.stage,
        'نوع الزي': item.uniform?.type,
        'المقاس': item.uniform?.size,
        'الباركود': item.barcode,
        'تاريخ ووقت الإضافة': new Date(item.entryDate).toLocaleString('ar-SA'),
      }));
      const worksheet = XLSX.utils.json_to_sheet(dataToExport);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, 'تقرير المخزون المفصل');
      XLSX.writeFile(workbook, 'InventoryDetails_Report.xlsx');
    } catch (error) {
      console.error('Failed to export details report:', error);
      alert('حدث خطأ أثناء تصدير التقرير المفصل.');
    } finally {
      setLoadingDetails(false);
    }
  };


  return (
    <Container className="mt-4">
      <Card className="p-4 shadow-sm">
        <Card.Title as="h2" className="text-center mb-4">تقارير المخزون</Card.Title>
        <Form>
          <Row className="mb-3 align-items-end">
            <Col md={3}>
              <Form.Group>
                <Form.Label>المرحلة الدراسية</Form.Label>
                <Form.Control as="select" name="stage" onChange={handleInputChange}>
                  <option value="">الكل</option>
                  {filterOptions.stages.map(o => <option key={o} value={o}>{o}</option>)}
                </Form.Control>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>نوع الزي</Form.Label>
                <Form.Control as="select" name="type" onChange={handleInputChange}>
                  <option value="">الكل</option>
                  {filterOptions.types.map(o => <option key={o} value={o}>{o}</option>)}
                </Form.Control>
              </Form.Group>
            </Col>
            <Col md={3}>
              <Form.Group>
                <Form.Label>المقاس</Form.Label>
                <Form.Control as="select" name="size" onChange={handleInputChange}>
                  <option value="">الكل</option>
                  {filterOptions.sizes.map(o => <option key={o} value={o}>{o}</option>)}
                </Form.Control>
              </Form.Group>
            </Col>

            {/* --- تم التعديل هنا --- */}
            <Col md={3}>
                <Row>
                    <Col sm={6}>
                        <Form.Group>
                            <Form.Label>من تاريخ</Form.Label>
                            <Form.Control type="date" name="entryDateFrom" onChange={handleInputChange} />
                        </Form.Group>
                    </Col>
                    <Col sm={6}>
                        <Form.Group>
                            <Form.Label>إلى تاريخ</Form.Label>
                            <Form.Control type="date" name="entryDateTo" onChange={handleInputChange} />
                        </Form.Group>
                    </Col>
                </Row>
            </Col>
          </Row>
          <Row className="mt-4">
            <Col md={6} className="d-grid mb-2 mb-md-0">
              <Button variant="primary" size="lg" onClick={handleExportSummary} disabled={loadingSummary}>
                {loadingSummary ? <Spinner as="span" size="sm" /> : '📥 تصدير التقرير الملخص (بالكمية)'}
              </Button>
            </Col>
            <Col md={6} className="d-grid">
              <Button variant="success" size="lg" onClick={handleExportDetails} disabled={loadingDetails}>
                {loadingDetails ? <Spinner as="span" size="sm" /> : '📄 تصدير التقرير المفصل (بالباركود)'}
              </Button>
            </Col>
          </Row>
        </Form>
      </Card>
    </Container>
  );
}

export default InventoryReportPage;