import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/config.js';

/**
 * Genera un JSON Web Token (JWT).
 * @param {object} payload - Los datos a incluir en el token (ej. { id: user.id, role: user.role }).
 * @param {string} expiresIn - Tiempo de expiración (ej. '1h', '7d').
 * @returns {string} El token JWT.
 */
export const generateToken = (payload, expiresIn = '1h') => {
    return jwt.sign(payload, JWT_SECRET, { expiresIn });
};

/**
 * Verifica un JSON Web Token (JWT).
 * @param {string} token - El token JWT a verificar.
 * @returns {object|null} El payload del token si es válido, o null si no lo es.
 */
export const verifyToken = (token) => {
    try {
        return jwt.verify(token, JWT_SECRET);
    } catch (error) {
        console.error('Error al verificar token:', error.message);
        return null;
    }
};