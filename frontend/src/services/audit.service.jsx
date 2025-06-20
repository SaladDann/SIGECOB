// src/services/audit.service.js
import api from './api'; // Asegúrate de que tu instancia de Axios esté configurada aquí, o usa 'axios' directamente

const API_URL = `${import.meta.env.VITE_BACKEND_URL}/admin/audit`;

const auditService = {
    /**
     * Obtiene los logs de auditoría más recientes.
     * @returns {Promise<Array>} Una promesa que resuelve con un array de logs.
     */
    getRecentAuditLogs: async () => {
        try {
            const response = await api.get(API_URL + '/get');
            return response.data;
        } catch (error) {
            console.error('Error fetching recent audit logs:', error);
            throw error;
        }
    },

    /**
     * Busca logs de auditoría con filtros.
     * @param {object} filters - Objeto con los filtros (userId, action, entity, ipAddress, startDate, endDate).
     * @returns {Promise<Array>} Una promesa que resuelve con un array de logs filtrados.
     */
    searchAuditLogs: async (filters) => {
        try {
            // Construir los query params dinámicamente
            const queryParams = new URLSearchParams();
            if (filters.userId) queryParams.append('userId', filters.userId);
            if (filters.action) queryParams.append('action', filters.action);
            if (filters.entity) queryParams.append('entity', filters.entity);
            if (filters.ipAddress) queryParams.append('ipAddress', filters.ipAddress);
            if (filters.startDate) queryParams.append('startDate', filters.startDate);
            if (filters.endDate) queryParams.append('endDate', filters.endDate);

            const response = await api.get(API_URL + '/search', { params: queryParams });
            return response.data;
        } catch (error) {
            console.error('Error searching audit logs:', error);
            throw error;
        }
    }
};

export default auditService;