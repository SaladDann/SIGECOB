// src/pages/ContactPage.jsx
import React, { useState } from 'react';
import { Container, Row, Col, Form, Button, Card, Spinner } from 'react-bootstrap'; // Importamos Spinner para el botón de carga
import { toast } from 'react-toastify';
import api from '../services/api'; // Asegúrate de que este sea tu archivo de configuración de Axios
import { FaWhatsapp, FaFacebook, FaTwitter, FaInstagram, FaLinkedin, FaMapMarkerAlt, FaEnvelope, FaPhone, FaPaperPlane } from 'react-icons/fa'; // FaPaperPlane para el botón de enviar

function ContactPage() {
    const [formData, setFormData] = useState({
        fullName: '',
        email: '',
        message: ''
    });
    const [loading, setLoading] = useState(false);

    // Configuración del negocio (ajusta estos valores)
    const businessConfig = {
        whatsappNumber: import.meta.env.VITE_CONTACT_NUMBER, // Número de WhatsApp incluyendo el código de país (Ej: +593999999999)
        businessEmail: import.meta.env.VITE_CORREO_INFO, // Correo electrónico de contacto
        businessPhone: import.meta.env.VITE_CONTACT_NUMBER,     // Número de teléfono de contacto
        businessAddress: import.meta.env.VITE_BUSINESS_ADDRESS, // Dirección del negocio
        socialMedia: {
            facebook: import.meta.env.VITE_FACEBOOK_URL,
            twitter: import.meta.env.VITE_TWITTER_URL,
            instagram: import.meta.env.VITE_INSTAGRAM_URL,
            linkedin: import.meta.env.VITE_LINKEDIN_URL || '', // Añade URL para LinkedIn si lo tienes
        }
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleFormSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        try {
            // Envía los datos del formulario a tu backend
            // Asegúrate de que el endpoint /support/contact esté configurado en tu backend
            const response = await api.post('/support/contact', formData);
            toast.success(response.data.message || '¡Mensaje enviado! Nos pondremos en contacto contigo pronto.', {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
            setFormData({ fullName: '', email: '', message: '' }); // Limpiar formulario
        } catch (error) {
            console.error('Error al enviar el mensaje de contacto:', error.response?.data || error.message);
            toast.error(error.response?.data?.message || 'Hubo un error al enviar tu mensaje. Por favor, inténtalo de nuevo.', {
                position: "top-right",
                autoClose: 5000,
                hideProgressBar: false,
                closeOnClick: true,
                pauseOnHover: true,
                draggable: true,
                progress: undefined,
            });
        } finally {
            setLoading(false);
        }
    };

    const handleWhatsAppClick = () => {
        const message = `Hola, me gustaría más información sobre SIGECOB. Mi nombre es ${formData.fullName || '...'}.`;
        const whatsappUrl = `https://wa.me/${businessConfig.whatsappNumber.replace(/\+/g, '')}?text=${encodeURIComponent(message)}`;
        window.open(whatsappUrl, '_blank');
    };

    return (
        <Container fluid className="py-5 bg-light min-vh-100">
            {/* --- Cabecera de la Página de Contacto --- */}
            <Row className="justify-content-center text-center mb-5 pb-4">
                <Col md={10} lg={8}>
                    <h1 className="display-4 fw-bold text-dark mb-3">
                        Hablemos
                    </h1>
                    <p className="lead text-muted mx-auto" style={{ maxWidth: '700px' }}>
                        Estamos aquí para escucharte y ayudarte. Elige la forma que mejor se adapte a ti.
                    </p>
                </Col>
            </Row>

            {/* --- Contenido Principal: Formulario y Contacto Directo --- */}
            <Row className="justify-content-center g-5"> {/* Aumentado el gap para más espacio */}
                {/* Columna de Información de Contacto */}
                <Col md={5} className="mb-4">
                    <Card className="h-100 shadow-lg border-0 rounded-lg p-4"> {/* Card más prominente */}
                        <Card.Body>
                            <h3 className="mb-4 fw-bold text-primary">Información Directa</h3>
                            <ul className="list-unstyled contact-info-list mb-5">
                                <li className="mb-4 d-flex align-items-start"> {/* Alineación con start para textos largos */}
                                    <FaMapMarkerAlt className="me-3 text-muted flex-shrink-0" size={24} /> {/* Icono más grande */}
                                    <span className="text-secondary">{businessConfig.businessAddress}</span>
                                </li>
                                <li className="mb-4 d-flex align-items-start">
                                    <FaEnvelope className="me-3 text-muted flex-shrink-0" size={24} />
                                    <a href={`mailto:${businessConfig.businessEmail}`} className="text-decoration-none text-secondary">
                                        {businessConfig.businessEmail}
                                    </a>
                                </li>
                                <li className="mb-4 d-flex align-items-start">
                                    <FaPhone className="me-3 text-muted flex-shrink-0" size={24} />
                                    <a href={`tel:${businessConfig.businessPhone}`} className="text-decoration-none text-secondary">
                                        {businessConfig.businessPhone}
                                    </a>
                                </li>
                            </ul>

                            <h4 className="mt-5 mb-4 fw-bold text-primary">Conéctate con Nosotros</h4>
                            <div className="d-flex justify-content-start social-icons">
                                {businessConfig.socialMedia.facebook && (
                                    <a href={businessConfig.socialMedia.facebook} target="_blank" rel="noopener noreferrer" className="me-3 text-primary social-icon-link">
                                        <FaFacebook size={36} /> {/* Iconos más grandes para redes sociales */}
                                    </a>
                                )}
                                {businessConfig.socialMedia.twitter && (
                                    <a href={businessConfig.socialMedia.twitter} target="_blank" rel="noopener noreferrer" className="me-3 text-info social-icon-link">
                                        <FaTwitter size={36} />
                                    </a>
                                )}
                                {businessConfig.socialMedia.instagram && (
                                    <a href={businessConfig.socialMedia.instagram} target="_blank" rel="noopener noreferrer" className="me-3 text-danger social-icon-link">
                                        <FaInstagram size={36} />
                                    </a>
                                )}
                                {businessConfig.socialMedia.linkedin && (
                                    <a href={businessConfig.socialMedia.linkedin} target="_blank" rel="noopener noreferrer" className="me-3 text-secondary social-icon-link">
                                        <FaLinkedin size={36} />
                                    </a>
                                )}
                            </div>

                            <h4 className="mt-5 mb-4 fw-bold text-primary">Asistencia Rápida</h4>
                            <Button
                                variant="success"
                                className="w-100 py-3 d-flex align-items-center justify-content-center fw-bold rounded-pill shadow-sm hover-lift"
                                onClick={handleWhatsAppClick}
                            >
                                <FaWhatsapp className="me-2" size={24} />
                                Chatear por WhatsApp
                            </Button>
                        </Card.Body>
                    </Card>
                </Col>

                {/* Columna del Formulario de Contacto */}
                <Col md={7} className="mb-4">
                    <Card className="h-100 shadow-lg border-0 rounded-lg p-4"> {/* Card más prominente */}
                        <Card.Body>
                            <h3 className="mb-4 fw-bold text-primary">Envíanos un Mensaje Directo</h3>
                            <Form onSubmit={handleFormSubmit}>
                                <Form.Group className="mb-4" controlId="formFullName"> {/* Más margen inferior */}
                                    <Form.Label className="fw-semibold">Nombre Completo</Form.Label>
                                    <Form.Control
                                        type="text"
                                        name="fullName"
                                        value={formData.fullName}
                                        onChange={handleInputChange}
                                        placeholder="Tu nombre y apellido"
                                        required
                                        className="py-2" // Más padding vertical
                                    />
                                </Form.Group>

                                <Form.Group className="mb-4" controlId="formEmail">
                                    <Form.Label className="fw-semibold">Correo Electrónico</Form.Label>
                                    <Form.Control
                                        type="email"
                                        name="email"
                                        value={formData.email}
                                        onChange={handleInputChange}
                                        placeholder="nombre@ejemplo.com"
                                        required
                                        className="py-2"
                                    />
                                    <Form.Text className="text-muted">
                                        Nunca compartiremos tu correo electrónico.
                                    </Form.Text>
                                </Form.Group>

                                <Form.Group className="mb-4" controlId="formMessage">
                                    <Form.Label className="fw-semibold">Tu Mensaje</Form.Label>
                                    <Form.Control
                                        as="textarea"
                                        name="message"
                                        rows={6} // Más filas para un mensaje más largo
                                        value={formData.message}
                                        onChange={handleInputChange}
                                        placeholder="Cuéntanos cómo podemos ayudarte..."
                                        required
                                        className="py-2"
                                    />
                                </Form.Group>

                                <Button
                                    variant="dark" // Un color más sobrio y profesional para el botón de envío
                                    type="submit"
                                    className="w-100 py-3 fw-bold rounded-pill shadow-sm mt-3 hover-lift" // Botón grande y redondeado
                                    disabled={loading}
                                >
                                    {loading ? (
                                        <>
                                            <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                                            Enviando...
                                        </>
                                    ) : (
                                        <>
                                            <FaPaperPlane className="me-2" />
                                            Enviar Mensaje
                                        </>
                                    )}
                                </Button>
                            </Form>
                        </Card.Body>
                    </Card>
                </Col>
            </Row>
        </Container>
    );
}

export default ContactPage;