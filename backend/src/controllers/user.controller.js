import prisma from '../config/prisma.js';
import { Prisma } from '@prisma/client';
import { auditLog } from '../utils/audit-logger.js';
import bcrypt from 'bcryptjs';

/**
 * Obtiene todos los usuarios. (Solo administradores)
 * @param {object} req - Objeto de solicitud.
 * @param {object} res - Objeto de respuesta.
 */
export const getAllUsers = async (req, res) => {
    const userId = req.user ? req.user.id : null;
    const ipAddress = req.ip;
    try {
        const users = await prisma.user.findMany({
            select: {
                id: true, email: true, fullName: true, address: true, phone: true,
                role: true, isActive: true, createdAt: true, updatedAt: true,
            },
            orderBy: { createdAt: 'asc' }
        });
        await auditLog('GET_ALL_USERS', { userId, ipAddress });
        res.status(200).json(users);
    } catch (error) {
        console.error('Error al obtener todos los usuarios:', error);
        await auditLog('GET_ALL_USERS_FAILED', { userId, details: { error: error.message }, ipAddress });
        res.status(500).json({ message: 'Error interno del servidor al obtener usuarios.' });
    }
};

/**
 * Obtiene un usuario por su ID. (Solo administradores)
 * @param {object} req - Objeto de solicitud.
 * @param {object} res - Objeto de respuesta.
 */
export const getUserById = async (req, res) => {
    const { id } = req.params;
    const userId = req.user ? req.user.id : null;
    const ipAddress = req.ip;

    try {
        const user = await prisma.user.findUnique({
            where: { id: parseInt(id) },
            select: {
                id: true, email: true, fullName: true, address: true, phone: true,
                role: true, isActive: true, createdAt: true, updatedAt: true,
            },
        });

        if (!user) {
            await auditLog('GET_USER_BY_ID_FAILED_NOT_FOUND', {
                userId, entity: 'User', entityId: parseInt(id), details: { reason: 'User not found' }, ipAddress
            });
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }
        await auditLog('GET_USER_BY_ID', { userId, entity: 'User', entityId: user.id, details: { email: user.email }, ipAddress });
        res.status(200).json(user);
    } catch (error) {
        console.error('Error al obtener usuario por ID:', error);
        await auditLog('GET_USER_BY_ID_FAILED_INTERNAL_ERROR', {
            userId, entity: 'User', entityId: parseInt(id), details: { error: error.message }, ipAddress
        });
        res.status(500).json({ message: 'Error interno del servidor al obtener el usuario.' });
    }
};

/**
 * Actualiza la información de un usuario, incluyendo su rol. (Solo administradores)
 * REQ-N2: El administrador podrá asignar roles a los usuarios
 * REQ-N5: Gestión de Roles de Usuario
 * @param {object} req - Objeto de solicitud.
 * @param {object} res - Objeto de respuesta.
 */
