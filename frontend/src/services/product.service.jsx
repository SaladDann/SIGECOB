// src/services/product.service.js
import api from './api';
import axios from 'axios';
const PRODUCT_API_URL = '/products'; 

const productService = {

    getAllProducts: async (params = {}) => {
        try {
            // El backend ahora puede recibir 'includeDiscontinued: true'
            const response = await api.get(PRODUCT_API_URL, { params }); 
            return response.data;
        } catch (error) {
            console.error("Error al obtener todos los productos:", error);
            throw error;
        }
    },

    getProductById: async (id) => {
        try {
            const response = await api.get(`${PRODUCT_API_URL}/${id}`);
            return response.data.product;
        } catch (error) {
            console.error(`Error al obtener producto con ID ${id}:`, error);
            throw error;
        }
    },

    createProduct: async (productData) => {
        try {
            const response = await api.post(`${PRODUCT_API_URL}/create`, productData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data.product;
        } catch (error) {
            console.error("Error al crear producto:", error);
            throw error;
        }
    },

    updateProduct: async (id, productData) => {
        try {
            const response = await api.put(`${PRODUCT_API_URL}/update/${id}`, productData, {
                headers: {
                    'Content-Type': 'multipart/form-data',
                },
            });
            return response.data.product;
        } catch (error) {
            console.error(`Error al actualizar producto con ID ${id}:`, error);
            throw error;
        }
    },

    // Renombramos deleteProduct a discontinueProduct para reflejar la "eliminación suave"
    discontinueProduct: async (id) => {
        try {
            // El backend sigue esperando un DELETE en la misma ruta
            const response = await api.delete(`${PRODUCT_API_URL}/delete/${id}`); // Usar 'api.delete' si 'api' es tu instancia de axios
            return response.data.message;
        } catch (error) {
            console.error(`Error al descontinuar producto con ID ${id}:`, error);
            throw error;
        }
    },
};

export default productService;