// src/services/api.js
import axios from 'axios';

const API_BASE_URL = import.meta.env.VITE_BACKEND_URL;

const api = axios.create({
    baseURL: API_BASE_URL,
    headers: {
        'Content-Type': 'application/json',
    },
});

// Importante: El AuthContext ya maneja la adición del token a axios.defaults.headers.common['Authorization']
// por lo que no es necesario un interceptor aquí para eso.
// Este interceptor es útil para manejar errores de respuesta globalmente.
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            // Asegúrate de que el token se añada a CUALQUIER solicitud, incluyendo FormData
            config.headers.Authorization = `Bearer ${token}`;
        }
        console.log("Request Config:", config);
        return config;
    },
    (error) => {
        return Promise.reject(error);
    }
);


export default api;