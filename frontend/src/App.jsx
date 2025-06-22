// src/App.jsx

import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Container } from 'react-bootstrap';
import { CartProvider } from './context/CartContext';
import { AuthProvider, useAuth } from './context/AuthContext.jsx';

// Importa ToastContainer y sus estilos
import { ToastContainer } from 'react-toastify'; 
import 'react-toastify/dist/ReactToastify.css';

import 'bootstrap/dist/css/bootstrap.min.css';

// Importa tus componentes
import HomePage from './pages/HomePage';
import ChatbotWidget from './components/ChatbotWidget';
import NavbarComponent from './components/NavbarComponent';
import ContactPage from './pages/ContactPage';
import LoginPage from './pages/LoginPage';
import QuienesSomosPage from './pages/QuienesSomosPage';
import ProductosPage from './pages/ProductosPage';
import CheckoutPage from './pages/CheckoutPage.jsx';
import OrderHistoryPage from './pages/OrderHistoryPage.jsx';

import ProductManagementPage from './pages/Admin/ProductManagementPage.jsx';
import UserManagementPage from './pages/Admin/UserManagementPage.jsx';
import AuditLogPage from './pages/Admin/AuditLogPage.jsx';
import OrderManagementPage from './pages/Admin/OrderManagementPage.jsx';

const ProtectedRoute = ({ children, roles }) => {
    const { isAuthenticated, user, loading } = useAuth(); // Obtén el estado de autenticación y usuario del contexto

    // Si el AuthContext aún está cargando la información del usuario desde localStorage
    if (loading) {
        return (
            <Container className="my-5 text-center">
                <h3>Cargando contenido...</h3>
                <div className="spinner-border text-primary" role="status">
                    <span className="visually-hidden">Cargando...</span>
                </div> 
            </Container>
        );
    }

    // Si no está autenticado, redirige al login
    if (!isAuthenticated) {
        return <Navigate to="/login" replace />;
    }

    // Si está autenticado, verifica el rol si se especificó
    const userRole = user ? user.role : null;
    if (roles && !roles.includes(userRole)) {
        // Autenticado pero sin el rol necesario, redirige a la página principal
        console.warn(`Acceso denegado: Usuario con rol '${userRole}' intentó acceder a una ruta restringida. Redirigiendo a /`);
        return <Navigate to="/" replace />;
    }

    // Si todo está bien, renderiza los hijos (la página protegida)
    return children;
};

function App() {
  return (
    <AuthProvider> {/* Envuelve toda tu aplicación con AuthProvider */}
      <CartProvider>
        <div className="app-container d-flex flex-column min-vh-100"> {/* d-flex flex-column min-vh-100 para footer pegado abajo */}

          <NavbarComponent />

          <header className="bg-primary text-white text-center py-4 mb-4 shadow-sm">
            <Container fluid>
              <h1 className="display-4 fw-bold mb-1">Tu Tecnología, a un Click</h1>
              <p className="lead">Expertos en componentes y equipos de alto rendimiento.</p>
            </Container>
          </header>

          <main className="main-content flex-grow-1"> {/* flex-grow-1 para que el main ocupe el espacio disponible */}
            <Routes>
              <Route path="/" element={<HomePage />} />
              <Route path="/productos" element={<ProductosPage />} />
              <Route path="/quienes-somos" element={<QuienesSomosPage />} />
              <Route path="/contacto" element={<ContactPage />} />
              <Route path="/login" element={<LoginPage />} />

              {/* Rutas protegidas para usuarios autenticados (sin requisitos de rol específicos aquí, solo estar logueado) */}
              <Route path="/checkout" element={
                <ProtectedRoute>
                  <CheckoutPage />
                </ProtectedRoute>
              } />
              <Route path="/order-history" element={
                <ProtectedRoute>
                  <OrderHistoryPage />
                </ProtectedRoute>
              } />
              {/* Si tienes una página de perfil de usuario, también protégela */}
              {/* <Route path="/profile" element={
                <ProtectedRoute>
                  <UserProfilePage />
                </ProtectedRoute>
              } /> */}


              {/* Ruta protegida para administradores */}
              <Route path="/admin/products" element={
                <ProtectedRoute roles={['Admin']}> {/* Solo acceso si el rol es 'Admin' */}
                  <ProductManagementPage />
                </ProtectedRoute>
              } />

              <Route path="/admin/users" element={
                <ProtectedRoute roles={['Admin']}>
                  <UserManagementPage />
                </ProtectedRoute>
              } />

              <Route path="/admin/audit-logs" element={
                <ProtectedRoute roles={['Auditor']}>
                  <AuditLogPage />
                </ProtectedRoute>
              } />
              {/* Nueva ruta para la gestión de órdenes, solo para administradores */}
                <Route path="/admin/orders" element={
                  <ProtectedRoute roles={['Admin']}>
                      <OrderManagementPage />
                </ProtectedRoute>
              } />

              {/* Catch-all para rutas no encontradas (404) */}
              <Route path="*" element={
                <Container className="my-5 text-center">
                  <h2 className="display-3">404</h2>
                  <h3>Página no encontrada</h3>
                  <p className="lead">Lo sentimos, la página que buscas no existe.</p>
                </Container>
              } />
            </Routes>
          </main>

          <footer className="bg-dark text-white py-4 mt-auto shadow-lg">
            <Container fluid className="text-center">
              <p className="mb-1">&copy; {new Date().getFullYear()} SIGECOB. Todos los derechos reservados.</p>
              <p className="mb-0">Tu mejor opción en tecnología.</p>
            </Container>
          </footer>

          <ChatbotWidget />

          <ToastContainer
            position="top-right"
            autoClose={5000}
            hideProgressBar={false}
            newestOnTop={false}
            closeOnClick
            rtl={false}
            pauseOnFocusLoss
            draggable
            pauseOnHover
            theme="colored"
          />
        </div>
      </CartProvider>
    </AuthProvider>
  );
}

export default App;