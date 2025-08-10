import React, { useState, useEffect } from 'react';
import { Container, Button, Spinner, Alert, Table } from 'react-bootstrap';
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

  // Logic to group items into rows of 4 for the table
  const itemsPerRow = 4;
  const groupedItems = items.reduce((resultArray, item, index) => { 
    const chunkIndex = Math.floor(index / itemsPerRow);
    if (!resultArray[chunkIndex]) {
      resultArray[chunkIndex] = [];
    }
    resultArray[chunkIndex].push(item);
    return resultArray;
  }, []);

  return (
    <Container className="mt-5 barcode-print-page"> {/* Added a parent class for specific styling */}
      {/* Non-printable section */}
      <div className="d-flex justify-content-between align-items-center mb-4 no-print">
        <h2>طباعة الباركود</h2>
        <Button variant="success" onClick={handlePrint} disabled={items.length === 0}>
          طباعة الملصقات
        </Button>
      </div>

      {loading && <div className="text-center"><Spinner animation="border" /></div>}
      {error && <Alert variant="danger" className="no-print">{error}</Alert>}

      {/* Printable section with a structured table */}
      {!loading && !error && (
        <div className="printable">
          <Table className="barcode-table">
            <tbody>
              {groupedItems.map((row, rowIndex) => (
                <tr key={rowIndex}>
                  {row.map((item) => (
                    <td key={item._id}>
                      {item.uniform ? (
                        <div className="barcode-card">
                          <p className="school-name">مدارس الأندلس الأهلية</p>
                          <div className="barcode-container">
                            <BarcodeRenderer value={item.barcode} />
                          </div>
                          <p className="item-details">
                            {item.uniform.stage} - {item.uniform.type} (مقاس: {item.uniform.size})
                          </p>
                        </div>
                      ) : null}
                    </td>
                  ))}
                  {/* Fill remaining cells in the last row to maintain structure */}
                  {Array(itemsPerRow - row.length).fill(0).map((_, emptyIndex) => (
                    <td key={`empty-${emptyIndex}`} className="empty-cell"></td>
                  ))}
                </tr>
              ))}
            </tbody>
          </Table>
        </div>
      )}
    </Container>
  );
}

export default PrintBarcodesPage;