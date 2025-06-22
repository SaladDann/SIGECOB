import React from 'react';
import { Navbar, Nav, Container, Button } from 'react-bootstrap';
import { NavLink, Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext.jsx';

function NavbarComponent() {
  const { isAuthenticated, user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout(); // Llama a la función logout del contexto
    navigate('/login'); // Redirige al login
  };

  // Obtener el rol del usuario, si existe
  const userRole = user ? user.role : null;

  return (
    <Navbar bg="dark" variant="dark" expand="lg" className="py-3 shadow-lg">
      <Container fluid>
        <Navbar.Brand as={Link} to="/" className="fw-bold fs-4">
          SIGECOB
        </Navbar.Brand>
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        <Navbar.Collapse id="basic-navbar-nav">
          <Nav className="mx-auto">
            <Nav.Link as={NavLink} to="/" end className="mx-2">Inicio</Nav.Link>
            <Nav.Link as={NavLink} to="/productos" className="mx-2">Productos</Nav.Link>
            <Nav.Link as={NavLink} to="/quienes-somos" className="mx-2">Sobre Nosotros</Nav.Link>
            <Nav.Link as={NavLink} to="/contacto" className="mx-2">Contacto</Nav.Link>
            {isAuthenticated && (
              <>
                {userRole === 'Client' && (
                  <Nav.Link as={NavLink} to="/order-history" className="mx-2">Historial de Ordenes</Nav.Link>
                )}
                
                {/* Nuevo enlace para la gestión de productos, visible solo si el usuario es Admin */}
                {userRole === 'Admin' && (
                  <Nav.Link as={NavLink} to="/admin/products" className="mx-2 text-warning fw-bold">
                    Gestión Productos
                  </Nav.Link>
                )}
                {userRole === 'Admin' && (
                  <Nav.Link as={NavLink} to="/admin/users" className="mx-2 text-warning fw-bold">
                    Gestión Usuarios
                  </Nav.Link>
                )}
                {userRole === 'Admin' && (
                  <Nav.Link as={NavLink} to="/admin/orders" className="mx-2 text-warning fw-bold">
                    Gestión Órdenes
                  </Nav.Link>
                )}

                {userRole === 'Auditor' && (
                  <Nav.Link as={NavLink} to="/admin/audit-logs" className="mx-2 text-warning fw-bold">
                    Auditoría de Logs
                  </Nav.Link>
                )}
              </>
            )}
          </Nav>
          <Nav>
            {isAuthenticated ? (
              <>
                <Nav.Link disabled className="text-white">
                  Hola, { user?.fullName || 'Usuario'}!
                </Nav.Link>
                <Button variant="outline-light" onClick={handleLogout}>
                  Cerrar Sesión
                </Button>
              </>
            ) : (
              <>
                <Button variant="outline-light" as={Link} to="/login" className="me-2">
                  Iniciar Sesión/Registrarse
                </Button>
              </>
            )}
          </Nav>
        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default NavbarComponent;
