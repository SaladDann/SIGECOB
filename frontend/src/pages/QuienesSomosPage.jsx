// frontend/src/pages/QuienesSomosPage.jsx
import { Container, Row, Col, Image, Button } from 'react-bootstrap';
import { FaUsers, FaLightbulb, FaAward, FaArrowRight } from 'react-icons/fa'; // Iconos para valores y CTA

// Importa una imagen relevante para la sección "Quiénes Somos"
// Podría ser una imagen de oficina moderna, un equipo trabajando, o un concepto tecnológico limpio.
import teamImage from '../assets/images/team.jpg'; // Asegúrate de tener esta imagen en tu carpeta

function QuienesSomosPage() {
    return (
        <Container fluid className="py-5 bg-light min-vh-100">
            {/* --- Sección de Cabecera: Título y Slogan --- */}
            <Row className="justify-content-center text-center mb-5 pb-4">
                <Col md={10} lg={8}>
                    <h1 className="display-4 fw-bold text-dark mb-3">
                        Acerca de SIGECOB
                    </h1>
                    <p className="lead text-muted mx-auto" style={{ maxWidth: '700px' }}>
                        Transformando el futuro con tecnología de vanguardia y un servicio excepcional.
                    </p>
                </Col>
            </Row>

            {/* --- Sección de Imagen y Introducción --- */}
            <Row className="justify-content-center align-items-center mb-5 pb-4">
                <Col md={6} lg={5} className="mb-4 mb-md-0">
                    <Image
                        src={teamImage} // Usa la imagen importada
                        alt="Equipo de SIGECOB trabajando"
                        fluid
                        rounded
                        className="shadow-lg transform-on-hover" // Clases para un estilo más pulido
                    />
                </Col>
                <Col md={6} lg={5}>
                    <h2 className="display-6 fw-bold text-primary mb-4">Nuestra Historia</h2>
                    <p className="text-secondary fs-5 mb-4">
                        En **SIGECOB**, somos más que un distribuidor de equipos electrónicos; somos apasionados por la innovación y el impacto positivo que la tecnología puede tener en la vida de las personas y empresas.
                    </p>
                    <p className="text-muted mb-4">
                        Desde nuestros inicios, nos hemos dedicado a la búsqueda y provisión de soluciones tecnológicas que no solo cumplen, sino que superan las expectativas de rendimiento y fiabilidad. Nos enorgullece ser un puente entre la vanguardia tecnológica y las necesidades de nuestros clientes.
                    </p>
                    <Button variant="outline-dark" href="/productos" className="px-4 py-2 rounded-pill fw-bold">
                        Explorar Productos <FaArrowRight className="ms-2" />
                    </Button>
                </Col>
            </Row>

            {/* --- Sección de Nuestros Valores --- */}
            <Row className="justify-content-center text-center my-5 py-5 bg-white shadow-sm rounded-lg">
                <Col md={10} lg={8}>
                    <h2 className="display-6 fw-bold text-dark mb-5">Nuestros Valores Fundamentales</h2>
                    <Row className="g-4">
                        <Col md={4}>
                            <div className="p-4">
                                <FaLightbulb className="text-primary mb-3" style={{ fontSize: '3rem' }} />
                                <h3 className="h4 fw-bold mb-2">Innovación Constante</h3>
                                <p className="text-muted">
                                    Estamos siempre a la vanguardia, buscando las últimas tecnologías para ofrecerte lo mejor.
                                </p>
                            </div>
                        </Col>
                        <Col md={4}>
                            <div className="p-4">
                                <FaUsers className="text-info mb-3" style={{ fontSize: '3rem' }} />
                                <h3 className="h4 fw-bold mb-2">Compromiso con el Cliente</h3>
                                <p className="text-muted">
                                    Tu satisfacción es nuestra prioridad. Brindamos asesoramiento y soporte personalizado.
                                </p>
                            </div>
                        </Col>
                        <Col md={4}>
                            <div className="p-4">
                                <FaAward className="text-success mb-3" style={{ fontSize: '3rem' }} />
                                <h3 className="h4 fw-bold mb-2">Excelencia y Calidad</h3>
                                <p className="text-muted">
                                    Seleccionamos solo productos de la más alta calidad y confiabilidad para tu tranquilidad.
                                </p>
                            </div>
                        </Col>
                    </Row>
                </Col>
            </Row>

            {/* --- Sección de Llamada a la Acción Final --- */}
            <Row className="justify-content-center text-center my-5 py-5 bg-dark text-white rounded-lg shadow-lg">
                <Col md={10} lg={8}>
                    <h2 className="display-6 fw-bold mb-4">Únete a la Familia SIGECOB</h2>
                    <p className="lead text-white-75 mb-5 mx-auto" style={{ maxWidth: '700px' }}>
                        Descubre la diferencia de una experiencia tecnológica pensada para ti. Estamos aquí para acompañarte en cada paso.
                    </p>
                    <Button variant="light" href="/contacto" className="px-5 py-3 rounded-pill fw-bold fs-5">
                        Contáctanos Hoy <FaArrowRight className="ms-3" />
                    </Button>
                </Col>
            </Row>

        </Container>
    );
}

export default QuienesSomosPage;