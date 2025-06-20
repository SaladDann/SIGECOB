// src/routes/order.routes.js
import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js'; // Solo se necesita autenticación
import {
    createOrderAndProcessPayment,
    getUserOrders,
    getAllOrders,
    getOrderById,
    updateOrderStatus 
} from '../controllers/order.controller.js';

const router = Router();

// Todas las rutas de órdenes requieren autenticación
router.use(authenticate);

// Rutas para clientes (requieren solo autenticación)
router.post('/orders/create', createOrderAndProcessPayment); // Crear una nueva orden y procesar pago
router.get('/orders/history', getUserOrders); // Obtener el historial de órdenes del usuario
router.get('/orders/:id', getOrderById);

// Rutas para administradores (requieren autenticación y rol Admin)
router.get('/admin/orders',  authorize(['Admin']), getAllOrders);           // Obtener todas las órdenes
router.get('/admin/orders/:id', authorize(['Admin']), getOrderById);       // Obtener una orden por ID
router.put('/admin/orders/:id/status', authorize(['Admin']), updateOrderStatus); // Actualizar estado de una orden

export default router;