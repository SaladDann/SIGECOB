// src/pages/Admin/AuditLogPage.jsx
import React, { useState, useEffect, useCallback } from 'react';
import { Container, Table, Form, Button, Row, Col } from 'react-bootstrap';
import auditService from '../../services/audit.service';
import { toast } from 'react-toastify';
import { format } from 'date-fns'; // Para formatear las fechas de manera legible

const AuditLogPage = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [filters, setFilters] = useState({
        userId: '',
        action: '',
        entity: '',
        ipAddress: '',
        startDate: '',
        endDate: '',
    });

    // Entidades de ejemplo que puedes querer filtrar (ajusta según tu modelo)
    const availableEntities = ["User", "Product", "Order", "Category", "Payment"];
    // Acciones de ejemplo (pueden ser muchas, podrías hacer un typeahead si son demasiadas)
    const availableActions = ["LOGIN", "LOGOUT", "CREATE", "UPDATE", "DELETE", "VIEW"];


    // useCallback para memorizar la función y evitar re-renders innecesarios
    const fetchAuditLogs = useCallback(async () => {
        setLoading(true);
        setError(null);
        try {
            const data = await auditService.searchAuditLogs(filters); // Usamos search para todos los casos
            setLogs(data);
        } catch (err) {
            console.error("Error al obtener logs de auditoría:", err);
            setError("No se pudieron cargar los logs de auditoría. " + (err.response?.data?.message || err.message));
            toast.error("Error al cargar logs de auditoría.");
        } finally {
            setLoading(false);
        }
    }, [filters]); // La función se recrea solo si 'filters' cambia

    useEffect(() => {
        fetchAuditLogs();
    }, [fetchAuditLogs]); // Dependencia de fetchAuditLogs


    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({
            ...prev,
            [name]: value
        }));
    };

    const handleClearFilters = () => {
        setFilters({
            userId: '',
            action: '',
            entity: '',
            ipAddress: '',
            startDate: '',
            endDate: '',
        });
        // No es necesario llamar fetchAuditLogs aquí, ya que el useEffect lo hará al cambiar filters
    };

    const handleSearch = (e) => {
        e.preventDefault(); // Evitar el envío por defecto del formulario
        fetchAuditLogs(); // Volver a cargar los logs con los filtros actuales
    };

    return (
        <Container className="mt-4 mb-5 p-4 bg-white rounded-lg shadow-lg">
            <h2 className="text-center mb-4 text-3xl font-extrabold text-gray-800">
                <i className="bi bi-shield-check me-2"></i>
                Registro de Auditoría SIGECOB
            </h2>

            {/* Formulario de Filtros */}
            <Form onSubmit={handleSearch} className="mb-4 p-3 border rounded shadow-sm bg-light">
                <Row className="mb-3 g-3">
                    <Col md={6} lg={4}>
                        <Form.Group controlId="filterUserId">
                            <Form.Label className="fw-bold">ID de Usuario</Form.Label>
                            <Form.Control
                                type="number"
                                name="userId"
                                value={filters.userId}
                                onChange={handleFilterChange}
                                placeholder="Filtrar por ID de usuario"
                            />
                        </Form.Group>
                    </Col>
                    <Col md={6} lg={4}>
                        <Form.Group controlId="filterAction">
                            <Form.Label className="fw-bold">Acción</Form.Label>
                            <Form.Control
                                type="text"
                                name="action"
                                value={filters.action}
                                onChange={handleFilterChange}
                                placeholder="Buscar por tipo de acción"
                            />
                            {/* Opcional: un select si las acciones son predefinidas y no muchas */}
                            {/* <Form.Select
                                name="action"
                                value={filters.action}
                                onChange={handleFilterChange}
                            >
                                <option value="">Todas las Acciones</option>
                                {availableActions.map(action => (
                                    <option key={action} value={action}>{action}</option>
                                ))}
                            </Form.Select> */}
                        </Form.Group>
                    </Col>
                    <Col md={6} lg={4}>
                        <Form.Group controlId="filterEntity">
                            <Form.Label className="fw-bold">Entidad</Form.Label>
                            <Form.Select
                                name="entity"
                                value={filters.entity}
                                onChange={handleFilterChange}
                            >
                                <option value="">Todas las Entidades</option>
                                {availableEntities.map(entity => (
                                    <option key={entity} value={entity}>{entity}</option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                    </Col>
                    <Col md={6} lg={4}>
                        <Form.Group controlId="filterIpAddress">
                            <Form.Label className="fw-bold">Dirección IP</Form.Label>
                            <Form.Control
                                type="text"
                                name="ipAddress"
                                value={filters.ipAddress}
                                onChange={handleFilterChange}
                                placeholder="Filtrar por dirección IP"
                            />
                        </Form.Group>
                    </Col>
                    <Col md={6} lg={4}>
                        <Form.Group controlId="filterStartDate">
                            <Form.Label className="fw-bold">Fecha Inicio</Form.Label>
                            <Form.Control
                                type="date"
                                name="startDate"
                                value={filters.startDate}
                                onChange={handleFilterChange}
                            />
                        </Form.Group>
                    </Col>
                    <Col md={6} lg={4}>
                        <Form.Group controlId="filterEndDate">
                            <Form.Label className="fw-bold">Fecha Fin</Form.Label>
                            <Form.Control
                                type="date"
                                name="endDate"
                                value={filters.endDate}
                                onChange={handleFilterChange}
                            />
                        </Form.Group>
                    </Col>
                </Row>
                <div className="d-flex justify-content-end gap-2">
                    <Button variant="primary" type="submit" disabled={loading}>
                        <i className="bi bi-search me-2"></i> Buscar Logs
                    </Button>
                    <Button variant="secondary" onClick={handleClearFilters} disabled={loading}>
                        <i className="bi bi-x-circle me-2"></i> Limpiar Filtros
                    </Button>
                </div>
            </Form>

            {loading && <div className="text-center text-primary my-4">Cargando logs de auditoría...</div>}
            {error && <div className="alert alert-danger text-center">{error}</div>}

            {!loading && !error && (
                <div className="table-responsive">
                    <Table striped bordered hover className="shadow-sm caption-top">
                        <caption>Últimos {logs.length} logs de auditoría (ordenados por fecha descendente)</caption>
                        <thead className="bg-dark text-white">
                            <tr>
                                <th>ID</th>
                                <th>Fecha y Hora</th>
                                <th>Usuario</th>
                                <th>Rol Usuario</th>
                                <th>Acción</th>
                                <th>Entidad</th>
                                <th>Entidad ID</th>
                                <th>Descripción</th>
                                <th>IP</th>
                            </tr>
                        </thead>
                        <tbody>
                            {logs.length > 0 ? (
                                logs.map((log) => (
                                    <tr key={log.id}>
                                        <td>{log.id}</td>
                                        <td>{format(new Date(log.timestamp), 'dd/MM/yyyy HH:mm:ss')}</td>
                                        <td>{log.user ? log.user.fullName : 'N/A'} ({log.user ? log.user.email : 'Usuario Eliminado'})</td>
                                        <td>{log.user ? log.user.role : 'N/A'}</td>
                                        <td>{log.action}</td>
                                        <td>{log.entity}</td>
                                        <td>{log.entityId || 'N/A'}</td>
                                        <td>{log.description}</td>
                                        <td>{log.ipAddress}</td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="9" className="text-center text-muted py-4">No hay logs de auditoría para mostrar con los filtros actuales.</td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </div>
            )}
        </Container>
    );
};

export default AuditLogPage;