export const updateUser = async (req, res) => {
    const { id } = req.params;
    const { email, fullName, address, phone, role, isActive } = req.body;
    const adminUserId = req.user ? req.user.id : null; // ID del administrador que realiza la acción
    const ipAddress = req.ip;

    // Validar que el rol proporcionado sea uno de los roles permitidos en el enum
    const validRoles = ['Admin', 'Client', 'Auditor']; // Asegúrate de que estos coincidan con tu enum Role
    if (role && !validRoles.includes(role)) {
        await auditLog('USER_UPDATE_FAILED_INVALID_ROLE', {
            userId: adminUserId, entity: 'User', entityId: parseInt(id), details: { attemptedRole: role, reason: 'Invalid role' }, ipAddress
        });
        return res.status(400).json({ message: `El rol '${role}' no es válido. Los roles permitidos son: ${validRoles.join(', ')}.` });
    }

    try {
        const currentUser = await prisma.user.findUnique({ where: { id: parseInt(id) } });
        if (!currentUser) {
            await auditLog('USER_UPDATE_FAILED_NOT_FOUND', {
                userId: adminUserId, entity: 'User', entityId: parseInt(id), details: { reason: 'User not found' }, ipAddress
            });
            return res.status(404).json({ message: 'Usuario no encontrado.' });
        }

        // Registrar los cambios realizados
        const changes = {};
        if (email !== undefined && email !== currentUser.email) changes.email = { old: currentUser.email, new: email };
        if (fullName !== undefined && fullName !== currentUser.fullName) changes.fullName = { old: currentUser.fullName, new: fullName };
        if (address !== undefined && address !== currentUser.address) changes.address = { old: currentUser.address, new: address };
        if (phone !== undefined && phone !== currentUser.phone) changes.phone = { old: currentUser.phone, new: phone };
        if (role !== undefined && role !== currentUser.role) changes.role = { old: currentUser.role, new: role };
        if (isActive !== undefined && isActive !== currentUser.isActive) changes.isActive = { old: currentUser.isActive, new: isActive };

        const updatedUser = await prisma.user.update({
            where: { id: parseInt(id) },
            data: {
                email,
                fullName,
                address,
                phone,
                role,
                isActive,
            },
            select: {
                id: true, email: true, fullName: true, address: true, phone: true,
                role: true, isActive: true, updatedAt: true,
            },
        });

        await auditLog('USER_UPDATED', {
            userId: adminUserId, entity: 'User', entityId: updatedUser.id, details: { changes }, ipAddress
        });

        res.status(200).json({ message: 'Usuario actualizado exitosamente.', user: updatedUser });
    } catch (error) {
        console.error('Error al actualizar usuario:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                await auditLog('USER_UPDATE_FAILED_DUPLICATE_EMAIL', {
                    userId: adminUserId, entity: 'User', entityId: parseInt(id), details: { email, error: error.message }, ipAddress
                });
                return res.status(409).json({ message: 'El correo electrónico ya está registrado por otro usuario.' });
            }
            if (error.code === 'P2025') {
                await auditLog('USER_UPDATE_FAILED_NOT_FOUND', {
                    userId: adminUserId, entity: 'User', entityId: parseInt(id), details: { error: error.message }, ipAddress
                });
                return res.status(404).json({ message: 'Usuario no encontrado para actualizar.' });
            }
        }
        await auditLog('USER_UPDATE_FAILED_INTERNAL_ERROR', {
            userId: adminUserId, entity: 'User', entityId: parseInt(id), details: { error: error.message }, ipAddress
        });
        res.status(500).json({ message: 'Error interno del servidor al actualizar el usuario.' });
    }
};

/**
 * Elimina un usuario. (Solo administradores)
 * NOTA: Considerar desactivar usuarios en lugar de eliminarlos para mantener la integridad referencial.
 * @param {object} req - Objeto de solicitud.
 * @param {object} res - Objeto de respuesta.
 */
export const deleteUser = async (req, res) => {
    const { id } = req.params;
    const adminUserId = req.user ? req.user.id : null;
    const ipAddress = req.ip;

    try {
        // Verificar si el usuario tiene relaciones críticas antes de eliminarlo
        const userToDelete = await prisma.user.findUnique({
            where: { id: parseInt(id) },
            include: { carts: true, orders: true, payments: true }
        });

        if (!userToDelete) {
            await auditLog('USER_DELETE_FAILED_NOT_FOUND', {
                userId: adminUserId, entity: 'User', entityId: parseInt(id), details: { reason: 'User not found' }, ipAddress
            });
            return res.status(404).json({ message: 'Usuario no encontrado para eliminar.' });
        }

        if (userToDelete.carts.length > 0 || userToDelete.orders.length > 0 || userToDelete.payments.length > 0) {
            await auditLog('USER_DELETE_FAILED_REFERENCED', {
                userId: adminUserId, entity: 'User', entityId: parseInt(id), details: { reason: 'User has associated data' }, ipAddress
            });
            return res.status(409).json({ message: 'No se puede eliminar el usuario porque tiene carritos, órdenes o pagos asociados. Considere desactivarlo (`isActive: false`) en su lugar.' });
        }

        await prisma.user.delete({
            where: { id: parseInt(id) },
        });

        await auditLog('USER_DELETED', {
            userId: adminUserId, entity: 'User', entityId: parseInt(id), details: { email: userToDelete.email }, ipAddress
        });
        res.status(200).json({ message: 'Usuario eliminado exitosamente.' });

    } catch (error) {
        console.error('Error al eliminar usuario:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                await auditLog('USER_DELETE_FAILED_NOT_FOUND_DB', {
                    userId: adminUserId, entity: 'User', entityId: parseInt(id), details: { error: error.message }, ipAddress
                });
                return res.status(404).json({ message: 'Usuario no encontrado para eliminar.' });
            }
            if (error.code === 'P2003') { // ForeignKeyConstraintViolation, aunque ya lo manejamos con el check previo
                await auditLog('USER_DELETE_FAILED_DB_CONSTRAINT', {
                    userId: adminUserId, entity: 'User', entityId: parseInt(id), details: { error: error.message }, ipAddress
                });
                return res.status(409).json({ message: 'No se puede eliminar el usuario debido a referencias existentes en la base de datos.' });
            }
        }
        await auditLog('USER_DELETE_FAILED_INTERNAL_ERROR', {
            userId: adminUserId, entity: 'User', entityId: parseInt(id), details: { error: error.message }, ipAddress
        });
        res.status(500).json({ message: 'Error interno del servidor al eliminar el usuario.' });
    }
};

