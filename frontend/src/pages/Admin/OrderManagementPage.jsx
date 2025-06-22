// frontend/src/pages/admin/OrderManagementPage.jsx
import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { toast } from 'react-toastify';
// Importamos los componentes de Bootstrap
import { Container, Row, Col, Table, Button, Form, Alert, Card, Dropdown } from 'react-bootstrap';
// Importamos iconos para una mejor usabilidad y estética
import { FaEye, FaEdit, FaFilter, FaSyncAlt, FaExclamationCircle } from 'react-icons/fa';

// Rutas de importación
import LoadingSpinner from '../../components/LoadingSpinner'; 
import OrderDetailModal from '../../components/OrderDetailModal'; 
import UpdateStatusModal from '../../components/UpdateStatusModal'; 


/**
 * @function OrderManagementPage
 * @description Componente React para la página de gestión de órdenes de compra.
 * Permite a los administradores ver todas las órdenes, filtrarlas por estado
 * y actualizar el estado de cada orden.
 */
const OrderManagementPage = () => {
    // Estado para almacenar la lista de órdenes
    const [orders, setOrders] = useState([]);
    // Estado para controlar el estado de carga
    const [loading, setLoading] = useState(true);
    // Estado para almacenar cualquier mensaje de error
    const [error, setError] = useState(null);
    // Estado para el filtro de estado de las órdenes. Por defecto, muestra 'Todos'.
    const [filterStatus, setFilterStatus] = useState('Todos'); // Posibles valores: 'Todos', 'Pending', 'Processing', 'Shipped', 'Delivered', 'Cancelled'

    // Estados para el modal de detalles de la orden
    const [showDetailModal, setShowDetailModal] = useState(false);
    const [selectedOrder, setSelectedOrder] = useState(null);

    // Estados para el modal de actualización de estado de la orden
    const [showUpdateStatusModal, setShowUpdateStatusModal] = useState(false);
    const [orderToUpdate, setOrderToUpdate] = useState(null); // Objeto de la orden a la que se le actualizará el estado

    // Array de todos los posibles estados de una orden para los filtros y la actualización
    // ESTOS DEBEN COINCIDIR EXACTAMENTE CON LOS VALORES DE TU ENUM 'OrderStatus' EN PRISMA
    const orderStatuses = [
        'Todos',
        'Pending',
        'Processing',
        'Shipped',
        'Delivered',
        'Cancelled'
    ];

    // Mapeo para mostrar nombres amigables en el UI
    const orderStatusDisplayNames = {
        'Pending': 'Pendiente',
        'Processing': 'Procesando',
        'Shipped': 'Enviado',
        'Delivered': 'Entregado',
        'Cancelled': 'Cancelado',
        'Todos': 'Todos'
    };

    /**
     * @useEffect Hook para cargar las órdenes cuando el componente se monta
     * o cuando el 'filterStatus' cambia.
     */
    useEffect(() => {
        fetchOrders();
    }, [filterStatus]);

    /**
     * @function fetchOrders
     * @description Función asincrónica para obtener todas las órdenes del backend.
     * Utiliza el endpoint de administración para obtener todas las órdenes.
     */
    const fetchOrders = async () => {
        setLoading(true);
        setError(null);
        try {
            const token = localStorage.getItem('token');
            if (!token) {
                setError('No autenticado. Por favor, inicia sesión como administrador.');
                setLoading(false);
                return;
            }

            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
                params: {
                    status: filterStatus === 'Todos' ? '' : filterStatus 
                }
            };
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/admin/orders`, config);
            setOrders(response.data);
        } catch (err) {
            console.error('Error al cargar las órdenes:', err.response?.data || err.message);
            if (err.response?.status === 401 || err.response?.status === 403) {
                setError('No autorizado. No tienes permisos para ver esta página.');
                toast.error('Acceso denegado. Se requiere rol de administrador.');
            } else {
                setError('Error al cargar las órdenes. Intenta de nuevo más tarde.');
                toast.error('Error al cargar las órdenes.');
            }
        } finally {
            setLoading(false);
        }
    };

    /**
     * @function handleViewDetails
     * @description Maneja la visualización de los detalles de una orden específica.
     * @param {string} orderId El ID de la orden a ver.
     */
    const handleViewDetails = async (orderId) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            const response = await axios.get(`${import.meta.env.VITE_BACKEND_URL}/admin/orders/${orderId}`, config);
            setSelectedOrder(response.data);
            setShowDetailModal(true);
        } catch (err) {
            console.error('Error al cargar los detalles de la orden:', err.response?.data || err.message);
            toast.error('No se pudieron cargar los detalles de la orden.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * @function handleCloseDetailModal
     * @description Cierra el modal de detalles de la orden.
     */
    const handleCloseDetailModal = () => {
        setShowDetailModal(false);
        setSelectedOrder(null);
    };

    /**
     * @function handleUpdateStatusClick
     * @description Abre el modal para actualizar el estado de una orden.
     * @param {object} order El objeto de la orden que se va a actualizar.
     */
    const handleUpdateStatusClick = (order) => {
        setOrderToUpdate(order);
        setShowUpdateStatusModal(true);
    };

    /**
     * @function handleCloseUpdateStatusModal
     * @description Cierra el modal de actualización de estado.
     */
    const handleCloseUpdateStatusModal = () => {
        setShowUpdateStatusModal(false);
        setOrderToUpdate(null);
    };

    /**
     * @function handleConfirmUpdateStatus
     * @description Envía la petición al backend para actualizar el estado de una orden y/o su pago.
     * @param {string} orderId El ID de la orden a actualizar.
     * @param {string} newOrderStatus El nuevo estado de la orden.
     * @param {string} newPaymentStatus El nuevo estado del pago.
     */
    const handleConfirmUpdateStatus = async (orderId, newOrderStatus, newPaymentStatus) => {
        setLoading(true);
        try {
            const token = localStorage.getItem('token');
            const config = { headers: { Authorization: `Bearer ${token}` } };
            
            const payload = {
                orderStatus: newOrderStatus,
                paymentStatus: newPaymentStatus,
            };

            await axios.put(`${import.meta.env.VITE_BACKEND_URL}/admin/orders/${orderId}/status`, payload, config);
            
            // Construir el mensaje de toast basado en los cambios
            let toastMessage = `Orden #${String(orderId).substring(0, 8)}... actualizada.`;
            const originalOrder = orders.find(o => o.id === orderId);

            if (originalOrder) {
                const orderChanged = newOrderStatus !== originalOrder.orderStatus;
                const paymentChanged = newPaymentStatus !== (originalOrder.payment?.paymentStatus || 'Pending');

                if (orderChanged && paymentChanged) {
                    toastMessage = `Orden #${String(orderId).substring(0, 8)}...: Estado de Orden a "${orderStatusDisplayNames[newOrderStatus]}" y Pago a "${newPaymentStatus}".`;
                } else if (orderChanged) {
                    toastMessage = `Orden #${String(orderId).substring(0, 8)}...: Estado de Orden actualizado a "${orderStatusDisplayNames[newOrderStatus]}".`;
                } else if (paymentChanged) {
                    toastMessage = `Orden #${String(orderId).substring(0, 8)}...: Estado de Pago actualizado a "${newPaymentStatus}".`;
                }
            }
            toast.success(toastMessage);

            fetchOrders(); // Vuelve a cargar las órdenes para reflejar el cambio
            handleCloseUpdateStatusModal(); // Cierra el modal después de la actualización exitosa
        } catch (err) {
            console.error('Error al actualizar el estado de la orden:', err.response?.data || err.message);
            toast.error('Error al actualizar el estado de la orden. Intenta de nuevo.');
        } finally {
            setLoading(false);
        }
    };

    /**
     * @function getStatusBadgeClass
     * @description Devuelve la clase CSS de Bootstrap para el badge de estado de la ORDEN.
     * @param {string} status El estado de la orden (valor del enum del backend).
     * @returns {string} La clase CSS correspondiente.
     */
    const getStatusBadgeClass = (status) => {
        switch (status) {
            case 'Delivered': return 'bg-success';
            case 'Shipped': return 'bg-info text-dark';
            case 'Processing': return 'bg-warning text-dark';
            case 'Pending': return 'bg-secondary';
            case 'Cancelled': return 'bg-danger';
            default: return 'bg-light text-dark';
        }
    };

    // Muestra un spinner de carga si la página está cargando y no hay modales abiertos
    if (loading && !selectedOrder && !showUpdateStatusModal) {
        return <LoadingSpinner />;
    }

    return (
        <Container fluid className="py-5 bg-light min-vh-100">
            {/* Título y descripción de la página */}
            <Row className="justify-content-center text-center mb-5 pb-4">
                <Col md={10} lg={8}>
                    <h1 className="display-4 fw-bold text-dark mb-3">
                        Gestión de Órdenes de Compra
                    </h1>
                    <p className="lead text-muted mx-auto" style={{ maxWidth: '700px' }}>
                        Visualiza, filtra y actualiza el estado de todas las órdenes de los clientes.
                    </p>
                </Col>
            </Row>

            {/* Sección de filtros y acciones generales */}
            <Row className="justify-content-center mb-4">
                <Col md={10} lg={10}>
                    <Card className="shadow-sm rounded-lg border-0">
                        <Card.Body>
                            <Row className="align-items-center">
                                <Col md={6}>
                                    <h5 className="mb-0 text-dark fw-bold"><FaFilter className="me-2 text-primary" />Filtrar por Estado de Orden</h5>
                                </Col>
                                <Col md={6} className="text-md-end">
                                    {/* Dropdown para seleccionar el estado de filtro */}
                                    <Dropdown onSelect={(eventKey) => setFilterStatus(eventKey)} className="d-inline-block me-2">
                                        <Dropdown.Toggle variant="outline-primary" id="dropdown-basic" className="rounded-pill px-4">
                                            {orderStatusDisplayNames[filterStatus]} {/* Muestra el nombre amigable */}
                                        </Dropdown.Toggle>
                                        <Dropdown.Menu>
                                            {orderStatuses.map((status) => (
                                                <Dropdown.Item key={status} eventKey={status}>
                                                    {orderStatusDisplayNames[status]}
                                                </Dropdown.Item>
                                            ))}
                                        </Dropdown.Menu>
                                    </Dropdown>
                                    {/* Botón para recargar las órdenes manualmente */}
                                    <Button variant="outline-secondary" onClick={fetchOrders} className="rounded-pill px-4">
                                        <FaSyncAlt className="me-2" /> Actualizar
                                    </Button>
                                </Col>
                            </Row>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* Sección principal de la tabla de órdenes */}
            <Row className="justify-content-center">
                <Col md={10} lg={10}>
                    {/* Muestra un mensaje de error si existe */}
                    {error && (
                        <Alert variant="danger" className="text-center mb-4 shadow-sm">
                            <FaExclamationCircle className="me-2" /> {error}
                        </Alert>
                    )}

                    {/* Mensaje si no hay órdenes para mostrar después de la carga y sin error */}
                    {!loading && orders.length === 0 && !error ? (
                        <Card className="text-center p-5 shadow-sm rounded-lg border-0">
                            <Card.Body>
                                <FaExclamationCircle className="text-muted mb-4" style={{ fontSize: '4rem' }} />
                                <h3 className="fw-bold text-dark mb-3">No hay órdenes para mostrar</h3>
                                <p className="text-muted mb-4">
                                    Ajusta el filtro o espera nuevas órdenes.
                                </p>
                            </Card.Body>
                        </Card>
                    ) : (
                        // Tabla de órdenes si hay datos
                        <Card className="shadow-lg rounded-lg border-0">
                            <Card.Header className="bg-primary text-white py-3 fs-5 fw-bold">
                                Órdenes Recientes
                            </Card.Header>
                            <Card.Body className="p-0">
                                <div className="table-responsive">
                                    <Table striped hover className="mb-0">
                                        <thead>
                                            <tr>
                                                <th scope="col" className="text-muted fw-normal small">ID Orden</th>
                                                <th scope="col" className="text-muted fw-normal small">Cliente</th> 
                                                <th scope="col" className="text-muted fw-normal small">Fecha</th>
                                                <th scope="col" className="text-muted fw-normal small">Total</th>
                                                <th scope="col" className="text-muted fw-normal small">Estado Orden</th>
                                                <th scope="col" className="text-muted fw-normal small">Estado Pago</th> {/* Nuevo encabezado */}
                                                <th scope="col" className="text-muted fw-normal small">Acciones</th>
                                            </tr>
                                        </thead>
                                        <tbody>
                                            {orders.map((order) => (
                                                <tr key={order.id}>
                                                    <td className="align-middle fw-medium">{String(order.id).substring(0, 8)}...</td>
                                                    <td className="align-middle text-muted small">{order.user ? order.user.fullName || order.user.email : 'N/A'}</td> 
                                                    <td className="align-middle text-muted small">{new Date(order.createdAt).toLocaleDateString()}</td>
                                                    <td className="align-middle fw-bold text-success">${parseFloat(order.totalAmount).toFixed(2)}</td>
                                                    <td className="align-middle">
                                                        <span className={`badge rounded-pill py-2 px-3 ${getStatusBadgeClass(order.orderStatus)}`}>
                                                            {orderStatusDisplayNames[order.orderStatus] || order.orderStatus}
                                                        </span>
                                                    </td>
                                                    <td className="align-middle"> {/* Columna para estado de pago */}
                                                        {order.payment ? (
                                                            <span className={`badge rounded-pill py-2 px-3 ${
                                                                order.payment.paymentStatus === 'Confirmed' ? 'bg-success' :
                                                                order.payment.paymentStatus === 'Pending' ? 'bg-warning text-dark' :
                                                                order.payment.paymentStatus === 'Failed' ? 'bg-danger' :
                                                                order.payment.paymentStatus === 'Refunded' ? 'bg-info text-dark' : // Estilo para 'Refunded'
                                                                'bg-light text-dark'
                                                            }`}>
                                                                {order.payment.paymentStatus}
                                                            </span>
                                                        ) : (
                                                            <span className="badge bg-secondary rounded-pill py-2 px-3">No hay Pago</span>
                                                        )}
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
                                                            onClick={() => handleUpdateStatusClick(order)}
                                                            variant="outline-info"
                                                            size="sm"
                                                            className="rounded-pill"
                                                            disabled={loading}
                                                        >
                                                            <FaEdit className="me-1" /> Actualizar Estado
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

            {/* Modal de detalles de la orden */}
            {showDetailModal && selectedOrder && (
                <OrderDetailModal order={selectedOrder} onClose={handleCloseDetailModal} />
            )}

            {/* Modal para actualizar el estado de la orden */}
            {showUpdateStatusModal && orderToUpdate && (
                <UpdateStatusModal
                    order={orderToUpdate}
                    onClose={handleCloseUpdateStatusModal}
                    onConfirm={handleConfirmUpdateStatus}
                    availableOrderStatuses={orderStatuses.filter(s => s !== 'Todos')} // No incluimos 'Todos'
                />
            )}
        </Container>
    );
};

export default OrderManagementPage;
