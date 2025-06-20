import bcrypt from 'bcryptjs';
const SALT_ROUNDS = 10; // Número de rondas de "salto" para el hashing

/**
 * Hashea una contraseña.
 * @param {string} password - La contraseña en texto plano.
 * @returns {Promise<string>} La contraseña hasheada.
 */
export const hashPassword = async (password) => {
    try {
        return await bcrypt.hash(password, SALT_ROUNDS);
    } catch (error) {
        throw new Error('Error al encriptar la contraseña');
    }
};

/**
 * Compara una contraseña en texto plano con su versión hasheada.
 * @param {string} password - La contraseña en texto plano.
 * @param {string} hashedPassword - La contraseña hasheada almacenada.
 * @returns {Promise<boolean>} True si coinciden, False en caso contrario.
 */
export const comparePassword = async (password, hashedPassword) => {
    try {
        return await bcrypt.compare(password, hashedPassword);
    } catch (error) {
        throw new Error('Error al comparar las contraseñas');
    }
};