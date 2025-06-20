import React, { useState, useEffect, useCallback } from 'react';
import { Container, Row, Col, Button, Spinner, Alert, ListGroup, Card, Form } from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify'; // Importamos toastify

function CheckoutPage() {
    const { token, isAuthenticated, user } = useAuth();
    const navigate = useNavigate();

    const [userCart, setUserCart] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null); // Errores de carga de carrito o iniciales
    const [processingOrder, setProcessingOrder] = useState(false); // Estado para el spinner del botón de pedido

    // Estados para la dirección de envío
    const [shippingAddress, setShippingAddress] = useState({
        street: '',
        city: '',
        state: '',
        zipCode: '',
        country: 'Ecuador' // Valor por defecto
    });
    const [selectedPaymentMethod, setSelectedPaymentMethod] = useState('');
    const [formErrors, setFormErrors] = useState({}); // Errores de validación de formulario

    // Mensaje de éxito/error después de intentar procesar una orden
    const [orderMessage, setOrderMessage] = useState(null);
    const [orderMessageType, setOrderMessageType] = useState('');

    // URLs de la API
    const API_URL_CART_GET = `${import.meta.env.VITE_BACKEND_URL}/cart/get`;
    const API_URL_CREATE_ORDER = `${import.meta.env.VITE_BACKEND_URL}/orders/create`;

    // Redirigir si no está autenticado y pre-llenar dirección si el usuario la tiene
    useEffect(() => {
        if (!isAuthenticated) {
            toast.warn('Debes iniciar sesión para completar tu compra.', { autoClose: 3000 });
            navigate('/login');
            return; // Importante: detener la ejecución si no está autenticado
        }
        
        // Pre-llenar la dirección si el usuario la tiene en su perfil y el campo de calle está vacío
        // Asumimos que user.address es una cadena simple para la calle.
        // Si tu backend guarda la dirección de forma más estructurada (ej. objeto { street, city, ... }), deberías adaptarlo aquí.
        if (user && user.address && !shippingAddress.street) { 
            setShippingAddress(prev => ({ ...prev, street: user.address }));
        }
    }, [isAuthenticated, navigate, user, shippingAddress.street]); 

    // Función para obtener el carrito del usuario
    const fetchUserCart = useCallback(async () => {
        if (!token) {
            setLoading(false);
            return; // No intentar cargar el carrito si no hay token (ya se redirigió si !isAuthenticated)
        }

        setLoading(true);
        setError(null); // Limpiar errores previos de carga
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                },
            };
            const response = await axios.get(API_URL_CART_GET, config);
            setUserCart(response.data);

            if (!response.data || response.data.items.length === 0) {
                setError('Tu carrito está vacío. Añade productos antes de proceder al pago.');
                toast.info('Tu carrito está vacío. ¡Vamos de compras!', { autoClose: 4000 });
            }
        } catch (err) {
            console.error('Error al obtener el carrito para checkout:', err.response?.data || err.message);
            const errorMessage = err.response?.data?.message || 'No se pudo cargar tu carrito. Por favor, intenta de nuevo.';
            setError(errorMessage);
            toast.error(errorMessage, { autoClose: 5000 });
        } finally {
            setLoading(false);
        }
    }, [token, API_URL_CART_GET]);

    useEffect(() => {
        fetchUserCart();
    }, [fetchUserCart]);

    // Calcula el total del carrito
    const calculateCartTotal = useCallback(() => {
        if (!userCart || !userCart.items || userCart.items.length === 0) return 0;
        return userCart.items.reduce((total, item) => total + (item.quantity * item.price), 0);
    }, [userCart]);

    // Manejar cambios en los campos de la dirección
    const handleAddressChange = (e) => {
        const { name, value } = e.target;
        setShippingAddress(prevAddress => ({
            ...prevAddress,
            [name]: value
        }));
        // Limpiar el error específico de este campo al cambiarlo
        if (formErrors[name]) {
            setFormErrors(prevErrors => {
                const newErrors = { ...prevErrors };
                delete newErrors[name];
                return newErrors;
            });
        }
    };

    // Manejar cambio en el método de pago
    const handlePaymentMethodChange = (e) => {
        setSelectedPaymentMethod(e.target.value);
        // Limpiar el error del método de pago al cambiarlo
        if (formErrors.paymentMethod) {
            setFormErrors(prevErrors => {
                const newErrors = { ...prevErrors };
                delete newErrors.paymentMethod;
                return newErrors;
            });
        }
    };

    // Función para validar campos del formulario antes de enviar
    const validateForm = useCallback(() => { // Usar useCallback para memoizar
        const currentErrors = {};
        if (!shippingAddress.street.trim()) currentErrors.street = 'La calle y número son requeridos.';
        if (!shippingAddress.city.trim()) currentErrors.city = 'La ciudad es requerida.';
        if (!shippingAddress.state.trim()) currentErrors.state = 'El estado/provincia es requerido.';
        // Validación de código postal: si es de 6 dígitos numéricos
        if (!shippingAddress.zipCode.trim() || !/^\d{6}$/.test(shippingAddress.zipCode.trim())) {
            currentErrors.zipCode = 'El código postal es requerido y debe ser de 6 dígitos numéricos (ej: 090101).';
        }
        if (!selectedPaymentMethod) currentErrors.paymentMethod = 'Debes seleccionar un método de pago.';

        setFormErrors(currentErrors); // ¡Aquí es donde actualizamos el estado de errores!
        return Object.keys(currentErrors).length === 0; // Retorna true si no hay errores
    }, [shippingAddress, selectedPaymentMethod]); // Dependencias para useCallback

    // Manejar el proceso de pago (al hacer click en el botón)
    const handlePlaceOrder = async () => {
        setOrderMessage(null); // Limpiar mensaje de orden previo
        setOrderMessageType('');

        if (!validateForm()) {
            toast.error('Por favor, corrige los errores en el formulario para continuar.', { autoClose: 5000 });
            return;
        }

        // Valida que el carrito no esté vacío después de la validación del formulario
        if (!userCart || userCart.items.length === 0) {
            toast.error('No puedes realizar un pedido con un carrito vacío.', { autoClose: 5000 });
            // setError('No puedes realizar un pedido con un carrito vacío.'); // Si quieres que se muestre en el mensaje principal
            return;
        }

        setProcessingOrder(true);
        try {
            const config = {
                headers: {
                    Authorization: `Bearer ${token}`,
                    'Content-Type': 'application/json',
                },
            };

            const fullShippingAddress = `${shippingAddress.street}, ${shippingAddress.city}, ${shippingAddress.state}, ${shippingAddress.zipCode}, ${shippingAddress.country}`;

            const response = await axios.post(
                API_URL_CREATE_ORDER,
                {
                    shippingAddress: fullShippingAddress,
                    paymentMethod: selectedPaymentMethod,
                },
                config
            );

            console.log('Respuesta exitosa del backend:', response.data);
            toast.success('¡Tu pedido ha sido realizado con éxito!', { autoClose: 3000 });
            setUserCart({ ...userCart, items: [] }); // Vaciar carrito visualmente en el frontend
            setOrderMessage('¡Tu pedido ha sido realizado con éxito! Redirigiendo a tu historial de órdenes...');
            setOrderMessageType('success');

            setTimeout(() => {
                navigate('/order-history'); // Redirigir al historial de pedidos
            }, 3000);

        } catch (err) {
            console.error('Error al procesar el pedido:', err.response?.data || err.message);
            const errorMessage = err.response?.data?.message || 'Error al procesar el pedido. Por favor, intenta de nuevo.';
            toast.error(errorMessage, { autoClose: 5000 });
            setOrderMessage(errorMessage);
            setOrderMessageType('danger');
        } finally {
            setProcessingOrder(false);
        }
    };

    // Manejar la cancelación del pedido
    const handleCancelOrder = () => {
        if (window.confirm('¿Estás seguro de que quieres cancelar el proceso de compra y volver a los productos? Tu carrito no se vaciará.')) {
            navigate('/productos');
        }
    };

    // --- Renderizado Condicional de la UI ---

    // Pantalla de carga inicial del carrito
    if (loading) {
        return (
            <Container fluid className="d-flex justify-content-center align-items-center bg-light" style={{ minHeight: '100vh' }}>
                <Spinner animation="border" role="status" variant="primary">
                    <span className="visually-hidden">Cargando carrito...</span>
                </Spinner>
                <p className="ms-3 text-muted">Cargando tu carrito de compras...</p>
            </Container>
        );
    }

    // Si hay un error general (ej. no se pudo cargar el carrito) O el carrito está vacío después de cargar
    if (error && (!userCart || userCart.items.length === 0)) {
        return (
            <Container fluid className="d-flex flex-column justify-content-center align-items-center bg-light text-center" style={{ minHeight: '100vh' }}>
                <Alert variant="info" className="mb-4 shadow-sm border-0 rounded-lg">
                    <h4 className="alert-heading">¡Tu carrito está vacío!</h4>
                    <p>Parece que no hay productos en tu carrito. Agrega algunos antes de proceder con la compra.</p>
                    <hr />
                    <p className="mb-0">¡Te esperamos para que encuentres tus productos favoritos!</p>
                </Alert>
                <Button variant="primary" size="lg" className="rounded-pill px-4 py-2" onClick={() => navigate('/productos')}>
                    Explorar Productos
                </Button>
            </Container>
        );
    }
    
    // Si el carrito está vacío (incluso si no hay un error específico de carga, ej. usuario lo vació)
    // Esto asegura que siempre se muestre este mensaje si el carrito está realmente vacío al final.
    if (!userCart || userCart.items.length === 0) {
        return (
            <Container fluid className="d-flex flex-column justify-content-center align-items-center bg-light text-center" style={{ minHeight: '100vh' }}>
                <Alert variant="info" className="mb-4 shadow-sm border-0 rounded-lg">
                    <h4 className="alert-heading">¡Tu carrito está vacío!</h4>
                    <p>No hay productos para procesar. Por favor, añade algunos artículos a tu carrito.</p>
                </Alert>
                <Button variant="primary" size="lg" className="rounded-pill px-4 py-2" onClick={() => navigate('/productos')}>
                    Ir a Comprar
                </Button>
            </Container>
        );
    }

    // Si todo lo anterior pasó, renderiza la página de checkout principal
    return (
        <Container fluid className="py-5 bg-light min-vh-100">
            <Row className="justify-content-center">
                <Col lg={8} xl={7}> {/* Centramos el contenido y le damos un ancho máximo elegante */}
                    <h1 className="text-center mb-5 fw-bold text-dark">Confirmar Pedido</h1>

                    <Card className="shadow-lg border-0 rounded-lg"> {/* Sombra y bordes redondeados para un look moderno */}
                        <Card.Header className="bg-dark text-white py-3 fw-bold fs-5 rounded-top-lg">
                            Resumen de tu Compra
                        </Card.Header>
                        <Card.Body className="p-4 p-md-5"> {/* Más padding interno */}

                            {/* Mensaje de orden (éxito/error al procesar) */}
                            {orderMessage && (
                                <Alert variant={orderMessageType} className="text-center mb-4 border-0 rounded-pill py-2">
                                    {orderMessage}
                                </Alert>
                            )}

                            <h4 className="mb-4 text-muted">Productos en tu Carrito:</h4>
                            <ListGroup variant="flush" className="mb-5 border rounded-lg"> {/* Border y rounded para la lista */}
                                {userCart.items.map(item => (
                                    <ListGroup.Item key={item.id} className="d-flex justify-content-between align-items-center py-3">
                                        <div className="d-flex align-items-center">
                                            
                                            <div>
                                                <span className="fw-semibold text-dark">{item.product.name}</span>
                                                <span className="text-muted d-block small">Cantidad: {item.quantity}</span>
                                            </div>
                                        </div>
                                        <div className="fw-bold text-primary fs-5">${(item.quantity * item.price).toFixed(2)}</div>
                                    </ListGroup.Item>
                                ))}
                                <ListGroup.Item className="d-flex justify-content-between align-items-center py-3 bg-light rounded-bottom-lg">
                                    <span className="fw-bold text-dark fs-4">Total a Pagar:</span>
                                    <span className="fw-bold text-dark fs-4">${calculateCartTotal().toFixed(2)}</span>
                                </ListGroup.Item>
                            </ListGroup>

                            <h4 className="mt-5 mb-4 text-muted">Información del Cliente:</h4>
                            <Card className="bg-light p-4 mb-5 border-0 rounded-lg"> {/* Fondo claro y sin bordes para la tarjeta de info */}
                                <p className="mb-2">
                                    <strong className="text-dark">Nombre:</strong> <span className="text-muted">{user?.fullName || 'N/A'}</span>
                                </p>
                                <p className="mb-0">
                                    <strong className="text-dark">Email:</strong> <span className="text-muted">{user?.email || 'N/A'}</span>
                                </p>
                            </Card>

                            {/* FORMULARIO DE DIRECCIÓN DE ENVÍO */}
                            <h4 className="mb-4 text-muted">Dirección de Envío:</h4>
                            <Form>
                                <Row className="mb-3">
                                    <Col md={12}>
                                        <Form.Group controlId="formGridStreet">
                                            <Form.Label className="fw-semibold text-dark">Calle y número</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="Ej: Av. 9 de Octubre 123, Edificio XYZ"
                                                name="street"
                                                value={shippingAddress.street}
                                                onChange={handleAddressChange}
                                                isInvalid={!!formErrors.street}
                                                className="py-2"
                                            />
                                            <Form.Control.Feedback type="invalid">{formErrors.street}</Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row className="mb-3">
                                    <Col md={6}>
                                        <Form.Group controlId="formGridCity">
                                            <Form.Label className="fw-semibold text-dark">Ciudad</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="Ej: Guayaquil"
                                                name="city"
                                                value={shippingAddress.city}
                                                onChange={handleAddressChange}
                                                isInvalid={!!formErrors.city}
                                                className="py-2"
                                            />
                                            <Form.Control.Feedback type="invalid">{formErrors.city}</Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group controlId="formGridState">
                                            <Form.Label className="fw-semibold text-dark">Estado/Provincia</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="Ej: Guayas"
                                                name="state"
                                                value={shippingAddress.state}
                                                onChange={handleAddressChange}
                                                isInvalid={!!formErrors.state}
                                                className="py-2"
                                            />
                                            <Form.Control.Feedback type="invalid">{formErrors.state}</Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                </Row>

                                <Row className="mb-3">
                                    <Col md={6}>
                                        <Form.Group controlId="formGridZip">
                                            <Form.Label className="fw-semibold text-dark">Código Postal</Form.Label>
                                            <Form.Control
                                                type="text"
                                                placeholder="Ej: 090101"
                                                name="zipCode"
                                                value={shippingAddress.zipCode}
                                                onChange={handleAddressChange}
                                                isInvalid={!!formErrors.zipCode}
                                                className="py-2"
                                            />
                                            <Form.Control.Feedback type="invalid">{formErrors.zipCode}</Form.Control.Feedback>
                                        </Form.Group>
                                    </Col>
                                    <Col md={6}>
                                        <Form.Group controlId="formGridCountry">
                                            <Form.Label className="fw-semibold text-dark">País</Form.Label>
                                            <Form.Control
                                                type="text"
                                                name="country"
                                                value={shippingAddress.country}
                                                onChange={handleAddressChange}
                                                className="py-2"
                                            />
                                        </Form.Group>
                                    </Col>
                                </Row>
                            </Form>

                            {/* SECCIÓN DE MÉTODO DE PAGO */}
                            <h4 className="mt-5 mb-4 text-muted">Método de Pago:</h4>
                            <Form.Group className="mb-5" controlId="formPaymentMethod">
                                <Form.Label className="fw-semibold text-dark">Selecciona un método de pago</Form.Label>
                                <Form.Select
                                    name="paymentMethod"
                                    value={selectedPaymentMethod}
                                    onChange={handlePaymentMethodChange}
                                    isInvalid={!!formErrors.paymentMethod}
                                    className="py-2"
                                >
                                    <option value="">Selecciona una opción...</option>
                                    <option value="Tarjeta de Crédito">Tarjeta de Crédito</option>
                                    <option value="PayPal">PayPal</option>
                                    <option value="Transferencia Bancaria">Transferencia Bancaria</option>
                                </Form.Select>
                                <Form.Control.Feedback type="invalid">{formErrors.paymentMethod}</Form.Control.Feedback>
                            </Form.Group>

                            {/* BOTONES DE ACCIÓN */}
                            <div className="d-grid gap-3">
                                <Button
                                    variant="primary"
                                    className="py-3 fw-bold fs-5 rounded-pill shadow"
                                    onClick={handlePlaceOrder}
                                    disabled={processingOrder || !userCart || userCart.items.length === 0 || Object.keys(formErrors).length > 0}
                                    // Removed `!validateForm()` from disabled, as `validateForm()` is called at `handlePlaceOrder` start.
                                >
                                    {processingOrder ? (
                                        <>
                                            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                                            Procesando Pedido...
                                        </>
                                    ) : (
                                        'Confirmar Pedido y Pagar'
                                    )}
                                </Button>
                                <Button
                                    variant="outline-secondary"
                                    className="py-2 fw-semibold rounded-pill"
                                    onClick={handleCancelOrder}
                                    disabled={processingOrder}
                                >
                                    Cancelar Pedido
                                </Button>
                            </div>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default CheckoutPage;