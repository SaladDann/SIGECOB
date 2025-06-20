import React, { useState, useEffect } from 'react';
import { Container, Row, Col, Card, Form, Button, Tabs, Tab, Alert, InputGroup, Spinner } from 'react-bootstrap'; // Importamos Spinner
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';
import { EyeFill, EyeSlashFill } from 'react-bootstrap-icons'; // Asegúrate de tener instalado react-bootstrap-icons

function LoginPage() {
    const [key, setKey] = useState('login');

    // Estados para los campos del formulario de Login
    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [showLoginPassword, setShowLoginPassword] = useState(false);

    // Estados para los campos del formulario de Registro
    const [registerName, setRegisterName] = useState('');
    const [registerEmail, setRegisterEmail] = useState('');
    const [registerPassword, setRegisterPassword] = useState('');
    const [registerConfirmPassword, setRegisterConfirmPassword] = useState('');
    const [registerAddress, setRegisterAddress] = useState('');
    const [showRegisterPassword, setShowRegisterPassword] = useState(false);
    const [showConfirmPassword, setShowConfirmPassword] = useState(false);

    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [formLoading, setFormLoading] = useState(false); // Estado para el loading de los formularios individuales

    const { login, register, isAuthenticated, loading: authContextLoading } = useAuth();
    const navigate = useNavigate();

    // Redirige si el usuario ya está autenticado o al finalizar el registro/login
    useEffect(() => {
        if (!authContextLoading && isAuthenticated) {
            navigate('/');
        }
    }, [isAuthenticated, navigate, authContextLoading]);

    // Manejador para el envío del formulario de Login
    const handleLoginSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!loginEmail || !loginPassword) {
            setError('Por favor, ingresa tu correo electrónico/usuario y contraseña.');
            return;
        }

        setFormLoading(true);
        const result = await login(loginEmail, loginPassword);

        if (!result.success) {
            setError(result.error || 'Error al iniciar sesión. Inténtalo de nuevo.');
        } else {
            setSuccess('¡Inicio de sesión exitoso! Redirigiendo...');
            // No es necesario redirigir aquí, el useEffect lo manejará
        }
        setFormLoading(false);
    };

    // Manejador para el envío del formulario de Registro
    const handleRegisterSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (!registerName || !registerEmail || !registerPassword || !registerConfirmPassword || !registerAddress) {
            setError('Por favor, completa todos los campos obligatorios para registrarte.');
            return;
        }
        if (registerPassword !== registerConfirmPassword) {
            setError('Las contraseñas no coinciden.');
            return;
        }
        if (registerPassword.length < 6) {
            setError('La contraseña debe tener al menos 6 caracteres.');
            return;
        }

        setFormLoading(true);
        const result = await register(registerName, registerEmail, registerPassword, registerAddress);

        if (!result.success) {
            setError(result.error || 'Error al registrarte. Por favor, verifica tus datos e inténtalo de nuevo.');
        } else {
            setSuccess('¡Registro exitoso! Tu cuenta ha sido creada. Ahora puedes iniciar sesión.');
            // Limpiar formulario de registro
            setRegisterName('');
            setRegisterEmail('');
            setRegisterPassword('');
            setRegisterConfirmPassword('');
            setRegisterAddress('');
            setShowRegisterPassword(false);
            setShowConfirmPassword(false);
            // Opcional: Cambiar a la pestaña de login después de un registro exitoso
            setKey('login');
        }
        setFormLoading(false);
    };

    // Muestra un mensaje de carga inicial del contexto de autenticación
    if (authContextLoading) {
        return (
            <Container fluid className="d-flex justify-content-center align-items-center bg-light" style={{ minHeight: '100vh' }}>
                <Spinner animation="border" role="status" variant="primary">
                    <span className="visually-hidden">Cargando sesión...</span>
                </Spinner>
                <p className="ms-3 text-muted">Cargando sesión de usuario...</p>
            </Container>
        );
    }

    // Si ya está autenticado, no renderiza nada (el useEffect redirigirá)
    if (isAuthenticated) {
        return null;
    }

    return (
        <Container fluid className="d-flex justify-content-center align-items-center bg-light" style={{ minHeight: '100vh' }}>
            <Col xs={12} sm={10} md={8} lg={6} xl={5} className="my-5"> {/* Mayor control de ancho en diferentes pantallas */}
                <Card className="shadow-lg border-0 rounded-lg p-md-4 p-3"> {/* Sombra más pronunciada, bordes redondeados, padding adaptativo */}
                    <Card.Body className="p-lg-5 p-4"> {/* Más padding interno para un look más espacioso */}
                        <h2 className="text-center mb-5 fw-bold text-dark">
                            {key === 'login' ? 'Bienvenido' : 'Crea tu Cuenta'}
                        </h2>

                        {/* Mensajes de Alerta */}
                        {error && <Alert variant="danger" className="mb-4 text-center border-0 rounded-pill py-2">{error}</Alert>}
                        {success && <Alert variant="success" className="mb-4 text-center border-0 rounded-pill py-2">{success}</Alert>}

                        {/* Pestañas de Login/Registro */}
                        <Tabs
                            id="auth-tabs"
                            activeKey={key}
                            onSelect={(k) => {
                                setKey(k);
                                setError(''); // Limpia errores al cambiar de pestaña
                                setSuccess(''); // Limpia mensajes de éxito al cambiar de pestaña
                                // Limpia todos los campos al cambiar de pestaña para evitar datos residuales
                                setLoginEmail('');
                                setLoginPassword('');
                                setShowLoginPassword(false);
                                setRegisterName('');
                                setRegisterEmail('');
                                setRegisterPassword('');
                                setRegisterConfirmPassword('');
                                setRegisterAddress('');
                                setShowRegisterPassword(false);
                                setShowConfirmPassword(false);
                            }}
                            className="mb-5 justify-content-center nav-pills" // Usamos nav-pills para un estilo más moderno
                            fill
                        >
                            <Tab eventKey="login" title="Iniciar Sesión" className="pt-3"> {/* Padding superior para el contenido de la pestaña */}
                                <Form onSubmit={handleLoginSubmit}>
                                    <Form.Group className="mb-4" controlId="loginEmail"> {/* Más margen inferior */}
                                        <Form.Label className="fw-semibold text-muted">Correo Electrónico</Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="ejemplo@correo.com"
                                            value={loginEmail}
                                            onChange={(e) => setLoginEmail(e.target.value)}
                                            required
                                            className="py-2" // Más padding vertical en los inputs
                                        />
                                    </Form.Group>

                                    {/* CAMPO DE CONTRASEÑA DE LOGIN CON TOGGLE */}
                                    <Form.Group className="mb-4" controlId="loginPassword">
                                        <Form.Label className="fw-semibold text-muted">Contraseña</Form.Label>
                                        <InputGroup>
                                            <Form.Control
                                                type={showLoginPassword ? "text" : "password"}
                                                placeholder="Ingresa tu contraseña"
                                                value={loginPassword}
                                                onChange={(e) => setLoginPassword(e.target.value)}
                                                required
                                                className="py-2"
                                            />
                                            <Button
                                                variant="outline-secondary"
                                                onClick={() => setShowLoginPassword(!showLoginPassword)}
                                                className="px-3" // Ajuste de padding para el botón del ojo
                                            >
                                                {showLoginPassword ? <EyeSlashFill size={18} /> : <EyeFill size={18} />} {/* Ajuste de tamaño de icono */}
                                            </Button>
                                        </InputGroup>
                                    </Form.Group>
                                    {/* FIN CAMPO DE CONTRASEÑA DE LOGIN */}

                                    <div className="d-grid gap-2 mb-3"> {/* Margen inferior para separar de link de olvido */}
                                        <Button
                                            variant="primary"
                                            type="submit"
                                            size="lg"
                                            className="py-2 fw-bold rounded-pill shadow-sm" // Botón grande, negrita, redondeado y con sombra
                                            disabled={formLoading}
                                        >
                                            {formLoading ? (
                                                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                                            ) : null}
                                            {formLoading ? 'Ingresando...' : 'Iniciar Sesión'}
                                        </Button>
                                    </div>

                                    <p className="text-center mt-3 text-muted">
                                        ¿Olvidaste tu contraseña? <Link to="/forgot-password" className="text-decoration-none fw-semibold">Recuperar</Link>
                                    </p>
                                </Form>
                            </Tab>

                            <Tab eventKey="register" title="Registrarse" className="pt-3"> {/* Padding superior para el contenido de la pestaña */}
                                <Form onSubmit={handleRegisterSubmit}>
                                    <Form.Group className="mb-4" controlId="registerName">
                                        <Form.Label className="fw-semibold text-muted">Nombre Completo</Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="Tu nombre y apellido"
                                            value={registerName}
                                            onChange={(e) => setRegisterName(e.target.value)}
                                            required
                                            className="py-2"
                                        />
                                    </Form.Group>

                                    <Form.Group className="mb-4" controlId="registerEmail">
                                        <Form.Label className="fw-semibold text-muted">Correo Electrónico</Form.Label>
                                        <Form.Control
                                            type="email"
                                            placeholder="ejemplo@correo.com"
                                            value={registerEmail}
                                            onChange={(e) => setRegisterEmail(e.target.value)}
                                            required
                                            className="py-2"
                                        />
                                    </Form.Group>

                                    {/* CAMPO DE CONTRASEÑA DE REGISTRO CON TOGGLE */}
                                    <Form.Group className="mb-4" controlId="registerPassword">
                                        <Form.Label className="fw-semibold text-muted">Contraseña</Form.Label>
                                        <InputGroup>
                                            <Form.Control
                                                type={showRegisterPassword ? "text" : "password"}
                                                placeholder="Crea una contraseña segura"
                                                value={registerPassword}
                                                onChange={(e) => setRegisterPassword(e.target.value)}
                                                required
                                                className="py-2"
                                            />
                                            <Button
                                                variant="outline-secondary"
                                                onClick={() => setShowRegisterPassword(!showRegisterPassword)}
                                                className="px-3"
                                            >
                                                {showRegisterPassword ? <EyeSlashFill size={18} /> : <EyeFill size={18} />}
                                            </Button>
                                        </InputGroup>
                                        <Form.Text className="text-muted mt-2 d-block"> {/* d-block para que ocupe su propia línea */}
                                            Mínimo 6 caracteres. Combina letras, números y símbolos.
                                        </Form.Text>
                                    </Form.Group>
                                    {/* FIN CAMPO DE CONTRASEÑA DE REGISTRO */}

                                    {/* CAMPO DE CONFIRMAR CONTRASEÑA CON TOGGLE */}
                                    <Form.Group className="mb-4" controlId="registerConfirmPassword">
                                        <Form.Label className="fw-semibold text-muted">Confirmar Contraseña</Form.Label>
                                        <InputGroup>
                                            <Form.Control
                                                type={showConfirmPassword ? "text" : "password"}
                                                placeholder="Confirma tu contraseña"
                                                value={registerConfirmPassword}
                                                onChange={(e) => setRegisterConfirmPassword(e.target.value)}
                                                required
                                                className="py-2"
                                            />
                                            <Button
                                                variant="outline-secondary"
                                                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                                                className="px-3"
                                            >
                                                {showConfirmPassword ? <EyeSlashFill size={18} /> : <EyeFill size={18} />}
                                            </Button>
                                        </InputGroup>
                                    </Form.Group>
                                    {/* FIN CAMPO DE CONFIRMAR CONTRASEÑA */}

                                    <Form.Group className="mb-4" controlId="registerAddress">
                                        <Form.Label className="fw-semibold text-muted">Dirección de Envío Principal</Form.Label>
                                        <Form.Control
                                            type="text"
                                            placeholder="Calle principal, número, ciudad, provincia"
                                            value={registerAddress}
                                            onChange={(e) => setRegisterAddress(e.target.value)}
                                            required
                                            className="py-2"
                                        />
                                        <Form.Text className="text-muted mt-2 d-block">
                                            Usaremos esta dirección para tus envíos por defecto.
                                        </Form.Text>
                                    </Form.Group>

                                    <div className="d-grid gap-2">
                                        <Button
                                            variant="dark" // Un color más sobrio y profesional para el botón de envío
                                            type="submit"
                                            size="lg"
                                            className="py-2 fw-bold rounded-pill shadow-sm"
                                            disabled={formLoading}
                                        >
                                            {formLoading ? (
                                                <Spinner as="span" animation="border" size="sm" role="status" aria-hidden="true" className="me-2" />
                                            ) : null}
                                            {formLoading ? 'Creando Cuenta...' : 'Crear Cuenta'}
                                        </Button>
                                    </div>
                                </Form>
                            </Tab>
                        </Tabs>
                    </Card.Body>
                </Card>
            </Col>
        </Container>
    );
}

export default LoginPage;