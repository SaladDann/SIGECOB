import { Prisma } from '@prisma/client';
import prisma from '../config/prisma.js';

import { hashPassword, comparePassword } from "../utils/password-utils.js";
import { generateToken } from "../utils/jwt-utils.js";
import { auditLog } from '../utils/audit-logger.js';

/**
 * Registra un nuevo usuario (cliente).
 * REQ-N7: Validación de Usuario (correo único)
 * Pantalla de Registro de Cliente
 * @param {object} req - Objeto de solicitud.
 * @param {object} res - Objeto de respuesta.
 */
export const registerUser = async (req, res) => {
    const { email, password, fullName, address, phone } = req.body;
    const ipAddress = req.ip; // Obtener la IP del cliente

    if (!email || !password || !fullName || !address) {
        return res.status(400).json({ message: 'Todos los campos obligatorios: email, password, fullName, address.' });
    }

    try {
        const existingUser = await prisma.user.findUnique({
            where: { email },
        });

        if (existingUser) {
            // Registrar intento de registro fallido por email duplicado
            await auditLog('REGISTER_FAILED_DUPLICATE_EMAIL', {
                details: { email, reason: 'Duplicate email' },
                ipAddress
            });
            return res.status(409).json({ message: 'El correo electrónico ya está registrado.' });
        }

        const hashedPassword = await hashPassword(password);

        const newUser = await prisma.user.create({
            data: {
                email,
                password: hashedPassword,
                fullName,
                address,
                phone, // Asegúrate de incluirlo si está en tu esquema
                role: 'Client',
                isActive: true,
            },
        });

        const token = generateToken({ id: newUser.id, role: newUser.role });

        // Crear carrito para el nuevo usuario
        await prisma.cart.create({
            data: {
                userId: newUser.id,
            }
        });

        // Registrar registro de usuario exitoso
        await auditLog('USER_REGISTERED', {
            userId: newUser.id,
            entity: 'User',
            entityId: newUser.id,
            details: { email: newUser.email, role: newUser.role },
            ipAddress
        });

        res.status(201).json({
            message: 'Registro exitoso.',
            user: {
                id: newUser.id,
                email: newUser.email,
                fullName: newUser.fullName,
                role: newUser.role,
            },
            token,
        });

    } catch (error) {
        console.error('Error al registrar usuario:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                // Este caso debería ser manejado por existingUser check, pero es un fallback
                await auditLog('REGISTER_FAILED_DB_CONSTRAINT', {
                    details: { email, error: error.message },
                    ipAddress
                });
                return res.status(409).json({ message: 'Ya existe un usuario con este correo.' });
            }
        }
        await auditLog('REGISTER_FAILED_INTERNAL_ERROR', {
            details: { email, error: error.message },
            ipAddress
        });
        res.status(500).json({ message: 'Error interno del servidor al registrar el usuario.' });
    }
};


/**
 * Inicia sesión de usuario.
 * @param {object} req - Objeto de solicitud.
 * @param {object} res - Objeto de respuesta.
 */
export const loginUser = async (req, res) => {
    const { email, password } = req.body;
    const ipAddress = req.ip; // Obtener la IP del cliente

    if (!email || !password) {
        return res.status(400).json({ message: 'Correo electrónico y contraseña son obligatorios.' });
    }

    try {
        const user = await prisma.user.findUnique({
            where: { email },
        });

        if (!user) {
            await auditLog('LOGIN_FAILED_USER_NOT_FOUND', { details: { email }, ipAddress });
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        if (!user.isActive) {
            await auditLog('LOGIN_FAILED_USER_INACTIVE', { userId: user.id, details: { email }, ipAddress });
            return res.status(403).json({ message: 'Tu cuenta está inactiva. Contacta al administrador.' });
        }

        const isPasswordValid = await comparePassword(password, user.password);

        if (!isPasswordValid) {
            await auditLog('LOGIN_FAILED_INVALID_PASSWORD', { userId: user.id, details: { email }, ipAddress });
            return res.status(401).json({ message: 'Credenciales inválidas.' });
        }

        const token = generateToken({ id: user.id, role: user.role });

        // Registrar inicio de sesión exitoso
        await auditLog('USER_LOGIN_SUCCESS', {
            userId: user.id,
            entity: 'User',
            entityId: user.id,
            details: { email: user.email, role: user.role },
            ipAddress
        });

        res.status(200).json({
            message: 'Inicio de sesión exitoso.',
            user: {
                id: user.id,
                email: user.email,
                fullName: user.fullName,
                role: user.role,
            },
            token,
        });

    } catch (error) {
        console.error('Error al iniciar sesión:', error);
        await auditLog('LOGIN_FAILED_INTERNAL_ERROR', {
            details: { email, error: error.message },
            ipAddress
        });
        res.status(500).json({ message: 'Error interno del servidor.' });
    }
};