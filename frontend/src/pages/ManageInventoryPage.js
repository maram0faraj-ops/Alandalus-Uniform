import React, { useState, useEffect } from 'react';
import { Container, Table, Button, Spinner, Alert, Modal } from 'react-bootstrap';
import api from '../api';

function ManageInventoryPage() {
    const [items, setItems] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState('');
    
    // State for the confirmation modal
    const [showConfirmModal, setShowConfirmModal] = useState(false);
    const [itemToDelete, setItemToDelete] = useState(null);

    useEffect(() => {
        const fetchItems = async () => {
            try {
                const response = await api.get('/api/inventory?status=in_stock');
                setItems(response.data);
            } catch (err) {
                setError('Failed to fetch inventory data.');
            } finally {
                setLoading(false);
            }
        };
        fetchItems();
    }, []);

    // Function to open the confirmation modal
    const handleShowConfirmModal = (item) => {
        setItemToDelete(item);
        setShowConfirmModal(true);
    };

    // Function to close the confirmation modal
    const handleCloseConfirmModal = () => {
        setItemToDelete(null);
        setShowConfirmModal(false);
    };

    // Function to handle the actual deletion
    const handleDeleteItem = async () => {
        if (!itemToDelete) return;

        try {
            await api.delete(`/api/inventory/${itemToDelete._id}`);
            // Remove the item from the local state to update the UI instantly
            setItems(currentItems => currentItems.filter(item => item._id !== itemToDelete._id));
            handleCloseConfirmModal(); // Close the modal on success
        } catch (err) {
            setError('Failed to delete the item. Please try again.');
            console.error(err);
        }
    };

    if (loading) return <Container className="text-center mt-5"><Spinner animation="border" /></Container>;
    if (error) return <Container className="mt-4"><Alert variant="danger">{error}</Alert></Container>;

    return (
        <>
            <Container className="mt-5">
                <div className="d-flex justify-content-between align-items-center mb-4">
                    <h2>Manage Inventory</h2>
                </div>
                <Table striped bordered hover responsive>
                    <thead>
                        <tr>
                            <th>#</th>
                            <th>Stage</th>
                            <th>Type</th>
                            <th>Size</th>
                            <th>Barcode</th>
                            <th>Entry Date</th>
                            <th>Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map((item, index) => (
                            <tr key={item._id}>
                                <td>{index + 1}</td>
                                <td>{item.uniform?.stage}</td>
                                <td>{item.uniform?.type}</td>
                                <td>{item.uniform?.size}</td>
                                <td>{item.barcode}</td>
                                <td>{new Date(item.entryDate).toLocaleDateString('ar-SA')}</td>
                                <td>
                                    <Button 
                                        variant="danger" 
                                        size="sm"
                                        onClick={() => handleShowConfirmModal(item)}
                                    >
                                        Delete
                                    </Button>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </Table>
            </Container>

            {/* Confirmation Modal */}
            <Modal show={showConfirmModal} onHide={handleCloseConfirmModal} centered>
                <Modal.Header closeButton>
                    <Modal.Title>Confirm Deletion</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    Are you sure you want to permanently delete this item?
                    <br />
                    <strong>Barcode: {itemToDelete?.barcode}</strong>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseConfirmModal}>
                        Cancel
                    </Button>
                    <Button variant="danger" onClick={handleDeleteItem}>
                        Confirm Delete
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
}

export default ManageInventoryPage;