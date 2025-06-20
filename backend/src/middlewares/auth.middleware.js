import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config/config.js'; // Asegúrate de que JWT_SECRET se importa de tu archivo de configuración

/**
 * Middleware para autenticar al usuario.
 * @param {object} req - Objeto de solicitud.
 * @param {object} res - Objeto de respuesta.
 * @param {function} next - Siguiente función middleware.
 */
export const authenticate = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        return res.status(401).json({ message: 'No autenticado: Token no proporcionado o formato incorrecto.' });
    }

    const token = authHeader.split(' ')[1];

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Adjunta la información del usuario al objeto de solicitud
        next();
    } catch (error) {
        console.error('Error de autenticación:', error);
        return res.status(403).json({ message: 'No autorizado: Token inválido o expirado.' });
    }
};

/**
 * Middleware para autenticación opcional.
 * Intenta autenticar al usuario, pero permite que la solicitud continúe incluso si no hay token o es inválido.
 * @param {object} req - Objeto de solicitud.
 * @param {object} res - Objeto de respuesta.
 * @param {function} next - Siguiente función middleware.
 */
export const authenticateOptional = (req, res, next) => {
    const authHeader = req.headers.authorization;
    console.log('--- authenticateOptional START ---');
    console.log('Auth Header:', authHeader);

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
        console.log('No token or malformed token. Setting req.user = null and proceeding.');
        req.user = null; // No hay token, el usuario es anónimo
        return next(); // Continúa la ejecución sin error
    }

    const token = authHeader.split(' ')[1];
    console.log('Token found:', token ? token.substring(0, 10) + '...' : 'N/A'); // Log solo los primeros 10 caracteres del token

    try {
        const decoded = jwt.verify(token, JWT_SECRET);
        req.user = decoded; // Adjunta la información del usuario
        console.log('Token verified. User:', req.user.id, req.user.role);
        next();
    } catch (error) {
        // Si el token es inválido o expirado, tratamos al usuario como anónimo
        console.warn('Advertencia: Token opcional inválido o expirado. Procesando como usuario anónimo.');
        console.error('Error de verificación JWT en authenticateOptional:', error.message); // Log el mensaje de error específico
        req.user = null;
        next(); // Continúa la ejecución
    }
    console.log('--- authenticateOptional END ---');
};


/**
 * Middleware para autorizar roles específicos.
 * @param {Array<string>} roles - Array de roles permitidos (ej. ['Admin', 'User']).
 */
// Dentro de authorize:
export const authorize = (roles) => { // 'roles' aquí debería ser ['Admin', 'Auditor']
    return (req, res, next) => {
        console.log('--- AUTHORIZE START ---');
        console.log('User object from req.user (parsed from token):', req.user); // Debería mostrar { id: 3, role: 'Auditor', ... }
        if (req.user) {
            console.log('User role (from req.user):', req.user.role); // Debería mostrar 'Auditor'
        }
        console.log('Allowed roles for this specific route:', roles); // <--- ¡ESTO ES CRÍTICO! ¿Qué muestra 'roles' aquí?
                                                                  // Debería mostrar ['Admin', 'Auditor']

        if (!req.user || !req.user.role) {
            console.log('AUTHORIZE: No user or role info. Status 403.');
            return res.status(403).json({ message: 'Acceso denegado: No se encontró información de rol.' });
        }
        if (!roles.includes(req.user.role)) {
            // Aquí es donde debería fallar si el rol no está en el array 'roles'
            console.log(`AUTHORIZE: Role "<span class="math-inline">\{req\.user\.role\}" NOT in allowed roles\: \[</span>{roles.join(', ')}]. Status 403.`);
            return res.status(403).json({ message: `Acceso denegado: Se requiere uno de los siguientes roles: ${roles.join(', ')}.` });
        }
        console.log('AUTHORIZE: User role is allowed. Proceeding.');
        next();
    };
};