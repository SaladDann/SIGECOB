// frontend/src/pages/OrderHistoryPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
// Importamos los componentes de Bootstrap
import { Container, Row, Col, Table, Button, Spinner, Alert, Card } from 'react-bootstrap';
// Importamos iconos para una mejor usabilidad y estética
import { FaEye, FaRedoAlt, FaHeadset, FaShoppingBasket, FaInfoCircle } from 'react-icons/fa';

import LoadingSpinner from '../components/LoadingSpinner'; 
import OrderDetailModal from '../components/OrderDetailModal';
import SupportContactModal from '../components/SupportContactModal';
import { useCart } from '../context/CartContext';

const OrderHistoryPage = () => {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    const [showSupportModal, setShowSupportModal] = useState(false);
    const [orderIdForSupport, setOrderIdForSupport] = useState(null);

    const { addItemToCart, openCartModal } = useCart();

    useEffect(() => {
        const fetchOrders = async () => {
            setLoading(true);
            try {
                const token = localStorage.getItem('token');
                if (!token) {
                    setError('Debes iniciar sesión para ver tu historial de órdenes.');
                    setLoading(false);
                    return;
                }

                const config = {
                    headers: {
                        Authorization: `Bearer ${token}`,
                    },
                };
                const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/orders/history`, config);
                setOrders(response.data);
            } catch (err) {
                console.error('Error al cargar el historial de órdenes:', err.response?.data || err.message);
                if (err.response?.status === 401 || err.response?.status === 403) {
                    setError('Tu sesión ha expirado o no tienes permisos. Por favor, inicia sesión de nuevo.');
                    toast.error('Sesión expirada. Por favor, inicia sesión.');
                } else {
                    setError('Error al cargar el historial de órdenes. Intenta de nuevo más tarde.');
                    toast.error('Error al cargar el historial de órdenes.');
                }
            } finally {
                setLoading(false);
            }
        };

        fetchOrders();
    }, []);

    const handleViewDetails = async (orderId) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/orders/${orderId}`, config);
            setSelectedOrder(response.data);
            setShowDetailModal(true);
        } catch (err) {
            console.error('Error al cargar los detalles de la orden:', err.response?.data || err.message);
            toast.error('No se pudieron cargar los detalles de la orden.');
        } finally {
            setLoading(false);
        }
    };

    const handleCloseDetailModal = () => {
        setShowDetailModal(false);
        setSelectedOrder(null);
    };

    const handleContactSupport = (orderId) => {
        setOrderIdForSupport(orderId);
        setShowSupportModal(true);
    };

    const handleCloseSupportModal = () => {
        setShowSupportModal(false);
        setOrderIdForSupport(null);
    };

    const handleReorder = async (orderId) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };

            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/orders/${orderId}`, config);
            const orderToReorder = response.data;

            if (orderToReorder && orderToReorder.items && orderToReorder.items.length > 0) {
                let successfullyAddedCount = 0;
                let failedToAddCount = 0;

                for (const item of orderToReorder.items) {
                    const added = await addItemToCart(item.product.id, item.quantity, item.product.name);
                    if (added) {
                        successfullyAddedCount++;
                    } else {
                        failedToAddCount++;
                    }
                }

                const truncatedOrderId = String(orderId).substring(0, 8); // Corrección aquí
                if (successfullyAddedCount > 0 && failedToAddCount === 0) {
                    toast.success(`Todos los ${successfullyAddedCount} artículos de la orden #${truncatedOrderId}... se han añadido al carrito.`);
                } else if (successfullyAddedCount > 0 && failedToAddCount > 0) {
                    toast.warn(`Se añadieron ${successfullyAddedCount} artículos de la orden #${truncatedOrderId}.... ${failedToAddCount} no pudieron ser añadidos.`);
                } else if (successfullyAddedCount === 0 && failedToAddCount > 0) {
                    toast.error(`Ningún artículo de la orden #${truncatedOrderId}... pudo ser añadido al carrito.`);
                } else {
                    toast.info('La orden no contenía artículos válidos para reordenar.');
                }

                if (successfullyAddedCount > 0) {
                    openCartModal();
                }

            } else {
                toast.info('La orden no contiene artículos para reordenar.');
            }
        } catch (err) {
            console.error('Error general al reordenar la orden:', err.response?.data || err.message);
            toast.error('Ocurrió un error inesperado al intentar reordenar la orden.');
        } finally {
            setLoading(false);
        }
    };

    if (loading && !selectedOrder && !showSupportModal) {
        return <LoadingSpinner />;
    }

    return (
        <Container fluid className="py-5 bg-light min-vh-100">
            <Row className="justify-content-center text-center mb-5 pb-4">
                <Col md={10} lg={8}>
                    <h1 className="display-4 fw-bold text-dark mb-3">
                        Tu Historial de Órdenes
                    </h1>
                    <p className="lead text-muted mx-auto" style={{ maxWidth: '700px' }}>
                        Consulta el estado de tus compras anteriores y gestiona tus pedidos.
                    </p>
                </Col>
            </Row>

            <Row className="justify-content-center">
                <Col md={10} lg={10}>
                    {error && (
                        <Alert variant="danger" className="text-center mb-4 shadow-sm">
                            <FaInfoCircle className="me-2" /> {error}
                        </Alert>
                    )}

                    {!loading && orders.length === 0 && !error ? (
                        <Card className="text-center p-5 shadow-sm rounded-lg border-0">
                            <Card.Body>
                                <FaShoppingBasket className="text-muted mb-4" style={{ fontSize: '4rem' }} />
                                <h3 className="fw-bold text-dark mb-3">Aún no has realizado ninguna compra</h3>
                                <p className="text-muted mb-4">
                                    ¡Es el momento perfecto para explorar nuestros productos y encontrar lo que necesitas!
                                </p>
                                <Button variant="primary" href="/productos" className="px-4 py-2 rounded-pill fw-bold">
                                    Explorar Productos
                                </Button>
                            </Card.Body>
                        </Card>
                    ) : (
                        <Card className="shadow-lg rounded-lg border-0">
                            <Card.Header className="bg-primary text-white py-3 fs-5 fw-bold">
                                Todas tus Órdenes
                            </Card.Header>
                            <Card.Body className="p-0">
                                <div className="table-responsive">
                                    <Table striped hover className="mb-0">
                                        <thead>
                                            <tr>
                                                <th scope="col" className="text-muted fw-normal small">ID Orden</th>
                                                <th scope="col" className="text-muted fw-normal small">Fecha</th>
                                                <th scope="col" className="text-muted fw-normal small">Total</th>
                                                <th scope="col" className="text-muted fw-normal small">Estado</th>
                                                <th scope="col" className="text-muted fw-normal small">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orders.map((order) => (
                                                <tr key={order.id}>
                                                    {/* Corrección aquí: Convertir order.id a string antes de substring */}
                                                    <td className="align-middle fw-medium">{String(order.id).substring(0, 8)}...</td>
                                                    <td className="align-middle text-muted small">{new Date(order.createdAt).toLocaleDateString()}</td>
                                                    <td className="align-middle fw-bold text-success">${parseFloat(order.totalAmount).toFixed(2)}</td>
                                                    <td className="align-middle">
                                                        <span className={`badge rounded-pill py-2 px-3 ${
                                                            order.orderStatus === 'Delivered' ? 'bg-success' :
                                                            order.orderStatus === 'Shipped' ? 'bg-info text-dark' :
                                                            order.orderStatus === 'Processing' ? 'bg-warning text-dark' :
                                                            order.orderStatus === 'Pending' ? 'bg-secondary' :
                                                            'bg-light text-dark'
                                                        }`}>
                                                            {order.orderStatus}
                                                        </span>
                                                    </td>
                                                    <td className="align-middle">
                                                        <Button
                                                            onClick={() => handleViewDetails(order.id)}
                                                            variant="outline-primary"
                                                            size="sm"
                                                            className="me-2 rounded-pill"
                                                            disabled={loading}
                                                        >
                                                            <FaEye className="me-1" /> Detalles
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleContactSupport(order.id)}
                                                            variant="outline-secondary"
                                                            size="sm"
                                                            className="me-2 rounded-pill"
                                                            disabled={loading}
                                                        >
                                                            <FaHeadset className="me-1" /> Soporte
                                                        </Button>
                                                        <Button
                                                            onClick={() => handleReorder(order.id)}
                                                            variant="outline-success"
                                                            size="sm"
                                                            className="rounded-pill"
                                                            disabled={loading}
                                                        >
                                                            <FaRedoAlt className="me-1" /> Reordenar
                                                        </Button>
                                                    </td>
                                                </tr>
                                            ))}
                                        </tbody>
                                    </Table>
                                </div>
                            </Card.Body>
                        </Card>
                    )}
                </Col>
            </Row>

            {showDetailModal && selectedOrder && (
                <OrderDetailModal order={selectedOrder} onClose={handleCloseDetailModal} />
            )}

            {showSupportModal && orderIdForSupport && (
                <SupportContactModal orderId={orderIdForSupport} onClose={handleCloseSupportModal} />
            )}
        </Container>
    );
};

export default OrderHistoryPage;