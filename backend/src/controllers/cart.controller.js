import { Prisma } from '@prisma/client';
import prisma from '../config/prisma.js';

/**
 * Obtiene el carrito de compras del usuario autenticado.
 * REQ-N3: Transacciones de Pago (implica ver el carrito antes)
 * Pantalla de Carrito de Compras
 * @param {object} req - Objeto de solicitud, debe contener req.user (del middleware de autenticación).
 * @param {object} res - Objeto de respuesta.
 */
export const getUserCart = async (req, res) => {
    const userId = req.user.id; // Obtenido del token JWT a través del middleware de autenticación

    try {
        const cart = await prisma.cart.findUnique({
            where: { userId },
            include: {
                items: {
                    include: {
                        product: true, // Incluir los detalles completos del producto
                    },
                },
            },
        });

        if (!cart) {
            // Esto no debería suceder si creamos un carrito al registrar el usuario,
            // pero es una buena práctica manejar el caso.
            return res.status(404).json({ message: 'Carrito no encontrado para este usuario.' });
        }

        res.status(200).json(cart);
    } catch (error) {
        console.error('Error al obtener el carrito del usuario:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener el carrito.' });
    }
};

/**
 * Añade un producto al carrito del usuario o actualiza su cantidad si ya existe.
 * REQ-N4: Control de Inventario por Usuario (límite de 10 unidades por producto)
 * @param {object} req - Objeto de solicitud.
 * @param {object} res - Objeto de respuesta.
 */
export const addProductToCart = async (req, res) => {
    const userId = req.user.id;
    const { productId, quantity = 1 } = req.body; // Cantidad por defecto es 1

    if (!productId || quantity <= 0) {
        return res.status(400).json({ message: 'ID de producto y cantidad válidos son obligatorios.' });
    }
    if (quantity > 10) { // REQ-N4: Límite de 10 unidades por producto
        return res.status(400).json({ message: 'No puedes añadir más de 10 unidades del mismo producto al carrito.' });
    }

    try {
        const product = await prisma.product.findUnique({
            where: { id: productId },
        });

        if (!product || product.status === 'Out_of_Stock' || product.stock < quantity) {
            return res.status(400).json({ message: 'Producto no disponible o stock insuficiente.' });
        }

        let cart = await prisma.cart.findUnique({
            where: { userId },
        });

        if (!cart) {
            // Si por alguna razón el carrito no existe, lo creamos (aunque debería existir al registrarse).
            cart = await prisma.cart.create({ data: { userId } });
        }

        const existingCartItem = await prisma.cartItem.findUnique({
            where: {
                cartId_productId: { // Clave compuesta definida en el schema.prisma
                    cartId: cart.id,
                    productId: productId,
                },
            },
        });

        let updatedCartItem;
        if (existingCartItem) {
            // Si el producto ya está en el carrito, actualiza la cantidad
            const newQuantity = existingCartItem.quantity + quantity;
            if (newQuantity > 10) { // REQ-N4: No exceder 10 unidades
                return res.status(400).json({ message: `Solo puedes tener un máximo de 10 unidades de ${product.name} en el carrito.` });
            }
            if (product.stock < newQuantity) { // Verificar stock disponible para la nueva cantidad total
                return res.status(400).json({ message: `Stock insuficiente para añadir ${quantity} unidades más. Solo hay ${product.stock - existingCartItem.quantity} disponibles.` });
            }

            updatedCartItem = await prisma.cartItem.update({
                where: { id: existingCartItem.id },
                data: { quantity: newQuantity },
                include: { product: true }
            });
        } else {
            // Si el producto no está en el carrito, lo añade
            updatedCartItem = await prisma.cartItem.create({
                data: {
                    cartId: cart.id,
                    productId: productId,
                    quantity: quantity,
                    price: product.price, // Guardar el precio del producto al momento de añadirlo
                },
                include: { product: true }
            });
        }

        res.status(200).json({ message: 'Producto añadido/actualizado en el carrito.', item: updatedCartItem });

    } catch (error) {
        console.error('Error al añadir producto al carrito:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            // Por ejemplo, si el productId no existe
            if (error.code === 'P2025') {
                return res.status(404).json({ message: 'Producto no encontrado.' });
            }
        }
        res.status(500).json({ message: 'Error interno del servidor al añadir producto al carrito.' });
    }
};

