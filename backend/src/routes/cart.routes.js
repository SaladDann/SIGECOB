import { Router } from 'express';
import { authenticate } from '../middlewares/auth.middleware.js'; // Importa solo authenticate
import {
    getUserCart,
    addProductToCart,
    updateCartItemQuantity,
    removeProductFromCart,
    clearCart
} from '../controllers/cart.controller.js';

const router = Router();

// Todas las rutas de carrito requieren autenticación
router.use(authenticate);

router.get('/cart/get', getUserCart); // Obtener el carrito del usuario
router.post('/cart/items/add', addProductToCart); // Añadir un producto al carrito
router.put('/cart/items/update/:itemId', updateCartItemQuantity); // Actualizar cantidad de un ítem en el carrito
router.delete('/cart/items/remove/:itemId', removeProductFromCart); // Eliminar un ítem del carrito
router.delete('/cart/clear', clearCart); // Vaciar todo el carrito

export default router;