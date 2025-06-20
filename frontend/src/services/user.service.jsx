// src/services/user.service.js
import axios from 'axios';

const API_URL = `${import.meta.env.VITE_BACKEND_URL}/users`; 
const API_URL_AUTH = `${import.meta.env.VITE_BACKEND_URL}/auth`; // URL para autenticación/registro

class UserService {
    async getAllUsers(params = {}) {
        try {
            const response = await axios.get(API_URL + '/get', { 
                params: params, 
            });
            return response.data; 
        } catch (error) {
            console.error("Error fetching all users:", error);
            throw error;
        }
    }

    // Método para actualizar un usuario existente (usado por el modal de edición y selector de rol)
    async updateUser(userId, userData) {
        try {
            // Envía solo los campos que necesitas actualizar
            const response = await axios.put(API_URL + `/update/${userId}`, userData);
            return response.data;
        } catch (error) {
            console.error(`Error updating user ${userId}:`, error.response?.data || error.message);
            throw error;
        }
    }
    
    // Método para ELIMINAR un usuario
    async deleteUser(userId) {
        try {
            const response = await axios.delete(API_URL + `/delete/${userId}`);
            return response.data;
        } catch (error) {
            console.error(`Error deleting user ${userId}:`, error.response?.data || error.message);
            throw error;
        }
    }

    //  Crear un nuevo usuario (para administradores) ***
     async createUser(userData) {
        try {
            // Ahora llama al nuevo endpoint de administración para crear usuarios
            const response = await axios.post(API_URL + '/create', userData); 
            return response.data;
        } catch (error) {
            console.error('Error durante la creación de usuario:', error.response?.data || error.message);
            throw error;
        }
    }
}


export default new UserService();