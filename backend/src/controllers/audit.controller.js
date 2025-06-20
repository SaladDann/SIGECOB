import prisma from '../config/prisma.js';

/**
 * Obtiene todos los logs de auditoría. (Solo administradores o auditores)
 * REQ-N8: Requerimientos de Auditoría
 * @param {object} req - Objeto de solicitud.
 * @param {object} res - Objeto de respuesta.
 */
export const getAuditLogs = async (req, res) => {
    try {
        const logs = await prisma.auditLog.findMany({
            include: {
                user: { // Incluir información del usuario asociado al log (si existe)
                    select: { id: true, email: true, fullName: true, role: true }
                }
            },
            orderBy: {
                timestamp: 'desc', // Los logs más recientes primero
            },
            take: 100 // Limitar a los últimos 100 logs para evitar sobrecarga (ajustar si es necesario)
        });
        res.status(200).json(logs);
    } catch (error) {
        console.error('Error al obtener logs de auditoría:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener los logs de auditoría.' });
    }
};

/**
 * Obtiene logs de auditoría filtrados por usuario, acción o entidad. (Opcional, para búsqueda)
 * @param {object} req - Objeto de solicitud (query params para filtros).
 * @param {object} res - Objeto de respuesta.
 */
export const searchAuditLogs = async (req, res) => {
    const { userId, action, entity, ipAddress, startDate, endDate } = req.query;

    const where = {};
    if (userId) where.userId = parseInt(userId);
    if (action) where.action = { contains: action }; // Búsqueda parcial por acción
    if (entity) where.entity = { equals: entity };   // Búsqueda exacta por entidad
    if (ipAddress) where.ipAddress = { contains: ipAddress };

    if (startDate || endDate) {
        where.timestamp = {};
        if (startDate) where.timestamp.gte = new Date(startDate);
        if (endDate) where.timestamp.lte = new Date(endDate);
    }

    try {
        const logs = await prisma.auditLog.findMany({
            where,
            include: {
                user: {
                    select: { id: true, email: true, fullName: true, role: true }
                }
            },
            orderBy: { timestamp: 'desc' },
            take: 200 // Limite de resultados para búsqueda
        });
        res.status(200).json(logs);
    } catch (error) {
        console.error('Error al buscar logs de auditoría:', error);
        res.status(500).json({ message: 'Error interno del servidor al buscar los logs de auditoría.' });
    }
};