/**
 * Crea un nuevo usuario. (Solo administradores)
 * Permite al administrador asignar rol y estado de actividad.
 * REQ-N2: El administrador podrá asignar roles a los usuarios
 * @param {object} req - Objeto de solicitud.
 * @param {object} res - Objeto de respuesta.
 */
export const createUserByAdmin = async (req, res) => {
    const { fullName, email, password, address, phone, role, isActive } = req.body;
    const adminUserId = req.user ? req.user.id : null; // ID del administrador que realiza la acción
    const ipAddress = req.ip;

    // Validar datos obligatorios
    if (!fullName || !email || !password) {
        await auditLog('ADMIN_CREATE_USER_FAILED_MISSING_DATA', {
            userId: adminUserId, details: { reason: 'Missing required fields' }, ipAddress
        });
        return res.status(400).json({ message: 'Nombre completo, email y contraseña son obligatorios.' });
    }

    // Validar que el rol proporcionado sea uno de los roles permitidos en el enum
    // Asegúrate de que estos roles coincidan con tu enum 'Role' en Prisma
    const validRoles = ['Admin', 'Client', 'Auditor']; 
    if (role && !validRoles.includes(role)) {
        await auditLog('ADMIN_CREATE_USER_FAILED_INVALID_ROLE', {
            userId: adminUserId, details: { attemptedRole: role, reason: 'Invalid role' }, ipAddress
        });
        return res.status(400).json({ message: `El rol '${role}' no es válido. Los roles permitidos son: ${validRoles.join(', ')}.` });
    }

    try {
        // Hashear la contraseña antes de guardarla
        const hashedPassword = await bcrypt.hash(password, 10);

        // Crear el usuario en la base de datos
        const newUser = await prisma.user.create({
            data: {
                fullName,
                email,
                password: hashedPassword, // Guardar la contraseña hasheada
                address: address || null, // Guardar como null si no se proporciona
                phone: phone || null,     // Guardar como null si no se proporciona
                role: role || 'Client',   // Asignar el rol proporcionado, por defecto 'Client'
                isActive: isActive !== undefined ? isActive : true, // Usar el valor proporcionado, por defecto true
            },
            select: { // Seleccionar solo los campos que quieres devolver
                id: true, email: true, fullName: true, address: true, phone: true,
                role: true, isActive: true, createdAt: true, updatedAt: true,
            },
        });

        // Registrar la acción de auditoría
        await auditLog('ADMIN_CREATED_USER', {
            userId: adminUserId, entity: 'User', entityId: newUser.id, details: { email: newUser.email, role: newUser.role, isActive: newUser.isActive }, ipAddress
        });

        res.status(201).json({ message: 'Usuario creado exitosamente.', user: newUser });
    } catch (error) {
        console.error('Error al crear usuario por administrador:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') { // Error de restricción única (ej. email duplicado)
                await auditLog('ADMIN_CREATE_USER_FAILED_DUPLICATE_EMAIL', {
                    userId: adminUserId, details: { email, error: error.message }, ipAddress
                });
                return res.status(409).json({ message: 'El correo electrónico ya está registrado.' });
            }
        }
        await auditLog('ADMIN_CREATE_USER_FAILED_INTERNAL_ERROR', {
            userId: adminUserId, details: { error: error.message, email }, ipAddress
        });
        res.status(500).json({ message: 'Error interno del servidor al crear el usuario.' });
    }
};