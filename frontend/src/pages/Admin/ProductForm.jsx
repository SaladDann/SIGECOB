// src/pages/Admin/ProductForm.jsx
import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';

const ProductForm = ({ product, onSubmit, onCancel, isLoading, formError }) => {
    const [formData, setFormData] = useState({
        name: '',
        description: '',
        price: '',
        stock: '',
        category: '',
        imageUrl: null, // Para mostrar la imagen actual en modo edición
    });
    const [selectedFile, setSelectedFile] = useState(null);
    const [validationErrors, setValidationErrors] = useState({});

    useEffect(() => {
        if (product) {
            setFormData({
                name: product.name || '',
                description: product.description || '',
                price: product.price ? product.price.toString() : '',
                stock: product.stock ? product.stock.toString() : '',
                category: product.category || '',
                imageUrl: product.imageUrl || null,
            });
            setSelectedFile(null);
        } else {
            setFormData({
                name: '',
                description: '',
                price: '',
                stock: '',
                category: '',
                imageUrl: null,
            });
            setSelectedFile(null);
        }
        setValidationErrors({});
    }, [product]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
        setValidationErrors(prev => ({ ...prev, [name]: '' }));
    };

    const handleFileChange = (e) => {
        setSelectedFile(e.target.files[0]);
        setValidationErrors(prev => ({ ...prev, productImage: '' }));
    };

    const validateForm = () => {
        const errors = {};
        if (!formData.name.trim()) errors.name = 'El nombre es obligatorio.';
        if (!formData.price || isNaN(formData.price) || parseFloat(formData.price) <= 0) errors.price = 'El precio debe ser un número positivo.';
        if (!formData.stock || isNaN(formData.stock) || parseInt(formData.stock) < 0) errors.stock = 'El stock debe ser un número no negativo.';
        if (!formData.category.trim()) errors.category = 'La categoría es obligatoria.';
        
        if (!product && !selectedFile) {
            errors.productImage = 'La imagen del producto es obligatoria para nuevos productos.';
        }
        
        setValidationErrors(errors);
        return Object.keys(errors).length === 0;
    };

    const handleSubmit = (e) => {
        e.preventDefault();
        if (!validateForm()) {
            return;
        }

        const data = new FormData();
        data.append('name', formData.name);
        data.append('description', formData.description);
        data.append('price', formData.price);
        data.append('stock', formData.stock);
        data.append('category', formData.category);

        if (selectedFile) {
            data.append('productImage', selectedFile);
        }

        onSubmit(data);
    };

    return (
        <div className="bg-white p-6 rounded-lg shadow-md mb-8">
            <h2 className="text-2xl font-bold mb-4">{product ? 'Editar Producto' : 'Crear Nuevo Producto'}</h2>
            {formError && <p className="text-red-500 mb-4">{formError}</p>}
            <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label htmlFor="name" className="block text-gray-700 text-sm font-bold mb-2">Nombre:</label>
                        <input
                            type="text"
                            id="name"
                            name="name"
                            value={formData.name}
                            onChange={handleChange}
                            className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${validationErrors.name ? 'border-red-500' : ''}`}
                            disabled={isLoading}
                        />
                        {validationErrors.name && <p className="text-red-500 text-xs italic">{validationErrors.name}</p>}
                    </div>
                    <div>
                        <label htmlFor="category" className="block text-gray-700 text-sm font-bold mb-2">Categoría:</label>
                        <input
                            type="text"
                            id="category"
                            name="category"
                            value={formData.category}
                            onChange={handleChange}
                            className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${validationErrors.category ? 'border-red-500' : ''}`}
                            disabled={isLoading}
                        />
                        {validationErrors.category && <p className="text-red-500 text-xs italic">{validationErrors.category}</p>}
                    </div>
                </div>

                <div className="mb-4">
                    <label htmlFor="description" className="block text-gray-700 text-sm font-bold mb-2">Descripción:</label>
                    <textarea
                        id="description"
                        name="description"
                        value={formData.description}
                        onChange={handleChange}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline h-24 resize-y"
                        disabled={isLoading}
                    ></textarea>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                        <label htmlFor="price" className="block text-gray-700 text-sm font-bold mb-2">Precio:</label>
                        <input
                            type="number"
                            id="price"
                            name="price"
                            value={formData.price}
                            onChange={handleChange}
                            step="0.01"
                            className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${validationErrors.price ? 'border-red-500' : ''}`}
                            disabled={isLoading}
                        />
                        {validationErrors.price && <p className="text-red-500 text-xs italic">{validationErrors.price}</p>}
                    </div>
                    <div>
                        <label htmlFor="stock" className="block text-gray-700 text-sm font-bold mb-2">Stock:</label>
                        <input
                            type="number"
                            id="stock"
                            name="stock"
                            value={formData.stock}
                            onChange={handleChange}
                            step="1"
                            className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${validationErrors.stock ? 'border-red-500' : ''}`}
                            disabled={isLoading}
                        />
                        {validationErrors.stock && <p className="text-red-500 text-xs italic">{validationErrors.stock}</p>}
                    </div>
                </div>

                <div className="mb-6">
                    <label htmlFor="productImage" className="block text-gray-700 text-sm font-bold mb-2">Imagen del Producto:</label>
                    <input
                        type="file"
                        id="productImage"
                        name="productImage"
                        accept="image/*"
                        onChange={handleFileChange}
                        className={`shadow appearance-none border rounded w-full py-2 px-3 text-gray-700 leading-tight focus:outline-none focus:shadow-outline ${validationErrors.productImage ? 'border-red-500' : ''}`}
                        disabled={isLoading}
                    />
                    {validationErrors.productImage && <p className="text-red-500 text-xs italic">{validationErrors.productImage}</p>}

                    {product && formData.imageUrl && !selectedFile && (
                        <div className="mt-2">
                            <p className="text-sm text-gray-600 mb-1">Imagen actual:</p>
                            <img
                                src={`${import.meta.env.VITE_BACKEND_URL}${formData.imageUrl}`}
                                alt="Imagen actual del producto"
                                className="max-w-xs h-auto rounded shadow"
                            />
                        </div>
                    )}
                    {selectedFile && (
                        <div className="mt-2">
                            <p className="text-sm text-gray-600 mb-1">Nueva imagen seleccionada:</p>
                            <img
                                src={URL.createObjectURL(selectedFile)}
                                alt="Nueva imagen del producto"
                                className="max-w-xs h-auto rounded shadow"
                            />
                        </div>
                    )}
                </div>

                <div className="flex items-center justify-between">
                    <button
                        type="submit"
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        disabled={isLoading}
                    >
                        {isLoading ? 'Guardando...' : (product ? 'Actualizar Producto' : 'Crear Producto')}
                    </button>
                    <button
                        type="button"
                        onClick={onCancel}
                        className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
                        disabled={isLoading}
                    >
                        Cancelar
                    </button>
                </div>
            </form>
        </div>
    );
};

ProductForm.propTypes = {
    product: PropTypes.object,
    onSubmit: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    isLoading: PropTypes.bool,
    formError: PropTypes.string,
};

ProductForm.defaultProps = {
    product: null,
    isLoading: false,
    formError: null,
};

export default ProductForm;