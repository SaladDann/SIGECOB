// src/pages/Admin/ProductManagementPage.jsx

import React, { useState, useEffect } from 'react';
import productService from '../../services/product.service'; 
import { Modal, Button, Form, Table, Pagination } from 'react-bootstrap'; 
import 'bootstrap/dist/css/bootstrap.min.css'; 
// Asume que Tailwind CSS está configurado globalmente en tu proyecto.

const ProductManagementPage = () => {
    const [products, setProducts] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [editingProduct, setEditingProduct] = useState(null); 
    const [formData, setFormData] = useState({ 
        name: '', description: '', price: '', stock: '', category: '', status: '', image: ''
    });
    const [imageFile, setImageFile] = useState(null); 

    // Estados para paginación y filtros
    const [currentPage, setCurrentPage] = useState(1);
    const [pageSize, setPageSize] = useState(10); 
    const [totalPages, setTotalPages] = useState(1);
    const [filters, setFilters] = useState({
        search: '', category: '', status: '',
    });
    // NUEVO ESTADO: Para incluir productos descontinuados en la vista de administración
    const [includeDiscontinued, setIncludeDiscontinued] = useState(false); 

    // Definimos las categorías de electrónica aquí
    const electronicCategories = [
        "Smartphones",
        "Laptops",
        "Tablets",
        "Audio (Auriculares, Parlantes)",
        "Televisores",
        "Wearables (Smartwatches)",
        "Accesorios (Cables, Cargadores)",
        "Gaming (Consolas, Periféricos)",
        "Componentes PC",
        "Redes (Routers, Switches)",
        "Almacenamiento (Discos, USB)",
        "Fotografía y Video",
        "Electrodomésticos Inteligentes"
    ];

    // Estados de producto para los filtros y el formulario
    const productStatuses = ["Available", "Out_of_Stock", "Discontinued"];


    // --- FUNCIONALIDAD ---

    // Obtener productos
    const fetchProducts = async () => {
        setLoading(true);
        setError(null);
        try {
            const params = {
                page: currentPage, 
                pageSize: pageSize, 
                search: filters.search,
                category: filters.category, 
                status: filters.status,
                // NUEVO: Pasar el parámetro para incluir descontinuados si el checkbox está marcado
                includeDiscontinued: includeDiscontinued ? 'true' : 'false', 
            };
            const data = await productService.getAllProducts(params);
            setProducts(data.products || []);
            setTotalPages(data.pagination.totalPages || 1); // Asegúrate de que pagination sea parte de data
        } catch (err) {
            console.error("Error al obtener productos:", err);
            setError("No se pudieron cargar los productos.");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [currentPage, pageSize, filters, includeDiscontinued]); // Añadir includeDiscontinued como dependencia

    // Mostrar/Ocultar Modal
    const handleShowModal = (product = null) => {
        setEditingProduct(product);
        if (product) {
            setFormData({
                name: product.name, description: product.description, price: product.price,
                stock: product.stock, category: product.category, status: product.status,
                image: product.imageUrl, // 'image' aquí almacena la URL actual, no el archivo
            });
            setImageFile(null); // Resetear el archivo de imagen al editar
        } else {
            // Valores predeterminados para nuevo producto
            setFormData({ name: '', description: '', price: '', stock: '', category: '', status: 'Available', image: '' }); 
            setImageFile(null);
        }
        setShowModal(true);
    };

    const handleCloseModal = () => {
        setShowModal(false);
        setEditingProduct(null);
        setImageFile(null);
        setError(null);
    };

    // Manejar cambios en formulario
    const handleFormChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    // Manejar selección de imagen
    const handleImageChange = (e) => {
        setImageFile(e.target.files[0]);
    };

    // Enviar formulario (Crear/Actualizar)
    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setError(null);

        try {
            const dataToSubmit = new FormData();
            for (const key in formData) {
                if (key !== 'image') { // Excluir 'image' que es la URL actual, no el archivo
                    dataToSubmit.append(key, formData[key]);
                }
            }
        
            if (imageFile) {
                dataToSubmit.append('image', imageFile);
            } else if (editingProduct && formData.image !== editingProduct.imageUrl) {
                // Si no hay nueva imagen, pero la URL de imagen cambió (ej. se borró manualmente la URL en el formulario)
                dataToSubmit.append('imageUrl', formData.image || ''); // Enviar la URL actual o vacía para borrar
            }


            if (editingProduct) {
                await productService.updateProduct(editingProduct.id, dataToSubmit);
                console.log("Producto actualizado con éxito!");
            } else {
                await productService.createProduct(dataToSubmit);
                console.log("Producto creado con éxito!");
            }
            fetchProducts(); 
            handleCloseModal(); 
        } catch (err) {
            console.error("Error al guardar producto:", err);
            setError("Error al guardar el producto. " + (err.response?.data?.message || err.message));
        } finally {
            setLoading(false);
        }
    };

    // Descontinuar Producto (antes llamado Eliminar)
    const handleDiscontinue = async (id) => {
        if (window.confirm("¿Estás seguro de que quieres descontinuar este producto? No se eliminará completamente, solo se marcará como no disponible.")) {
            setLoading(true);
            setError(null);
            try {
                // Llamamos a la nueva función discontinueProduct del servicio
                const message = await productService.discontinueProduct(id);
                console.log(message);
                fetchProducts(); 
            } catch (err) {
                console.error("Error al descontinuar producto:", err);
                setError("Error al descontinuar el producto. " + (err.response?.data?.message || err.message));
            } finally {
                setLoading(false);
            }
        }
    };

    // Manejar Paginación
    const handlePageChange = (page) => {
        setCurrentPage(page);
    };

    // Manejar Filtros
    const handleFilterChange = (e) => {
        const { name, value } = e.target;
        setFilters(prev => ({ ...prev, [name]: value }));
        setCurrentPage(1); 
    };

    // Manejar el cambio del checkbox 'Incluir descontinuados'
    const handleIncludeDiscontinuedChange = (e) => {
        setIncludeDiscontinued(e.target.checked);
        setCurrentPage(1); // Resetear a la primera página al cambiar este filtro
    };


    // --- VISTA ---

    return (
        <div className="container mt-4 mb-5 p-4 bg-white rounded-lg shadow-lg">
            <h2 className="text-center mb-4 text-3xl font-extrabold text-gray-800">
                <i className="bi bi-box-seam me-2"></i> 
                Gestión de Productos SIGECOB
            </h2>

            {/* Filtros y Botón Añadir */}
            <div className="d-flex justify-content-between align-items-center mb-4 flex-wrap gap-3">
                <div className="d-flex flex-grow-1 flex-wrap gap-3">
                    <Form.Control
                        type="text"
                        placeholder="Buscar por nombre o descripción..."
                        name="search"
                        value={filters.search}
                        onChange={handleFilterChange}
                        className="flex-grow-1 min-w-[180px]"
                    />
                    {/* Filtro por Categoría - Ahora con categorías de electrónica */}
                    <Form.Select
                        name="category"
                        value={filters.category}
                        onChange={handleFilterChange}
                        className="flex-grow-1 min-w-[150px]"
                    >
                        <option value="">Todas las Categorías</option>
                        {electronicCategories.map(cat => (
                            <option key={cat} value={cat}>{cat}</option>
                        ))}
                    </Form.Select>
                    {/* Filtro por Estado - Actualizado con los estados del backend */}
                    <Form.Select
                        name="status"
                        value={filters.status}
                        onChange={handleFilterChange}
                        className="flex-grow-1 min-w-[150px]"
                    >
                        <option value="">Todos los Estados</option>
                        {productStatuses.map(status => (
                            <option key={status} value={status}>
                                {status.replace(/_/g, ' ')} {/* Reemplaza guiones bajos por espacios para mejor lectura */}
                            </option>
                        ))}
                    </Form.Select>
                </div>
                <div className="d-flex align-items-center gap-3">
                    {/* Checkbox para incluir productos descontinuados */}
                    <Form.Check
                        type="checkbox"
                        id="includeDiscontinued"
                        label="Mostrar descontinuados"
                        checked={includeDiscontinued}
                        onChange={handleIncludeDiscontinuedChange}
                    />
                    <Button variant="primary" onClick={() => handleShowModal()} className="px-4 py-2">
                        <i className="bi bi-plus-circle me-2"></i>
                        Añadir Nuevo Producto
                    </Button>
                </div>
            </div>

            {loading && <div className="text-center text-primary my-4">Cargando productos...</div>}
            {error && <div className="alert alert-danger text-center">{error}</div>}

            {/* Tabla de Productos */}
            {!loading && !error && (
                <div className="table-responsive">
                    <Table striped bordered hover className="shadow-sm">
                        <thead className="bg-dark text-white">
                            <tr>
                                <th>ID</th>
                                <th>Imagen</th>
                                <th>Nombre</th>
                                <th>Descripción</th>
                                <th>Precio</th>
                                <th>Stock</th>
                                <th>Categoría</th>
                                <th>Estado</th>
                                <th className="text-center">Acciones</th>
                            </tr>
                        </thead>
                        <tbody>
                            {products.length > 0 ? (
                                products.map((product) => (
                                    <tr 
                                        key={product.id}
                                        // NUEVO: Estilo condicional para productos descontinuados
                                        className={product.status === 'Discontinued' ? 'table-danger' : ''} 
                                    >
                                        <td>{product.id}</td>
                                        <td>
                                            {product.imageUrl && (
                                                <img 
                                                    src={`http://localhost:3200${product.imageUrl}`}
                                                    alt={product.name} 
                                                    className="img-thumbnail rounded-md" 
                                                    style={{ width: '60px', height: '60px', objectFit: 'cover' }} 
                                                />
                                            )}
                                        </td>
                                        <td>{product.name}</td>
                                        <td>{product.description ? product.description.substring(0, 70) + '...' : 'N/A'}</td> 
                                        <td>${product.price ? parseFloat(product.price).toFixed(2) : 'N/A'}</td>
                                        <td>{product.stock}</td>
                                        <td>{product.category}</td>
                                        {/* Muestra el estado formateado para mejor lectura */}
                                        <td>{product.status.replace(/_/g, ' ')}</td>
                                        <td className="text-center">
                                            <Button 
                                                variant="warning" 
                                                size="sm" 
                                                onClick={() => handleShowModal(product)} 
                                                className="me-2 d-inline-flex align-items-center" 
                                            >
                                                <i className="bi bi-pencil me-1"></i> 
                                                Editar
                                            </Button>
                                            <Button 
                                                variant="danger" 
                                                size="sm" 
                                                // Llama a la nueva función handleDiscontinue
                                                onClick={() => handleDiscontinue(product.id)}
                                                className="d-inline-flex align-items-center"
                                                // Deshabilitar si ya está descontinuado
                                                disabled={product.status === 'Discontinued'} 
                                            >
                                                <i className="bi bi-x-circle me-1"></i> {/* Icono de "descontinuar" o "archivar" */}
                                                {product.status === 'Discontinued' ? 'Descontinuado' : 'Descontinuar'}
                                            </Button>
                                        </td>
                                    </tr>
                                ))
                            ) : (
                                <tr>
                                    <td colSpan="9" className="text-center text-muted py-4">No hay productos para mostrar con los filtros actuales.</td>
                                </tr>
                            )}
                        </tbody>
                    </Table>
                </div>
            )}

            {/* Controles de Paginación */}
            {totalPages > 1 && (
                <Pagination className="justify-content-center mt-4"> 
                    <Pagination.First onClick={() => handlePageChange(1)} disabled={currentPage === 1} />
                    <Pagination.Prev onClick={() => handlePageChange(currentPage - 1)} disabled={currentPage === 1} />
                    {[...Array(totalPages)].map((_, index) => (
                        <Pagination.Item
                            key={index + 1}
                            active={index + 1 === currentPage}
                            onClick={() => handlePageChange(index + 1)}
                        >
                            {index + 1}
                        </Pagination.Item>
                    ))}
                    <Pagination.Next onClick={() => handlePageChange(currentPage + 1)} disabled={currentPage === totalPages} />
                    <Pagination.Last onClick={() => handlePageChange(totalPages)} disabled={currentPage === totalPages} />
                </Pagination>
            )}

            {/* Modal para Añadir/Editar Producto */}
            <Modal show={showModal} onHide={handleCloseModal} centered size="lg"> 
                <Modal.Header closeButton className="bg-primary text-white"> 
                    <Modal.Title>{editingProduct ? 'Editar Producto' : 'Añadir Nuevo Producto'}</Modal.Title>
                </Modal.Header>
                <Form onSubmit={handleSubmit}>
                    <Modal.Body>
                        <div className="row"> 
                            <Form.Group className="mb-3 col-md-6">
                                <Form.Label>Nombre</Form.Label>
                                <Form.Control type="text" name="name" value={formData.name} onChange={handleFormChange} required />
                            </Form.Group>
                            <Form.Group className="mb-3 col-md-6">
                                <Form.Label>Categoría</Form.Label>
                                {/* Campo de Categoría en el formulario - Ahora con categorías de electrónica */}
                                <Form.Select name="category" value={formData.category} onChange={handleFormChange} required>
                                    <option value="">Seleccionar Categoría</option>
                                    {electronicCategories.map(cat => (
                                        <option key={cat} value={cat}>{cat}</option>
                                    ))}
                                </Form.Select>
                            </Form.Group>
                        </div>
                        <Form.Group className="mb-3">
                            <Form.Label>Descripción</Form.Label>
                            <Form.Control as="textarea" rows={3} name="description" value={formData.description} onChange={handleFormChange} required />
                        </Form.Group>
                        <div className="row">
                            <Form.Group className="mb-3 col-md-6">
                                <Form.Label>Precio</Form.Label>
                                <Form.Control type="number" step="0.01" name="price" value={formData.price} onChange={handleFormChange} required />
                            </Form.Group>
                            <Form.Group className="mb-3 col-md-6">
                                <Form.Label>Stock</Form.Label>
                                <Form.Control type="number" name="stock" value={formData.stock} onChange={handleFormChange} required />
                            </Form.Group>
                        </div>
                        <Form.Group className="mb-3">
                            <Form.Label>Estado</Form.Label>
                            {/* Selector de Estado en el formulario - Actualizado con los estados del backend */}
                            <Form.Select name="status" value={formData.status} onChange={handleFormChange} required>
                                <option value="">Seleccionar Estado</option>
                                {productStatuses.map(status => (
                                    <option key={status} value={status}>
                                        {status.replace(/_/g, ' ')}
                                    </option>
                                ))}
                            </Form.Select>
                        </Form.Group>
                        <Form.Group className="mb-3">
                            <Form.Label>Imagen del Producto</Form.Label>
                            <Form.Control type="file" onChange={handleImageChange} />
                            {editingProduct && formData.image && !imageFile && (
                                <div className="mt-2 p-2 border rounded-md">
                                    <p className="font-semibold mb-1">Imagen actual:</p>
                                    <img 
                                        src={`http://localhost:3200${formData.image}`} // Usa formData.image para la URL
                                        alt="Current Product" 
                                        className="img-thumbnail" 
                                        style={{ maxWidth: '150px', maxHeight: '150px', objectFit: 'cover' }} 
                                    />
                                </div>
                            )}
                            {imageFile && (
                                <div className="mt-2 p-2 border rounded-md">
                                    <p className="font-semibold mb-1">Nueva imagen a subir:</p>
                                    <img 
                                        src={URL.createObjectURL(imageFile)} 
                                        alt="New Product" 
                                        className="img-thumbnail" 
                                        style={{ maxWidth: '150px', maxHeight: '150px', objectFit: 'cover' }} 
                                    />
                                </div>
                            )}
                        </Form.Group>
                    </Modal.Body>
                    <Modal.Footer>
                        <Button variant="secondary" onClick={handleCloseModal}>
                            Cancelar
                        </Button>
                        <Button variant="primary" type="submit" disabled={loading}>
                            {loading ? 'Guardando...' : (editingProduct ? 'Guardar Cambios' : 'Crear Producto')}
                        </Button>
                    </Modal.Footer>
                </Form>
            </Modal>
        </div>
    );
};

export default ProductManagementPage;