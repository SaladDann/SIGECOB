// frontend/src/components/UpdateStatusModal.jsx
import React, { useState } from 'react';
import { Modal, Button, Form, Alert } from 'react-bootstrap';
import { FaExclamationTriangle, FaCheckCircle } from 'react-icons/fa';

/**
 * @function UpdateStatusModal
 * @description Componente modal para permitir a los administradores actualizar
 * el estado de una orden y/o el estado de su pago. Incluye una confirmación.
 * @param {object} props Las propiedades del componente.
 * @param {object} props.order El objeto de la orden a actualizar (incluye orderStatus y payment.paymentStatus).
 * @param {function} props.onClose Función de callback para cerrar el modal.
 * @param {function} props.onConfirm Función de callback para confirmar la actualización de estado.
 * @param {string[]} props.availableOrderStatuses Array de estados de orden disponibles para seleccionar.
 */
const UpdateStatusModal = ({ order, onClose, onConfirm, availableOrderStatuses }) => {
    // Estado para el nuevo estado de la orden seleccionado
    const [newOrderStatus, setNewOrderStatus] = useState(order.orderStatus);
    // Estado para el nuevo estado del pago seleccionado
    // Asegura un valor por defecto que exista en PaymentStatus.
    const [newPaymentStatus, setNewPaymentStatus] = useState(order.payment?.paymentStatus || 'Pending'); 

    // Estado para controlar la etapa de confirmación
    const [confirming, setConfirming] = useState(false);
    // Estado para mostrar un mensaje de éxito después de la actualización (manejado por el padre)
    const [successMessage, setSuccessMessage] = useState(null);

    // Estados de pago disponibles (DEBEN COINCIDIR EXACTAMENTE CON TU ENUM 'PaymentStatus' EN PRISMA)
    const availablePaymentStatuses = ['Pending', 'Confirmed', 'Cancelled', 'Refunded']; 

    /**
     * @function handleConfirmClick
     * @description Maneja el clic en el botón "Confirmar Cambio",
     * pasando a la etapa de confirmación final.
     */
    const handleConfirmClick = () => {
        setConfirming(true);
    };

    /**
     * @function handleFinalConfirm
     * @description Maneja el clic en el botón "Sí, Actualizar",
     * disparando la función onConfirm pasada por props y gestionando el feedback.
     */
    const handleFinalConfirm = async () => {
        setConfirming(false); 
        setSuccessMessage(null); 
        try {
            // Llama a la función onConfirm del padre con ambos estados
            await onConfirm(order.id, newOrderStatus, newPaymentStatus); 
            // El mensaje de éxito se gestiona en el componente padre OrderManagementPage
            // que recarga las órdenes y muestra el toast.
            onClose(); // Cierra el modal después de que el padre ha procesado la confirmación
        } catch (error) {
            // Los errores se gestionan en el componente padre OrderManagementPage
            console.error("Error confirmando la actualización de estado en el modal:", error);
        }
    };

    /**
     * @function handleCancel
     * @description Maneja el clic en el botón "Cerrar" o "Cancelar",
     * reseteando el estado de confirmación y cerrando el modal.
     */
    const handleCancel = () => {
        setConfirming(false);
        onClose();
    };

    // Determina si los estados seleccionados son diferentes a los actuales de la orden
    const isOrderStatusChanged = newOrderStatus !== order.orderStatus;
    const isPaymentStatusChanged = newPaymentStatus !== (order.payment?.paymentStatus || 'Pending');
    const isNoChange = !isOrderStatusChanged && !isPaymentStatusChanged;

    return (
        <Modal show={true} onHide={onClose} centered>
            <Modal.Header closeButton className="bg-info text-white">
                <Modal.Title>
                    <FaExclamationTriangle className="me-2" /> Actualizar Estados de Orden #{String(order.id).substring(0, 8)}...
                </Modal.Title>
            </Modal.Header>
            <Modal.Body>
                {/* Muestra un mensaje de éxito si la actualización fue exitosa */}
                {successMessage && (
                    <Alert variant="success" className="d-flex align-items-center">
                        <FaCheckCircle className="me-2" /> {successMessage}
                    </Alert>
                )}
                {/* Contenido principal del modal si no hay un mensaje de éxito */}
                {!successMessage && (
                    <>
                        <p>Orden ID: <strong>{String(order.id).substring(0, 8)}...</strong></p>
                        <p>Estado Actual de Orden: <span className="fw-bold">{order.orderStatus}</span></p>
                        <p>Estado Actual de Pago: <span className="fw-bold">{order.payment?.paymentStatus || 'N/A'}</span></p>

                        {!confirming ? (
                            <>
                                {/* Selección del nuevo estado de la ORDEN */}
                                <Form.Group controlId="newOrderStatus" className="mb-3">
                                    <Form.Label>Selecciona el nuevo estado de la Orden:</Form.Label>
                                    <Form.Select
                                        value={newOrderStatus}
                                        onChange={(e) => setNewOrderStatus(e.target.value)}
                                    >
                                        {availableOrderStatuses.map((status) => (
                                            <option key={status} value={status}>
                                                {status}
                                            </option>
                                        ))}
                                    </Form.Select>
                                </Form.Group>

                                {/* Selección del nuevo estado del PAGO */}
                                <Form.Group controlId="newPaymentStatus" className="mb-3">
                                    <Form.Label>Selecciona el nuevo estado del Pago:</Form.Label>
                                    <Form.Select
                                        value={newPaymentStatus}
                                        onChange={(e) => setNewPaymentStatus(e.target.value)}
                                        disabled={!order.payment} // Deshabilitar si no hay un objeto de pago
                                    >
                                        {availablePaymentStatuses.map((status) => (
                                            <option key={status} value={status}>
                                                {status}
                                            </option>
                                        ))}
                                    </Form.Select>
                                    {!order.payment && <Form.Text className="text-muted">No se puede actualizar el estado de pago, la orden no tiene información de pago.</Form.Text>}
                                </Form.Group>
                            </>
                        ) : (
                            // Mensaje de confirmación final
                            <Alert variant="warning">
                                ¿Estás seguro de que quieres aplicar los siguientes cambios?
                                <ul>
                                    {isOrderStatusChanged && <li>Estado de Orden: <strong>{order.orderStatus}</strong> $\to$ <strong>{newOrderStatus}</strong></li>}
                                    {isPaymentStatusChanged && <li>Estado de Pago: <strong>{order.payment?.paymentStatus || 'N/A'}</strong> $\to$ <strong>{newPaymentStatus}</strong></li>}
                                </ul>
                                Esta acción puede afectar el flujo del cliente.
                            </Alert>
                        )}
                    </>
                )}
            </Modal.Body>
            <Modal.Footer>
                {!successMessage && (
                    <>
                        <Button variant="secondary" onClick={handleCancel} disabled={confirming}>
                            {confirming ? 'Cancelar' : 'Cerrar'}
                        </Button>
                        {!confirming ? (
                            // Botón "Confirmar Cambio" (Paso 1)
                            <Button
                                variant="primary"
                                onClick={handleConfirmClick}
                                disabled={isNoChange} // Deshabilitado si no hay cambios
                            >
                                <FaCheckCircle className="me-2" /> Confirmar Cambio
                            </Button>
                        ) : (
                            // Botón "Sí, Actualizar" (Paso 2)
                            <Button variant="danger" onClick={handleFinalConfirm}>
                                <FaCheckCircle className="me-2" /> Sí, Actualizar
                            </Button>
                        )}
                    </>
                )}
            </Modal.Footer>
        </Modal>
    );
};

export default UpdateStatusModal;
