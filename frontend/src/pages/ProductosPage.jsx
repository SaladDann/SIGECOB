// frontend/src/pages/ProductosPage.jsx
import React, { useState, useEffect, useMemo } from 'react';
import {
    Container, Row, Col, Card, Button, Spinner, Alert, Modal, Table, Form,
    Pagination // Importar componente Pagination de react-bootstrap
} from 'react-bootstrap';
import axios from 'axios';
import { useAuth } from '../context/AuthContext.jsx';
import { useCart } from '../context/CartContext.jsx';
import { useNavigate } from 'react-router-dom';
import { FaShoppingCart, FaInfoCircle, FaPlus, FaMinus, FaTrashAlt, FaStore, FaTag } from 'react-icons/fa'; // Añadido FaTag para ofertas

import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

function ProductosPage() {
    const { isAuthenticated } = useAuth();
    const {
        userCart,
        cartLoading,
        cartError,
        fetchUserCart,
        addItemToCart,
        removeItemFromCart,
        updateCartItemQuantity,
        clearCart,
        calculateCartTotal,
        showCartModal,
        openCartModal,
        closeCartModal
    } = useCart();

    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const [showProductDetailModal, setShowProductDetailModal] = useState(false);
    const [selectedProduct, setSelectedProduct] = useState(null);

    // --- NUEVOS ESTADOS PARA PAGINACIÓN ---
    const [currentPage, setCurrentPage] = useState(1);
    const [totalPages, setTotalPages] = useState(1);
    const [totalProductsCount, setTotalProductsCount] = useState(0); // Para mostrar el total si es necesario
    const [pageSize, setPageSize] = useState(12); // Productos por página, puedes cambiarlo

    // --- ESTADOS EXISTENTES PARA FILTROS Y ORDENAMIENTO ---
    const [filters, setFilters] = useState({
        category: '',
        sortOrder: 'desc',
    });
    const [categories, setCategories] = useState([]);

    const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;
    const API_BASE_IMAGE_URL = API_BASE_URL.replace('/api', '');

    const API_URL_PRODUCTS = `${API_BASE_URL}/products`;

    useEffect(() => {
        const fetchProducts = async () => {
            setLoading(true);
            setError(null);
            try {
                // Construir los query parameters, incluyendo paginación y filtros
                const params = {
                    page: currentPage,
                    pageSize: pageSize,
                    category: filters.category,
                    sortBy: 'price', // Tu backend usa 'sortBy' para el ordenamiento de precios
                    order: filters.sortOrder,
                    // Si tienes otros filtros como search, minPrice, maxPrice, inclúyelos aquí:
                    // search: filters.search,
                    // minPrice: filters.minPrice,
                    // maxPrice: filters.maxPrice,
                };

                // Filtrar parámetros vacíos para no enviarlos al backend
                Object.keys(params).forEach(key => {
                    if (params[key] === '' || params[key] === null || params[key] === undefined) {
                        delete params[key];
                    }
                });

                const response = await axios.get(API_URL_PRODUCTS, { params });

                // ¡IMPORTANTE! Accede a 'products' y 'pagination' de la respuesta
                const fetchedProducts = response.data.products;
                const paginationData = response.data.pagination;

                setProducts(fetchedProducts);
                setTotalProductsCount(paginationData.totalProducts);
                setTotalPages(paginationData.totalPages);

                // Obtener categorías únicas solo de los productos recibidos para mantener la coherencia
                const uniqueCategories = [...new Set(fetchedProducts.map(p => p.category).filter(Boolean))];
                setCategories(uniqueCategories);

            } catch (err) {
                console.error('Error al obtener productos:', err.response?.data || err.message);
                setError('No se pudieron cargar los productos. Por favor, intenta de nuevo más tarde.');
                toast.error('Error al cargar productos. Por favor, intenta de nuevo.', {
                    position: "top-right", autoClose: 3000, hideProgressBar: false,
                    closeOnClick: true, pauseOnHover: true, draggable: true, progress: undefined,
                });
            } finally {
                setLoading(false);
            }
        };
        // Dependencias del useEffect: re-ejecutar cuando cambien la página, el tamaño de página o los filtros
        fetchProducts();
    }, [currentPage, pageSize, filters, API_URL_PRODUCTS]);

    // Función para calcular el precio final con descuento (basado en tu backend)
    const getFinalPrice = (product) => {
        const originalPrice = parseFloat(product.price);
        const saleEndDate = product.saleEndDate ? new Date(product.saleEndDate) : null;
        if (product.isOnSale && product.discountPercentage != null && saleEndDate && saleEndDate > new Date()) {
            const discountAmount = originalPrice * (product.discountPercentage / 100);
            return (originalPrice - discountAmount).toFixed(2);
        }
        return originalPrice.toFixed(2);
    };

    const handleViewDetails = (product) => {
        setSelectedProduct(product);
        setShowProductDetailModal(true);
    };

    const handleAddToCartClick = async (productId, quantity, productName) => {
        if (!isAuthenticated) {
            toast.info('Debes iniciar sesión para añadir productos al carrito.', {
                position: "top-center", autoClose: 3000, hideProgressBar: false,
                closeOnClick: true, pauseOnHover: true, draggable: true, progress: undefined,
            });
            return;
        }
        const success = await addItemToCart(productId, quantity, productName);
        if (success) {
            toast.success(`"${productName}" añadido al carrito.`, {
                position: "top-right", autoClose: 2000, hideProgressBar: false,
                closeOnClick: true, pauseOnHover: true, draggable: true, progress: undefined,
            });
        }
    };

    const handleShowCart = () => {
        openCartModal();
    };

    const handleCloseCart = () => {
        closeCartModal();
    };

    const handleRemoveCartItemClick = (itemId, productName) => {
        removeItemFromCart(itemId, productName);
        toast.warn(`"${productName}" eliminado del carrito.`, {
            position: "top-right", autoClose: 2000, hideProgressBar: false,
            closeOnClick: true, pauseOnHover: true, draggable: true, progress: undefined,
        });
    };

    const handleUpdateCartItemQuantityClick = (itemId, currentQuantity, changeType, productId, productName) => {
        let newQuantity = currentQuantity;
        if (changeType === 'increase') {
            newQuantity += 1;
        } else if (changeType === 'decrease') {
            newQuantity -= 1;
        }

        if (newQuantity <= 0) {
            removeItemFromCart(itemId, productName);
            toast.warn(`"${productName}" eliminado del carrito.`, {
                position: "top-right", autoClose: 2000, hideProgressBar: false,
                closeOnClick: true, pauseOnHover: true, draggable: true, progress: undefined,
            });
            return;
        }
        if (newQuantity > 10) {
            toast.info(`¡Máximo 10 unidades de "${productName}" por artículo!`, {
                position: "top-center", autoClose: 3000, hideProgressBar: false,
                closeOnClick: true, pauseOnHover: true, draggable: true, progress: undefined,
            });
            return;
        }
        updateCartItemQuantity(itemId, newQuantity, productName);
    };

    const handleClearCartClick = async () => {
        await clearCart();
        toast.info('Tu carrito ha sido vaciado.', {
            position: "top-right", autoClose: 2000, hideProgressBar: false,
            closeOnClick: true, pauseOnHover: true, draggable: true, progress: undefined,
        });
    };

    // --- MANEJO DE FILTROS Y PAGINACIÓN ---
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPage(1); // Siempre resetear a la primera página al cambiar filtros
    };

    const handlePageChange = (pageNumber) => {
        setCurrentPage(pageNumber);
    };

    const handlePageSizeChange = (e) => {
        setPageSize(parseInt(e.target.value));
        setCurrentPage(1); // Siempre volver a la primera página si cambia el tamaño de la página
    };

    // Función para renderizar los ítems de paginación
    const renderPaginationItems = () => {
        let items = [];
        const maxPagesToShow = 5; // Número máximo de botones de página a mostrar

        items.push(<Pagination.First key="first" onClick={() => handlePageChange(1)} disabled={currentPage === 1} />);
        items.push(<Pagination.Prev key="prev" onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />);

        let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
        let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);

        if (endPage - startPage + 1 < maxPagesToShow) {
            startPage = Math.max(1, endPage - maxPagesToShow + 1);
        }

        if (startPage > 1) {
            items.push(<Pagination.Ellipsis key="ellipsis-start" />);
        }

        for (let number = startPage; number <= endPage; number++) {
            items.push(
                <Pagination.Item key={number} active={number === currentPage} onClick={() => handlePageChange(number)}>
                    {number}
                </Pagination.Item>,
            );
        }

        if (endPage < totalPages) {
            items.push(<Pagination.Ellipsis key="ellipsis-end" />);
        }

        items.push(<Pagination.Next key="next" onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} />);
        items.push(<Pagination.Last key="last" onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} />);

        return items;
    };

    return (
        <Container fluid className="py-5 bg-light min-vh-100">
            <ToastContainer position="top-right" autoClose={5000} hideProgressBar={false} newestOnTop={false} closeOnClick rtl={false} pauseOnFocusLoss draggable pauseOnHover theme="colored" />

            <h1 className="text-center mb-5 display-4 fw-bold text-dark">
                Nuestros Productos
            </h1>

            {isAuthenticated && (
                <div className="text-end mb-4 me-3">
                    <Button variant="info" onClick={handleShowCart} className="shadow-sm">
                        <FaShoppingCart className="me-2" />
                        Ver Carrito ({userCart && userCart.items ? userCart.items.length : 0})
                    </Button>
                </div>
            )}

            {/* --- SECCIÓN DE FILTROS Y ORDENAMIENTO --- */}
            <Row className="mb-4 align-items-center justify-content-center mx-2 g-3">
                <Col xs={12} md={4} lg={3}>
                    <Form.Group controlId="categoryFilter">
                        <Form.Label className="fw-bold text-dark">Filtrar por Categoría:</Form.Label>
                        <Form.Select
                            name="category"
                            value={filters.category}
                            onChange={handleFilterChange}
                            className="shadow-sm"
                        >
                            <option value="">Todas las Categorías</option>
                            {categories.map(cat => (
                                <option key={cat} value={cat}>{cat}</option>
                            ))}
                        </Form.Select>
                    </Form.Group>
                </Col>
                <Col xs={12} md={4} lg={3}>
                    <Form.Group controlId="priceSort">
                        <Form.Label className="fw-bold text-dark">Ordenar por Precio:</Form.Label>
                        <Form.Select
                            name="sortOrder"
                            value={filters.sortOrder}
                            onChange={handleFilterChange}
                            className="shadow-sm"
                        >
                            <option value="desc">Mayor a Menor</option>
                            <option value="asc">Menor a Mayor</option>
                        </Form.Select>
                    </Form.Group>
                </Col>
                {/* Nuevo selector de tamaño de página */}
                <Col xs={12} md={4} lg={3}>
                    <Form.Group controlId="pageSizeSelect">
                        <Form.Label className="fw-bold text-dark">Productos por página:</Form.Label>
                        <Form.Select
                            value={pageSize}
                            onChange={handlePageSizeChange}
                            className="shadow-sm"
                        >
                            <option value="6">6</option>
                            <option value="9">9</option>
                            <option value="12">12</option>
                            <option value="15">15</option>
                            <option value="20">20</option> {/* Opción para 20 productos por página */}
                            <option value="30">30</option>
                        </Form.Select>
                    </Form.Group>
                </Col>
            </Row>
            {/* --- FIN SECCIÓN DE FILTROS Y ORDENAMIENTO --- */}

            {loading && (
                <div className="text-center my-5">
                    <Spinner animation="border" role="status" variant="primary" className="mb-3">
                        <span className="visually-hidden">Cargando productos...</span>
                    </Spinner>
                    <p className="lead text-muted">Cargando la selección de productos de SIGECOB...</p>
                </div>
            )}

            {error && (
                <Alert variant="danger" className="text-center my-4 shadow-sm">
                    {error}
                </Alert>
            )}

            {!loading && !error && products.length === 0 && (
                <Alert variant="info" className="text-center my-4 shadow-sm">
                    <FaStore className="me-2" />
                    Actualmente no hay productos disponibles que coincidan con los filtros aplicados. ¡Vuelve pronto o ajusta tus filtros!
                </Alert>
            )}

            <Row xs={1} sm={2} md={3} lg={4} xl={4} xxl={5} className="g-4 justify-content-center px-2"> {/* Más columnas para pantallas grandes */}
                {products.map(product => {
                    const originalPrice = parseFloat(product.price);
                    const finalPrice = getFinalPrice(product);
                    const isOnActiveSale = product.isOnSale && product.discountPercentage != null &&
                                          product.saleEndDate && new Date(product.saleEndDate) > new Date();
                    return (
                        <Col key={product.id}>
                            <Card className="h-100 shadow-sm border-0 transition-ease-in-out"> {/* Usar shadow-sm y la clase personalizada */}
                                <div className="position-relative">
                                    <Card.Img
                                        variant="top"
                                        src={product.imageUrl ? `${API_BASE_IMAGE_URL}${product.imageUrl}` : 'https://via.placeholder.com/400x250?text=Imagen+No+Disponible'}
                                        alt={product.name}
                                        style={{ height: '220px', objectFit: 'cover' }}
                                        className="border-bottom"
                                    />
                                    {isOnActiveSale && (
                                        <span className="badge bg-danger position-absolute top-0 start-0 m-2 rounded-pill">
                                            <FaTag className="me-1" /> {product.discountPercentage}% OFF
                                        </span>
                                    )}
                                </div>
                                <Card.Body className="d-flex flex-column p-3">
                                    <Card.Title className="text-dark fw-bold mb-1 text-truncate" title={product.name}>
                                        {product.name}
                                    </Card.Title>
                                    <Card.Text className="text-muted small mb-2">
                                        Categoría: {product.category || 'General'}
                                    </Card.Text>

                                    <div className="mt-auto pt-3 border-top">
                                        {isOnActiveSale ? (
                                            <>
                                                <Card.Text className="text-muted text-decoration-line-through mb-0 small">
                                                    ${originalPrice.toFixed(2)}
                                                </Card.Text>
                                                <Card.Text className="fw-bold fs-4 mb-2 text-danger">
                                                    ${finalPrice}
                                                </Card.Text>
                                            </>
                                        ) : (
                                            <Card.Text className="fw-bold fs-4 mb-2 text-success">
                                                ${finalPrice}
                                            </Card.Text>
                                        )}
                                        <Card.Text className="mb-3">
                                            <b className="me-1">Stock:</b>
                                            <span className={product.stock > 0 ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                                                {product.stock > 0 ? `${product.stock} unidades` : 'Agotado'}
                                            </span>
                                        </Card.Text>
                                        <Button
                                            variant="outline-primary"
                                            className="w-100 fw-bold d-flex align-items-center justify-content-center mb-2"
                                            onClick={() => handleViewDetails(product)}
                                        >
                                            <FaInfoCircle className="me-2" />
                                            Detalles
                                        </Button>
                                        {isAuthenticated && (
                                            <Button
                                                variant="success"
                                                className="w-100 fw-bold d-flex align-items-center justify-content-center"
                                                onClick={() => handleAddToCartClick(product.id, 1, product.name)}
                                                disabled={product.stock === 0 || product.status !== 'Available'}
                                            >
                                                <FaShoppingCart className="me-2" />
                                                {product.stock > 0 && product.status === 'Available' ? 'Añadir al Carrito' : 'Agotado'}
                                            </Button>
                                        )}
                                    </div>
                                </Card.Body>
                            </Card>
                        </Col>
                    );
                })}
            </Row>

            {/* --- CONTROLES DE PAGINACIÓN --- */}
            {!loading && !error && products.length > 0 && (
                <Row className="mt-5 mb-3 justify-content-center">
                    <Col xs="auto">
                        <Pagination className="shadow-sm">
                            {renderPaginationItems()}
                        </Pagination>
                    </Col>
                </Row>
            )}
            {/* --- FIN CONTROLES DE PAGINACIÓN --- */}

            {/* Modal del Carrito */}
            <Modal show={showCartModal} onHide={handleCloseCart} size="lg" centered>
                <Modal.Header closeButton className="bg-primary text-white">
                    <Modal.Title><FaShoppingCart className="me-2" />Tu Carrito de Compras</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    {cartLoading && (
                        <div className="text-center my-3">
                            <Spinner animation="border" size="sm" variant="primary" /> Cargando carrito...
                        </div>
                    )}
                    {cartError && <Alert variant="danger" className="text-center">{cartError}</Alert>}

                    {!cartLoading && !cartError && (!userCart || userCart.items.length === 0) ? (
                        <Alert variant="info" className="text-center border-0 bg-light text-muted">
                            <FaShoppingCart className="me-2" size={20} />
                            Tu carrito está vacío. ¡Explora nuestros productos y añade algo!
                        </Alert>
                    ) : (
                        <Table striped hover responsive className="text-center align-middle rounded-3 overflow-hidden">
                            <thead className="bg-light text-dark">
                                <tr>
                                    <th>Producto</th>
                                    <th>Precio Unitario</th>
                                    <th>Cantidad</th>
                                    <th>Subtotal</th>
                                    <th>Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {userCart && userCart.items.map(item => (
                                    <tr key={item.id}>
                                        <td>
                                            <div className="d-flex align-items-center justify-content-start">
                                                <img
                                                    src={item.product.imageUrl ? `${API_BASE_IMAGE_URL}${item.product.imageUrl}` : 'https://via.placeholder.com/60x60?text=No+Image'}
                                                    alt={item.product.name}
                                                    style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', marginRight: '15px' }}
                                                    className="shadow-sm"
                                                />
                                                <span className="fw-bold">{item.product.name}</span>
                                            </div>
                                        </td>
                                        <td className="text-muted">${parseFloat(item.price).toFixed(2)}</td>
                                        <td>
                                            <div className="d-flex justify-content-center align-items-center">
                                                <Button
                                                    variant="outline-secondary"
                                                    size="sm"
                                                    onClick={() => handleUpdateCartItemQuantityClick(item.id, item.quantity, 'decrease', item.productId, item.product.name)}
                                                    disabled={item.quantity <= 1}
                                                    className="rounded-circle d-flex align-items-center justify-content-center"
                                                    style={{ width: '30px', height: '30px' }}
                                                >
                                                    <FaMinus size={12} />
                                                </Button>
                                                <span className="mx-2 fw-bold">{item.quantity}</span>
                                                <Button
                                                    variant="outline-secondary"
                                                    size="sm"
                                                    onClick={() => handleUpdateCartItemQuantityClick(item.id, item.quantity, 'increase', item.productId, item.product.name)}
                                                    className="rounded-circle d-flex align-items-center justify-content-center"
                                                    style={{ width: '30px', height: '30px' }}
                                                >
                                                    <FaPlus size={12} />
                                                </Button>
                                            </div>
                                        </td>
                                        <td className="fw-bold text-success">${(item.quantity * item.price).toFixed(2)}</td>
                                        <td>
                                            <Button variant="danger" size="sm" onClick={() => handleRemoveCartItemClick(item.id, item.product.name)} className="d-flex align-items-center mx-auto">
                                                <FaTrashAlt className="me-1" />
                                                Eliminar
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    )}
                </Modal.Body>
                <Modal.Footer className="justify-content-between border-top p-3 bg-light">
                    <div className="fw-bold fs-4 text-primary">Total: ${calculateCartTotal()}</div>
                    <div>
                        <Button variant="outline-warning" className="me-2 shadow-sm" onClick={handleClearCartClick} disabled={!userCart || userCart.items.length === 0}>
                            <FaTrashAlt className="me-2" />
                            Vaciar Carrito
                        </Button>
                        <Button variant="outline-secondary" className="me-2 shadow-sm" onClick={handleCloseCart}>
                            Seguir Comprando
                        </Button>
                        <Button variant="success" className="ms-1 shadow-sm" disabled={!userCart || userCart.items.length === 0}
                            onClick={() => {
                                closeCartModal();
                                navigate('/checkout');
                            }}
                        >
                            <FaShoppingCart className="me-2" />
                            Proceder al Pago
                        </Button>
                    </div>
                </Modal.Footer>
            </Modal>

            {/* Modal de Detalles del Producto */}
            <Modal show={showProductDetailModal} onHide={() => setShowProductDetailModal(false)} size="lg" centered>
                <Modal.Header closeButton className="bg-primary text-white">
                    <Modal.Title><FaInfoCircle className="me-2" />{selectedProduct?.name || 'Detalles del Producto'}</Modal.Title>
                </Modal.Header>
                <Modal.Body className="p-4">
                    {selectedProduct ? (
                        <Row>
                            <Col md={6} className="text-center mb-4 mb-md-0">
                                <img
                                    src={selectedProduct.imageUrl ? `${API_BASE_IMAGE_URL}${selectedProduct.imageUrl}` : 'https://via.placeholder.com/500x400?text=No+Image'}
                                    alt={selectedProduct.name}
                                    className="img-fluid rounded shadow-lg product-detail-img"
                                />
                            </Col>
                            <Col md={6}>
                                <h3 className="fw-bold text-dark mb-3">{selectedProduct.name}</h3>
                                <p className="text-muted mb-2"><b>Categoría:</b> {selectedProduct.category || 'Sin categoría'}</p>
                                <p className="text-secondary mb-4 description-text">{selectedProduct.description || 'No hay descripción disponible para este producto.'}</p>
                                {selectedProduct.isOnSale && selectedProduct.discountPercentage != null && new Date(selectedProduct.saleEndDate) > new Date() ? (
                                    <>
                                        <p className="fs-6 text-muted text-decoration-line-through mb-0">
                                            Precio Original: ${parseFloat(selectedProduct.price).toFixed(2)}
                                        </p>
                                        <p className="fs-3 fw-bold text-danger mb-3">
                                            Precio Oferta: ${getFinalPrice(selectedProduct)}
                                            <span className="ms-2 badge bg-danger-subtle text-danger">{selectedProduct.discountPercentage}% OFF</span>
                                        </p>
                                        <p className="text-primary small mb-3">
                                            Oferta válida hasta: {selectedProduct.saleEndDate ? new Date(selectedProduct.saleEndDate).toLocaleDateString() : 'Fecha no definida'}
                                        </p>
                                    </>
                                ) : (
                                    <p className="fs-3 fw-bold text-success mb-3">${parseFloat(selectedProduct.price).toFixed(2)}</p>
                                )}
                                <p className="mb-4">
                                    <b className="me-1">Stock:</b>
                                    <span className={selectedProduct.stock > 0 ? 'text-success fw-bold' : 'text-danger fw-bold'}>
                                        {selectedProduct.stock > 0 ? `${selectedProduct.stock} unidades` : 'Agotado'}
                                    </span>
                                </p>

                                {isAuthenticated && (
                                    <Button
                                        variant="success"
                                        className="w-100 py-2 fw-bold d-flex align-items-center justify-content-center"
                                        onClick={() => handleAddToCartClick(selectedProduct.id, 1, selectedProduct.name)}
                                        disabled={selectedProduct.stock === 0 || selectedProduct.status !== 'Available'}
                                    >
                                        <FaShoppingCart className="me-2" />
                                        {selectedProduct.stock > 0 && selectedProduct.status === 'Available' ? 'Añadir al Carrito' : 'Agotado / No Disponible'}
                                    </Button>
                                )}
                                {!isAuthenticated && (
                                    <Alert variant="info" className="mt-3 text-center border-0 bg-light">
                                        Inicia sesión para añadir este producto al carrito.
                                    </Alert>
                                )}
                            </Col>
                        </Row>
                    ) : (
                        <Alert variant="warning" className="text-center">No se ha seleccionado ningún producto para mostrar detalles.</Alert>
                    )}
                </Modal.Body>
                <Modal.Footer className="border-top p-3 bg-light">
                    <Button variant="secondary" onClick={() => setShowProductDetailModal(false)}>
                        Cerrar
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
}

export default ProductosPage;