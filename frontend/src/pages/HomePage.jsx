// frontend/src/pages/HomePage.jsx
import React, { useState, useEffect } from 'react';
import Carousel from 'react-bootstrap/Carousel';
import Container from 'react-bootstrap/Container';
import Row from 'react-bootstrap/Row';
import Col from 'react-bootstrap/Col';
import Card from 'react-bootstrap/Card';
import Button from 'react-bootstrap/Button';
import Spinner from 'react-bootstrap/Spinner';
import Alert from 'react-bootstrap/Alert';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { FaArrowRight, FaHeadset, FaSignInAlt, FaStore, FaQuestionCircle } from 'react-icons/fa'; // Iconos para llamadas a la acción

// Importa tus imágenes para el carrusel (asegúrate de que sean de alta calidad y minimalistas si es posible)
import banner1 from '../assets/images/banner1.jpg'; // Ejemplo de imagen con diseño limpio
import banner2 from '../assets/images/banner2.jpg';
import banner3 from '../assets/images/banner3.jpg';

function HomePage() {
    const [featuredProducts, setFeaturedProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const navigate = useNavigate();

    const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;
    const API_BASE_IMAGE_URL = API_BASE_URL.replace('/api', '');
    const API_URL_PRODUCTS = `${API_BASE_URL}/products`;

    useEffect(() => {
        const fetchAndSetFeaturedProducts = async () => {
            setLoading(true);
            setError(null);
            try {
                const response = await axios.get(API_URL_PRODUCTS);
                const allProducts = response.data.products.filter(p => p.status === 'Available');

                const lastSelectionDate = localStorage.getItem('featuredProductsDate');
                let selectedFeaturedIds = JSON.parse(localStorage.getItem('featuredProductsIds')) || [];

                const today = new Date();
                const startOfWeek = new Date(today);
                startOfWeek.setDate(today.getDate() - today.getDay() + (today.getDay() === 0 ? -6 : 1));
                startOfWeek.setHours(0, 0, 0, 0);

                let shouldUpdate = false;
                if (!lastSelectionDate) {
                    shouldUpdate = true;
                } else {
                    const storedDate = new Date(lastSelectionDate);
                    if (storedDate < startOfWeek) {
                        shouldUpdate = true;
                    }
                }

                if (shouldUpdate || selectedFeaturedIds.length === 0) {
                    const shuffled = allProducts.sort(() => 0.5 - Math.random());
                    const newFeatured = shuffled.slice(0, 3);
                    setFeaturedProducts(newFeatured);
                    localStorage.setItem('featuredProductsDate', today.toISOString());
                    localStorage.setItem('featuredProductsIds', JSON.stringify(newFeatured.map(p => p.id)));
                } else {
                    const storedFeatured = allProducts.filter(p => selectedFeaturedIds.includes(p.id));
                    if (storedFeatured.length > 0) {
                        setFeaturedProducts(storedFeatured);
                    } else {
                        const shuffled = allProducts.sort(() => 0.5 - Math.random());
                        const newFeatured = shuffled.slice(0, 3);
                        setFeaturedProducts(newFeatured);
                        localStorage.setItem('featuredProductsDate', today.toISOString());
                        localStorage.setItem('featuredProductsIds', JSON.stringify(newFeatured.map(p => p.id)));
                    }
                }

            } catch (err) {
                console.error('Error al obtener productos destacados:', err.response?.data || err.message);
                setError('No se pudieron cargar los productos destacados. Por favor, intenta de nuevo más tarde.');
            } finally {
                setLoading(false);
            }
        };

        fetchAndSetFeaturedProducts();
    }, []);

    const handleViewDetails = (productId) => {
        // Podrías redirigir a una ruta de detalle de producto específica si la tuvieras, por ejemplo:
        // navigate(`/product/${productId}`);
        // Para esta configuración, simplemente navegar a la página de productos.
        navigate(`/productos`);
        // O si quieres abrir el modal en la página de productos directamente con un ID, necesitarías más lógica con un Context o similar.
    };

    return (
        <Container fluid className="py-5 bg-white">
            {/* --- Sección Principal / Carrusel Minimalista --- */}
            <Carousel interval={3000} className="mb-5 shadow-sm rounded-lg overflow-hidden">
                <Carousel.Item>
                    <img className="d-block w-100" src={banner1} alt="Innovación en Tecnología" style={{ maxHeight: '500px', objectFit: 'cover' }} />
                    <Carousel.Caption className="text-start bg-dark bg-opacity-50 p-3 p-md-4 rounded">
                        <h3 className="display-5 fw-bold text-white mb-2">Diseño y Rendimiento</h3>
                        <p className="lead text-white-75 mb-3 d-none d-sm-block">Descubre la perfecta armonía entre estética y potencia en nuestros productos.</p>
                        <Button variant="outline-light" href="/productos" className="px-4 py-2 fw-bold">
                            Explorar Productos <FaArrowRight className="ms-2" />
                        </Button>
                    </Carousel.Caption>
                </Carousel.Item>
                <Carousel.Item>
                    <img className="d-block w-100" src={banner2} alt="Accesorios Esenciales" style={{ maxHeight: '500px', objectFit: 'cover' }} />
                    <Carousel.Caption className="text-start bg-dark bg-opacity-50 p-3 p-md-4 rounded">
                        <h3 className="display-5 fw-bold text-white mb-2">Accesorios que Marcan la Diferencia</h3>
                        <p className="lead text-white-75 mb-3 d-none d-sm-block">Complements perfectos para tu vida digital. Ergonomía y eficiencia.</p>
                        <Button variant="outline-light" href="/productos/accesorios" className="px-4 py-2 fw-bold">
                            Ver Accesorios <FaArrowRight className="ms-2" />
                        </Button>
                    </Carousel.Caption>
                </Carousel.Item>
                <Carousel.Item>
                    <img className="d-block w-100" src={banner3} alt="Ofertas Exclusivas" style={{ maxHeight: '500px', objectFit: 'cover' }} />
                    <Carousel.Caption className="text-start bg-dark bg-opacity-50 p-3 p-md-4 rounded">
                        <h3 className="display-5 fw-bold text-white mb-2">Ofertas Semanales</h3>
                        <p className="lead text-white-75 mb-3 d-none d-sm-block">Aprovecha descuentos únicos en productos seleccionados.</p>
                        <Button variant="outline-light" href="/ofertas" className="px-4 py-2 fw-bold">
                            Descubrir Ofertas <FaArrowRight className="ms-2" />
                        </Button>
                    </Carousel.Caption>
                </Carousel.Item>
            </Carousel>

            ---

            {/* --- Sección de Productos Destacados --- */}
            <h2 className="text-center mb-5 display-6 fw-bold text-dark">Productos Destacados de la Semana</h2>
            {loading && (
                <div className="text-center my-5">
                    <Spinner animation="border" role="status" variant="primary" className="mb-3">
                        <span className="visually-hidden">Cargando productos destacados...</span>
                    </Spinner>
                    <p className="lead text-muted">Buscando productos que te encantarán...</p>
                </div>
            )}

            {error && (
                <Alert variant="danger" className="text-center my-4 shadow-sm">
                    {error}
                </Alert>
            )}

            {!loading && !error && featuredProducts.length === 0 && (
                <Alert variant="info" className="text-center my-4 shadow-sm">
                    No se encontraron productos destacados en este momento. ¡Vuelve pronto!
                </Alert>
            )}

            {!loading && !error && featuredProducts.length > 0 && (
                <Row className="justify-content-center g-4 mb-5">
                    {featuredProducts.map(product => (
                        <Col key={product.id} xs={12} sm={6} md={4}> {/* Columnas ajustadas para mejor responsividad */}
                            <Card className="shadow-lg h-100 border-0 rounded-lg transform-on-hover transition-all-300">
                                <Card.Img
                                    variant="top"
                                    src={product.imageUrl ? `${API_BASE_IMAGE_URL}${product.imageUrl}` : 'https://via.placeholder.com/400x250?text=Imagen+No+Disponible'}
                                    alt={product.name}
                                    style={{ height: '220px', objectFit: 'cover', cursor: 'pointer' }}
                                    onClick={() => handleViewDetails(product.id)}
                                    className="border-bottom"
                                />
                                <Card.Body className="d-flex flex-column p-4">
                                    <Card.Title className="fw-bold mb-2 text-dark text-truncate" title={product.name}>
                                        {product.name}
                                    </Card.Title>
                                    <Card.Text className="text-muted small mb-3">
                                        Categoría: {product.category || 'General'}
                                    </Card.Text>
                                    <Card.Text className="fw-bold fs-4 text-primary mt-auto">
                                        ${parseFloat(product.price).toFixed(2)}
                                    </Card.Text>
                                    <Button
                                        variant="outline-dark" // Botón de "Ver Detalles" más sutil
                                        className="mt-3 w-100 fw-bold rounded-pill border-2"
                                        onClick={() => handleViewDetails(product.id)}
                                    >
                                        Ver Detalles
                                    </Button>
                                </Card.Body>
                            </Card>
                        </Col>
                    ))}
                </Row>
            )}

            ---

            {/* --- Sección "Acerca de Nosotros" - Diseño Limpio --- */}
            <Row className="my-5 py-5 text-center bg-light rounded-lg shadow-sm">
                <Col>
                    <h2 className="mb-4 display-6 fw-bold text-dark">La Filosofía SIGECOB</h2>
                    <p className="lead text-muted mx-auto" style={{ maxWidth: '800px' }}>
                        En **SIGECOB**, creemos en la simplicidad, la funcionalidad y la durabilidad. Nos dedicamos a seleccionar productos tecnológicos que no solo cumplen su propósito a la perfección, sino que también se integran armoniosamente en tu vida, sin elementos superfluos.
                    </p>
                    <p className="text-secondary mt-3 mx-auto" style={{ maxWidth: '700px' }}>
                        Nuestra misión es ofrecerte soluciones tecnológicas confiables y estéticamente agradables, priorizando la experiencia del usuario y la sostenibilidad. Explora nuestro catálogo y descubre la diferencia de un diseño bien pensado.
                    </p>
                    <Button variant="dark" href="/quienes-somos" className="mt-4 px-4 py-2 rounded-pill fw-bold">
                        Conoce Nuestra Historia <FaStore className="ms-2" />
                    </Button>
                </Col>
            </Row>

            ---

            {/* --- Sección de Llamadas a la Acción - Dividida y Clara --- */}
            <Row className="my-5 g-4">
                <Col md={6}>
                    <Card className="text-center p-4 h-100 bg-primary text-white border-0 shadow-lg rounded-lg transition-all-300 hover-lift">
                        <Card.Body className="d-flex flex-column justify-content-center align-items-center">
                            <FaHeadset className="mb-3" style={{ fontSize: '3rem' }} />
                            <h3 className="fw-bold mb-3">¿Necesitas Ayuda?</h3>
                            <p className="lead text-white-75 mb-4">
                                Nuestro equipo de soporte está listo para asistirte en cualquier consulta.
                            </p>
                            <Button variant="light" href="/contacto" className="px-4 py-2 rounded-pill fw-bold">
                                Contactar Soporte <FaArrowRight className="ms-2" />
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>
                <Col md={6}>
                    <Card className="text-center p-4 h-100 bg-info text-white border-0 shadow-lg rounded-lg transition-all-300 hover-lift">
                        <Card.Body className="d-flex flex-column justify-content-center align-items-center">
                            <FaSignInAlt className="mb-3" style={{ fontSize: '3rem' }} />
                            <h3 className="fw-bold mb-3">Acceso Clientes</h3>
                            <p className="lead text-white-75 mb-4">
                                Inicia sesión para gestionar tus pedidos y acceder a beneficios exclusivos.
                            </p>
                            <Button variant="light" href="/login" className="px-4 py-2 rounded-pill fw-bold">
                                Iniciar Sesión <FaArrowRight className="ms-2" />
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>

            {/* --- Sección de Preguntas Frecuentes (Opcional) --- */}
            <Row className="my-5 py-5 text-center bg-light rounded-lg shadow-sm">
                <Col>
                    <h2 className="mb-4 display-6 fw-bold text-dark">Preguntas Frecuentes</h2>
                    <p className="lead text-muted mx-auto" style={{ maxWidth: '800px' }}>
                        Encuentra respuestas rápidas a las dudas más comunes sobre nuestros productos y servicios.
                    </p>
                    <Button variant="outline-dark" href="/preguntas-frecuentes" className="mt-4 px-4 py-2 rounded-pill fw-bold">
                        Ver FAQs <FaQuestionCircle className="ms-2" />
                    </Button>
                </Col>
            </Row>

        </Container>
    );
}

export default HomePage;