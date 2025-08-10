import React, { useState, useEffect } from 'react';
import { Container, Button, Spinner, Alert, Card, Table } from 'react-bootstrap';
import api from '../api';
import BarcodeRenderer from '../components/BarcodeRenderer';

function PrintBarcodesPage() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchItems = async () => {
      try {
        const response = await api.get('/api/inventory?status=in_stock');
        setItems(response.data);
      } catch (err) {
        setError('فشل في جلب بيانات المخزون');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchItems();
  }, []);

  const handlePrint = () => {
    window.print();
  };

  // --- New Logic: Group items into rows of 4 ---
  const itemsPerRow = 4;
  const groupedItems = items.reduce((resultArray, item, index) => { 
    const chunkIndex = Math.floor(index / itemsPerRow);

    if(!resultArray[chunkIndex]) {
      resultArray[chunkIndex] = []; // Start a new row
    }

    resultArray[chunkIndex].push(item);
    return resultArray;
  }, []);

  return (
    <Container className="mt-5">
      {/* This section will NOT be printed */}
      <div className="d-flex justify-content-between align-items-center mb-4 no-print">
        <h2>طباعة الباركود</h2>
        <Button variant="success" onClick={handlePrint} disabled={items.length === 0}>
          طباعة الملصقات
        </Button>
      </div>

      {loading && <div className="text-center"><Spinner animation="border" /></div>}
      {error && <Alert variant="danger" className="no-print">{error}</Alert>}

      {/* --- This Table is the only part that WILL be printed --- */}
      {!loading && !error && (
        <div className="printable">
          <Table bordered>
            <tbody>
              {groupedItems.length > 0 ? groupedItems.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((item) => (
                    <td key={item._id} className="align-middle text-center">
                      {item.uniform ? (
                        <Card className="barcode-card border-0">
                          <Card.Body className="d-flex flex-column justify-content-center align-items-center p-2">
                            <p className="fw-bold school-name mb-2">مدارس الأندلس الأهلية</p>
                            <BarcodeRenderer value={item.barcode} />
                            <p className="item-details mt-2">
                              {item.uniform.stage} - {item.uniform.type} (مقاس: {item.uniform.size})
                            </p>
                          </Card.Body>
                        </Card>
                      ) : null}
                    </td>
                  ))}
                  {/* Add empty cells if the row is not full */}
                  {Array(itemsPerRow - row.length).fill(0).map((_, emptyIndex) => (
                    <td key={`empty-${emptyIndex}`}></td>
                  ))}
                </tr>
              )) : (
                <tr>
                  <td colSpan={itemsPerRow}>
                    <Alert variant="info" className="no-print m-0">لا يوجد قطع في المخزون لعرضها.</Alert>
                  </td>
                </tr>
              )}
            </tbody>
          </Table>
        </div>
      )}
    </Container>
  );
}

export default PrintBarcodesPage;