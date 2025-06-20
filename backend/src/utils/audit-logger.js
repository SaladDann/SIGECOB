import prisma from '../config/prisma.js';

/**
 * Registra una acción en la tabla de auditoría.
 * @param {string} action - Descripción de la acción realizada (ej. 'LOGIN', 'PRODUCT_CREATED').
 * @param {object} options - Opciones adicionales para el log.
 * @param {number} [options.userId] - ID del usuario que realizó la acción.
 * @param {string} [options.entity] - Nombre de la entidad afectada (ej. 'User', 'Product').
 * @param {number} [options.entityId] - ID de la entidad afectada.
 * @param {object} [options.details] - Detalles adicionales en formato JSON (ej. cambios, datos del request).
 * @param {string} [options.ipAddress] - Dirección IP de la solicitud.
 */
export const auditLog = async (action, { userId, entity, entityId, details, ipAddress }) => {
    try {
        await prisma.auditLog.create({
            data: {
                userId: userId || null, // Puede ser null si es una acción del sistema o no hay usuario autenticado
                action: action,
                entity: entity || null,
                entityId: entityId || null,
                details: details ? JSON.stringify(details) : null, // Convertir a JSON string para guardar como Json? en Prisma
                ipAddress: ipAddress || null,
            },
        });
    } catch (error) {
        console.error('Error al registrar en el log de auditoría:', error);
        // No se relanza el error para no bloquear la operación principal
    }
};