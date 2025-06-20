// src/pages/Admin/UserManagementPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import userService from '../../services/user.service';
import { Table, Button, Form, Container, Modal, OverlayTrigger, Tooltip, Spinner } from 'react-bootstrap';
import { toast } from 'react-toastify';
import { useAuth } from '../../context/AuthContext';

const UserManagementPage = () => {
    const { user: currentUser } = useAuth();

    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        search: '',
        role: '',
    });

    // Estados para el modal de edición
    const [showEditModal, setShowEditModal] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [editFormData, setEditFormData] = useState({
        fullName: '',
        email: '',
        address: '',
        phone: '',
        role: '',
        isActive: false,
    });

    // Estados para el modal de creación
    const [showCreateModal, setShowCreateModal] = useState(false);
    const [createFormData, setCreateFormData] = useState({
        fullName: '',
        email: '',
        password: '',
        address: '',
        phone: '',
        role: 'Client',
        isActive: true,
    });

    const availableRoles = ["Client", "Admin", "Auditor"];

    // Centralized fetch function for better reusability and dependency management
    const fetchUsers = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await userService.getAllUsers();
            let filteredUsers = data;

            if (filters.search) {
                const lowerCaseSearch = filters.search.toLowerCase();
                filteredUsers = filteredUsers.filter(user =>
                    user.fullName.toLowerCase().includes(lowerCaseSearch) ||
                    user.email.toLowerCase().includes(lowerCaseSearch)
                );
            }
            if (filters.role) {
                filteredUsers = filteredUsers.filter(user => user.role === filters.role);
            }

            setUsers(filteredUsers || []);
        } catch (err) {
            console.error("Error al obtener usuarios:", err);
            setError("No se pudieron cargar los usuarios. " + (err.response?.data?.message || err.message));
            toast.error("Error al cargar usuarios.");
        } finally {
            setLoading(false);
        }
    }, [filters]); // Dependency array for useCallback

    useEffect(() => {
        fetchUsers();
    }, [fetchUsers]); // fetchUsers is now a dependency due to useCallback

    // --- Manejo del Modal de Edición ---
    const handleShowEditModal = (user) => {
        setEditingUser(user);
        setEditFormData({
            fullName: user.fullName,
            email: user.email,
            address: user.address || '',
            phone: user.phone || '',
            role: user.role,
            isActive: user.isActive,
        });
        setShowEditModal(true);
    };

    const handleCloseEditModal = () => {
        setShowEditModal(false);
        setEditingUser(null);
        // Reset form data to initial empty state for clarity
        setEditFormData({ fullName: '', email: '', address: '', phone: '', role: '', isActive: false });
    };

    const handleEditFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setEditFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleSaveUser = async () => {
        // Simple client-side validation
        if (!editFormData.fullName || !editFormData.email) {
            toast.error("Nombre completo y Email son campos obligatorios.");
            return;
        }

        setLoading(true);
        try {
            await userService.updateUser(editingUser.id, editFormData);
            toast.success("Usuario actualizado exitosamente!");
            handleCloseEditModal();
            fetchUsers(); // Re-fetch to display updated data
        } catch (err) {
            console.error('Error al guardar usuario:', err);
            setError("Error al guardar usuario. " + (err.response?.data?.message || err.message));
            toast.error("Error al guardar usuario: " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };
    // --- Fin Manejo del Modal de Edición ---

    // --- Manejo del Modal de Creación ---
    const handleShowCreateModal = () => {
        // Ensure form is reset before opening
        setCreateFormData({
            fullName: '',
            email: '',
            password: '',
            address: '',
            phone: '',
            role: 'Client',
            isActive: true,
        });
        setShowCreateModal(true);
    };

    const handleCloseCreateModal = () => {
        setShowCreateModal(false);
    };

    const handleCreateFormChange = (e) => {
        const { name, value, type, checked } = e.target;
        setCreateFormData(prev => ({
            ...prev,
            [name]: type === 'checkbox' ? checked : value
        }));
    };

    const handleCreateUser = async () => {
        // Validación en el lado del cliente para campos obligatorios
        // AHORA INCLUYE 'address' como campo obligatorio
        if (!createFormData.fullName || !createFormData.email || !createFormData.password || !createFormData.address) {
            toast.error("Nombre completo, Email, Contraseña y Dirección son campos obligatorios.");
            return; // Detiene la función si la validación falla
        }

        setLoading(true);
        try {
            await userService.createUser(createFormData);
            toast.success("Usuario creado exitosamente!");
            handleCloseCreateModal();
            fetchUsers(); // Vuelve a cargar para mostrar el nuevo usuario
        } catch (err) {
            console.error('Error al crear usuario:', err);
            const errorMessage = err.response?.data?.message || err.message;
            // Mensaje de error más específico si la dirección es nula
            if (errorMessage.includes("Argument address must not be null")) {
                toast.error("Error al crear usuario: El campo Dirección no puede estar vacío.");
            } else {
                toast.error("Error al crear usuario: " + errorMessage);
            }
            setError("Error al crear usuario. " + errorMessage);
        } finally {
            setLoading(false);
        }
    };
    // --- Fin Manejo del Modal de Creación ---

    const handleToggleActiveStatus = async (user, newIsActiveStatus) => {
        if (currentUser && user.id === currentUser.id && user.role === 'Admin') {
            toast.error("Un administrador no puede cambiar su propio estado de actividad.");
            fetchUsers();
            return;
        }

        if (!window.confirm(`¿Estás seguro de ${newIsActiveStatus ? 'activar' : 'desactivar'} el usuario "${user.fullName}"?`)) {
            fetchUsers();
            return;
        }

        setLoading(true);
        try {
            await userService.updateUser(user.id, { isActive: newIsActiveStatus });
            toast.success(`Usuario ${newIsActiveStatus ? 'activado' : 'desactivado'} exitosamente!`);
            fetchUsers();
        } catch (err) {
            console.error(`Error al actualizar estado de actividad para usuario ${user.id}:`, err);
            setError("Error al actualizar el estado de actividad. " + (err.response?.data?.message || err.message));
            toast.error("Error al actualizar el estado de actividad: " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleRoleChange = async (userId, newRole) => {
        if (currentUser && currentUser.id === userId && currentUser.role === 'Admin' && newRole !== 'Admin') {
            toast.error("No puedes cambiar tu propio rol de administrador.");
            fetchUsers();
            return;
        }

        if (!window.confirm(`¿Estás seguro de cambiar el rol del usuario a "${newRole}"?`)) {
            fetchUsers();
            return;
        }

        setLoading(true);
        try {
            await userService.updateUser(userId, { role: newRole });
            toast.success("Rol actualizado exitosamente!");
            fetchUsers();
        } catch (err) {
            console.error(`Error al actualizar rol para usuario ${userId}:`, err);
            setError("Error al actualizar el rol. " + (err.response?.data?.message || err.message));
            toast.error("Error al actualizar el rol: " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleDeleteUser = async (userToDelete) => {
        if (currentUser && currentUser.id === userToDelete.id) {
            toast.error("No puedes eliminar tu propia cuenta.");
            return;
        }

        if (!window.confirm(`¿Estás seguro de ELIMINAR al usuario "${userToDelete.fullName}" (${userToDelete.email})? Esta acción no se puede deshacer y puede fallar si tiene datos asociados.`)) {
            return;
        }

        setLoading(true);
        try {
            await userService.deleteUser(userToDelete.id);
            toast.success(`Usuario "${userToDelete.fullName}" eliminado exitosamente!`);
            fetchUsers();
        } catch (err) {
            console.error(`Error al eliminar usuario ${userToDelete.id}:`, err);
            setError("Error al eliminar el usuario. " + (err.response?.data?.message || err.message));
            toast.error("Error al eliminar el usuario: " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
    };

    // Función auxiliar para renderizar Tooltip
    const renderTooltip = (text, props) => (
        <Tooltip id={`button-tooltip-${text}`} {...props}>
            {text}
        </Tooltip>
    );

    return (
        <Container className="mt-4 mb-5 p-4 bg-white rounded-lg shadow-lg">
            <h2 className="text-center mb-4 text-3xl font-extrabold text-gray-800">
                <i className="bi bi-people me-2"></i>
                Gestión de Usuarios SIGECOB
            </h2>

            {/* Filtros y botón Crear Usuario */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <Form.Control
                    type="text"
                    placeholder="Buscar por nombre o email..."
                    name="search"
                    value={filters.search}
                    onChange={handleFilterChange}
                    className="flex-grow-1 min-w-[180px]"
                    aria-label="Buscar usuario"
                />
                <Form.Select
                    name="role"
                    value={filters.role}
                    onChange={handleFilterChange}
                    className="flex-grow-1 min-w-[150px]"
                    aria-label="Filtrar por rol"
                >
                    <option value="">Todos los Roles</option>
                    {availableRoles.map(role => (
                        <option key={role} value={role}>{role}</option>
                    ))}
                </Form.Select>
                <Button
                    variant="success"
                    onClick={handleShowCreateModal}
                    className="ms-md-auto d-flex align-items-center"
                >
                    <i className="bi bi-person-plus-fill me-2"></i> Crear Usuario
                </Button>
            </div>

            {loading && (
                <div className="text-center my-4">
                    <Spinner animation="border" role="status" variant="primary">
                        <span className="visually-hidden">Cargando usuarios...</span>
                    </Spinner>
                    <p className="text-primary mt-2">Cargando usuarios...</p>
                </div>
            )}
            {error && <div className="alert alert-danger text-center">{error}</div>}

            {!loading && !error && (
                <div className="table-responsive">
                    {users.length > 0 ? (
                        <Table striped bordered hover className="shadow-sm">
                            <thead className="bg-dark text-white">
                                <tr>
                                    <th>ID</th>
                                    <th>Email</th>
                                    <th>Nombre Completo</th>
                                    <th>Rol</th>
                                    <th>Activo</th>
                                    <th className="text-center">Acciones</th>
                                </tr>
                            </thead>
                            <tbody>
                                {users.map((user) => (
                                    <tr key={user.id}>
                                        <td>{user.id}</td>
                                        <td>{user.email}</td>
                                        <td>{user.fullName}</td>
                                        <td>
                                            <Form.Select
                                                value={user.role}
                                                onChange={(e) => handleRoleChange(user.id, e.target.value)}
                                                className="d-inline-block w-auto"
                                                disabled={currentUser && user.id === currentUser.id && user.role === 'Admin'}
                                                aria-label={`Cambiar rol de ${user.fullName}`}
                                            >
                                                {availableRoles.map(role => (
                                                    <option key={role} value={role}>{role}</option>
                                                ))}
                                            </Form.Select>
                                        </td>
                                        <td>
                                            <Form.Check
                                                type="switch"
                                                id={`isActive-${user.id}`}
                                                label=""
                                                checked={user.isActive}
                                                onChange={(e) => handleToggleActiveStatus(user, e.target.checked)}
                                                disabled={currentUser && user.id === currentUser.id && user.role === 'Admin'}
                                                aria-label={`Activar o desactivar usuario ${user.fullName}`}
                                            />
                                        </td>
                                        <td className="text-center d-flex justify-content-center align-items-center gap-2">
                                            {/* Botón Editar con Tooltip */}
                                            <OverlayTrigger
                                                placement="top"
                                                delay={{ show: 250, hide: 400 }}
                                                overlay={(props) => renderTooltip("Editar Usuario", props)}
                                            >
                                                <Button
                                                    variant="info"
                                                    size="sm"
                                                    onClick={() => handleShowEditModal(user)}
                                                    className="d-flex align-items-center justify-content-center"
                                                    aria-label={`Editar usuario ${user.fullName}`}
                                                >
                                                    <i className="bi bi-pencil-fill text-white"></i>
                                                </Button>
                                            </OverlayTrigger>

                                            {/* Botón Eliminar con Tooltip */}
                                            <OverlayTrigger
                                                placement="top"
                                                delay={{ show: 250, hide: 400 }}
                                                overlay={(props) => renderTooltip("Eliminar Usuario", props)}
                                            >
                                                <Button
                                                    variant="danger"
                                                    size="sm"
                                                    onClick={() => handleDeleteUser(user)}
                                                    disabled={currentUser && user.id === currentUser.id}
                                                    className="d-flex align-items-center justify-content-center"
                                                    aria-label={`Eliminar usuario ${user.fullName}`}
                                                >
                                                    <i className="bi bi-trash-fill"></i>
                                                </Button>
                                            </OverlayTrigger>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    ) : (
                        <div className="alert alert-info text-center py-4">
                            No hay usuarios para mostrar con los filtros actuales.
                        </div>
                    )}
                </div>
            )}

            {/* Modal de Edición de Usuario */}
            <Modal show={showEditModal} onHide={handleCloseEditModal} centered>
                <Modal.Header closeButton className="bg-primary text-white">
                    <Modal.Title>Editar Usuario: {editingUser?.fullName}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Nombre Completo</Form.Label>
                            <Form.Control
                                type="text"
                                name="fullName"
                                value={editFormData.fullName}
                                onChange={handleEditFormChange}
                                required
                                aria-label="Nombre completo del usuario"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Email</Form.Label>
                            <Form.Control
                                type="email"
                                name="email"
                                value={editFormData.email}
                                onChange={handleEditFormChange}
                                disabled={currentUser && editingUser && editingUser.id === currentUser.id && editingUser.role === 'Admin'}
                                required
                                aria-label="Correo electrónico del usuario"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Dirección</Form.Label>
                            <Form.Control
                                type="text"
                                name="address"
                                value={editFormData.address}
                                onChange={handleEditFormChange}
                                aria-label="Dirección del usuario"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Teléfono</Form.Label>
                            <Form.Control
                                type="text"
                                name="phone"
                                value={editFormData.phone}
                                onChange={handleEditFormChange}
                                aria-label="Número de teléfono del usuario"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Rol</Form.Label>
                            <Form.Select
                                name="role"
                                value={editFormData.role}
                                onChange={handleEditFormChange}
                                disabled={currentUser && editingUser && editingUser.id === currentUser.id && editingUser.role === 'Admin'}
                                aria-label="Rol del usuario"
                            >
                                {availableRoles.map(role => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Check
                                type="switch"
                                id="editIsActiveSwitch"
                                label="Activo"
                                name="isActive"
                                checked={editFormData.isActive}
                                onChange={handleEditFormChange}
                                disabled={currentUser && editingUser && editingUser.id === currentUser.id}
                                aria-label="Estado de actividad del usuario"
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseEditModal}>
                        Cancelar
                    </Button>
                    <Button variant="primary" onClick={handleSaveUser} disabled={loading}>
                        {loading ? (
                            <>
                                <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    role="status"
                                    aria-hidden="true"
                                    className="me-2"
                                />
                                Guardando...
                            </>
                        ) : 'Guardar Cambios'}
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal de Creación de Usuario */}
            <Modal show={showCreateModal} onHide={handleCloseCreateModal} centered>
                <Modal.Header closeButton className="bg-success text-white">
                    <Modal.Title>Crear Nuevo Usuario</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group className="mb-3">
                            <Form.Label>Nombre Completo <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="text"
                                name="fullName"
                                value={createFormData.fullName}
                                onChange={handleCreateFormChange}
                                required
                                aria-label="Nombre completo del nuevo usuario"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Email <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="email"
                                name="email"
                                value={createFormData.email}
                                onChange={handleCreateFormChange}
                                required
                                aria-label="Correo electrónico del nuevo usuario"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Contraseña <span className="text-danger">*</span></Form.Label>
                            <Form.Control
                                type="password"
                                name="password"
                                value={createFormData.password}
                                onChange={handleCreateFormChange}
                                required
                                aria-label="Contraseña del nuevo usuario"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Dirección <span className="text-danger">*</span></Form.Label> {/* INDICADOR VISUAL */}
                            <Form.Control
                                type="text"
                                name="address"
                                value={createFormData.address}
                                onChange={handleCreateFormChange}
                                required // VALIDACIÓN HTML5
                                aria-label="Dirección del nuevo usuario"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Teléfono</Form.Label>
                            <Form.Control
                                type="text"
                                name="phone"
                                value={createFormData.phone}
                                onChange={handleCreateFormChange}
                                aria-label="Número de teléfono del nuevo usuario"
                            />
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Rol</Form.Label>
                            <Form.Select
                                name="role"
                                value={createFormData.role}
                                onChange={handleCreateFormChange}
                                aria-label="Rol del nuevo usuario"
                            >
                                {availableRoles.map(role => (
                                    <option key={role} value={role}>{role}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Check
                                type="switch"
                                id="createIsActiveSwitch"
                                label="Activo"
                                name="isActive"
                                checked={createFormData.isActive}
                                onChange={handleCreateFormChange}
                                aria-label="Estado de actividad del nuevo usuario"
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleCloseCreateModal}>
                        Cancelar
                    </Button>
                    <Button variant="success" onClick={handleCreateUser} disabled={loading}>
                        {loading ? (
                            <>
                                <Spinner
                                    as="span"
                                    animation="border"
                                    size="sm"
                                    role="status"
                                    aria-hidden="true"
                                    className="me-2"
                                />
                                Creando...
                            </>
                        ) : 'Crear Usuario'}
                    </Button>
                </Modal.Footer>
            </Modal>
        </Container>
    );
};

export default UserManagementPage;