/**
 * Actualiza la cantidad de un producto específico en el carrito.
 * REQ-N4: Control de Inventario por Usuario (límite de 10 unidades)
 * @param {object} req - Objeto de solicitud.
 * @param {object} res - Objeto de respuesta.
 */
export const updateCartItemQuantity = async (req, res) => {
    const userId = req.user.id;
    const { itemId } = req.params; // ID del CartItem
    const { quantity } = req.body;

    if (!itemId || !quantity || quantity <= 0) {
        return res.status(400).json({ message: 'ID del ítem del carrito y cantidad válidos son obligatorios.' });
    }
    if (quantity > 10) { // REQ-N4: Límite de 10 unidades por producto
        return res.status(400).json({ message: 'No puedes tener más de 10 unidades del mismo producto en el carrito.' });
    }

    try {
        const cart = await prisma.cart.findUnique({
            where: { userId },
        });

        if (!cart) {
            return res.status(404).json({ message: 'Carrito no encontrado.' });
        }

        const cartItem = await prisma.cartItem.findUnique({
            where: { id: parseInt(itemId) },
            include: { product: true },
        });

        if (!cartItem || cartItem.cartId !== cart.id) {
            return res.status(404).json({ message: 'Ítem del carrito no encontrado o no pertenece a este usuario.' });
        }

        // Verificar el stock disponible para la nueva cantidad
        if (cartItem.product.stock < quantity) {
            return res.status(400).json({ message: `Stock insuficiente para la cantidad solicitada. Solo hay ${cartItem.product.stock} disponibles.` });
        }

        const updatedCartItem = await prisma.cartItem.update({
            where: { id: parseInt(itemId) },
            data: { quantity: quantity },
            include: { product: true }
        });

        res.status(200).json({ message: 'Cantidad del producto en el carrito actualizada.', item: updatedCartItem });

    } catch (error) {
        console.error('Error al actualizar la cantidad del carrito:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                return res.status(404).json({ message: 'Ítem del carrito no encontrado para actualizar.' });
            }
        }
        res.status(500).json({ message: 'Error interno del servidor al actualizar la cantidad del carrito.' });
    }
};

/**
 * Elimina un producto específico del carrito.
 * @param {object} req - Objeto de solicitud.
 * @param {object} res - Objeto de respuesta.
 */
export const removeProductFromCart = async (req, res) => {
    const userId = req.user.id;
    const { itemId } = req.params; // ID del CartItem a eliminar

    try {
        const cart = await prisma.cart.findUnique({
            where: { userId },
        });

        if (!cart) {
            return res.status(404).json({ message: 'Carrito no encontrado.' });
        }

        const cartItem = await prisma.cartItem.findUnique({
            where: { id: parseInt(itemId) },
        });

        if (!cartItem || cartItem.cartId !== cart.id) {
            return res.status(404).json({ message: 'Ítem del carrito no encontrado o no pertenece a este usuario.' });
        }

        await prisma.cartItem.delete({
            where: { id: parseInt(itemId) },
        });

        res.status(200).json({ message: 'Producto eliminado del carrito exitosamente.' });

    } catch (error) {
        console.error('Error al eliminar producto del carrito:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                return res.status(404).json({ message: 'Ítem del carrito no encontrado para eliminar.' });
            }
        }
        res.status(500).json({ message: 'Error interno del servidor al eliminar el producto del carrito.' });
    }
};

/**
 * Vacía completamente el carrito del usuario. (Opcional, pero útil)
 * @param {object} req - Objeto de solicitud.
 * @param {object} res - Objeto de respuesta.
 */
export const clearCart = async (req, res) => {
    const userId = req.user.id;

    try {
        const cart = await prisma.cart.findUnique({
            where: { userId },
        });

        if (!cart) {
            return res.status(404).json({ message: 'Carrito no encontrado.' });
        }

        // Eliminar todos los CartItems asociados a este carrito
        await prisma.cartItem.deleteMany({
            where: { cartId: cart.id },
        });

        res.status(200).json({ message: 'Carrito vaciado exitosamente.' });
    } catch (error) {
        console.error('Error al vaciar el carrito:', error);
        res.status(500).json({ message: 'Error interno del servidor al vaciar el carrito.' });
    }
};