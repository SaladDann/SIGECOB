// backend/src/controllers/order.controller.js

import prisma from '../config/prisma.js';
import { Prisma } from '@prisma/client';
import { auditLog } from '../utils/audit-logger.js';
import { sendEmail } from '../utils/email-sender.js';

// --- Definiciones de Enums (DEBEN COINCIDIR EXACTAMENTE CON EL ESQUEMA DE PRISMA) ---
// Estado de una orden
export const OrderStatus = {
    Pending: 'Pending',         // Orden creada, pago pendiente
    Processing: 'Processing',   // Pago confirmado, orden en preparación
    Shipped: 'Shipped',         // Orden enviada
    Delivered: 'Delivered',     // Orden entregada
    Cancelled: 'Cancelled',     // Orden cancelada
};

// Estado de una transacción de pago
export const PaymentStatus = {
    Pending: 'Pending',       // Pago iniciado, esperando confirmación
    Confirmed: 'Confirmed',   // Pago exitoso
    Cancelled: 'Cancelled',   // Pago cancelado o no confirmado a tiempo
    Refunded: 'Refunded'      // Pago reembolsado
};

/**
 * Crea una nueva orden a partir del carrito de compras del usuario y simula el pago.
 * REQ-N3: Transacciones de Pago (implica creación de orden y pago)
 * REQ-N6: Registro de Compras (genera orden)
 * @param {object} req - Objeto de solicitud, debe contener req.user (del middleware de autenticación).
 * @param {object} res - Objeto de respuesta.
 */
export const createOrderAndProcessPayment = async (req, res) => {
    const userId = req.user.id;
    const { shippingAddress, paymentMethod } = req.body; // paymentMethod podría ser 'CreditCard', 'PayPal', etc.

    const ipAddress = req.ip || req.connection.remoteAddress;

    // Validación básica de los campos requeridos
    if (!shippingAddress || !paymentMethod) {
        await auditLog('ORDER_CREATION_FAILED', {
            userId: userId,
            details: { error: 'Dirección de envío o método de pago obligatorios', requestBody: req.body },
            ipAddress
        });
        return res.status(400).json({ message: 'La dirección de envío y el método de pago son obligatorios.' });
    }

    try {
        // 1. Obtener el carrito del usuario con sus ítems y detalles del producto
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

        // Verificar si el carrito existe y no está vacío
        if (!cart || cart.items.length === 0) {
            await auditLog('ORDER_CREATION_FAILED', {
                userId: userId,
                details: { error: 'El carrito está vacío', cartId: cart ? cart.id : 'N/A' },
                ipAddress
            });
            return res.status(400).json({ message: 'El carrito está vacío. No se puede crear una orden.' });
        }

        let totalAmount = 0;
        // 2. Pre-verificar stock y calcular el total de la orden
        for (const item of cart.items) {
            if (item.product.stock < item.quantity) {
                await auditLog('ORDER_CREATION_FAILED', {
                    userId: userId,
                    details: { error: `Stock insuficiente para ${item.product.name}`, productId: item.productId, availableStock: item.product.stock, requestedQuantity: item.quantity },
                    ipAddress
                });
                return res.status(400).json({ message: `Stock insuficiente para ${item.product.name}. Solo hay ${item.product.stock} unidades disponibles.` });
            }
            totalAmount += item.quantity * item.price;
        }

        // --- Iniciar una **transacción de base de datos** ---
        const transactionResult = await prisma.$transaction(async (prismaTransaction) => {
            // 3. Crear la **Orden**
            const order = await prismaTransaction.order.create({
                data: {
                    userId: userId,
                    totalAmount: totalAmount,
                    shippingAddress: shippingAddress,
                    orderStatus: OrderStatus.Pending, // Estado inicial de la orden
                },
            });

            // 4. Mover los ítems del carrito a **OrderItems** y **actualizar el stock**
            const orderItemsData = cart.items.map(item => ({
                orderId: order.id,
                productId: item.productId,
                quantity: item.quantity,
                price: item.price,
            }));

            await prismaTransaction.orderItem.createMany({
                data: orderItemsData,
            });

            for (const item of cart.items) {
                await prismaTransaction.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: {
                            decrement: item.quantity,
                        },
                        status: item.product.stock - item.quantity === 0 ? 'Out_of_Stock' : 'Available',
                    },
                });
            }

            // 5. Simular el proceso de **pago**
            const payment = await prismaTransaction.payment.create({
                data: {
                    userId: userId,
                    orderId: order.id,
                    amount: totalAmount,
                    paymentMethod: paymentMethod,
                    transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`,
                    paymentStatus: PaymentStatus.Pending, // Estado inicial del pago
                    paidAt: new Date(),
                },
            });

            // 6. Actualizar la orden con el ID del pago y su estado final
            const updatedOrder = await prismaTransaction.order.update({
                where: { id: order.id },
                data: {
                    paymentId: payment.id,
                    orderStatus: OrderStatus.Processing, // Cambiar a 'Processing' después del pago simulado
                },
                include: {
                    items: {
                        include: {
                            product: true
                        }
                    },
                    payment: true
                }
            });

            // 7. Vaciar el carrito después de una compra exitosa
            await prismaTransaction.cartItem.deleteMany({
                where: { cartId: cart.id },
            });

            return { updatedOrder, payment };
        });

        const { updatedOrder: finalOrder, payment: finalPayment } = transactionResult;

        await auditLog('ORDER_CREATED_AND_PAYMENT_PROCESSED', {
            userId: userId,
            entity: 'Order',
            entityId: finalOrder.id,
            details: { totalAmount, paymentStatus: finalPayment.paymentStatus },
            ipAddress
        });

        const customer = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, fullName: true, address: true }
        });

        if (customer && customer.email) {
            const orderDetailsHtml = `
                <p>Hola ${customer.fullName || customer.email},</p>
                <p>¡Gracias por tu compra! Tu orden <strong>#${finalOrder.id}</strong> ha sido recibida y está siendo procesada.</p>
                <p><strong>Detalles de tu orden:</strong></p>
                <ul>
                    ${cart.items.map(item => `<li>${item.quantity} x ${item.product.name} - $${item.price.toFixed(2)} c/u</li>`).join('')}
                </ul>
                <p><strong>Monto Total:</strong> $${finalOrder.totalAmount.toFixed(2)}</p>
                <p><strong>Dirección de Envío:</strong> ${finalOrder.shippingAddress}</p>
                <p>Te notificaremos cuando el estado de tu orden cambie.</p>
                <p>Saludos,</p>
                <p>El equipo de SIGECOB</p>
            `;
            await sendEmail(
                customer.email,
                `Confirmación de tu Orden #${finalOrder.id} - SIGECOB`,
                `Gracias por tu compra. Tu orden #${finalOrder.id} ha sido recibida. Monto Total: $${finalOrder.totalAmount.toFixed(2)}.`,
                orderDetailsHtml
            );
        }

        res.status(201).json({
            message: 'Orden creada y pago procesado exitosamente.',
            order: {
                id: finalOrder.id,
                totalAmount: finalOrder.totalAmount,
                orderStatus: finalOrder.orderStatus,
                shippingAddress: finalOrder.shippingAddress,
            },
            payment: {
                id: finalPayment.id,
                paymentStatus: finalPayment.paymentStatus,
                transactionId: finalPayment.transactionId,
            },
        });

    } catch (error) {
        console.error('Error al crear orden o procesar pago:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                return res.status(409).json({ message: 'Conflicto de datos. Ya existe un registro con estos valores únicos.' });
            }
            if (error.code === 'P2025') {
                return res.status(404).json({ message: 'Recurso no encontrado. Verifique IDs de productos o carrito.' });
            }
            return res.status(500).json({ message: `Error en la base de datos: ${error.message}` });
        }
        
        await auditLog('ORDER_CREATION_FAILED', {
            userId: userId,
            details: { error: error.message, stack: error.stack, requestBody: req.body },
            ipAddress
        });
        res.status(500).json({ message: 'Error interno del servidor al procesar la orden o el pago.' });
    }
};

/**
 * Obtiene el historial de órdenes del usuario autenticado.
 * @param {object} req - Objeto de solicitud.
 * @param {object} res - Objeto de respuesta.
 */
export const getUserOrders = async (req, res) => {
    const userId = req.user.id;

    try {
        const orders = await prisma.order.findMany({
            where: { userId },
            include: {
                items: {
                    include: {
                        product: true,
                    },
                },
                payment: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        const ordersForFrontend = orders.map(order => ({
            ...order,
            totalAmount: parseFloat(order.totalAmount || 0), 
            items: order.items.map(item => ({
                ...item,
                price: parseFloat(item.price || 0), 
                product: {
                    ...item.product,
                    price: parseFloat(item.product.price || 0) 
                }
            })),
            payment: order.payment ? {
                ...order.payment,
                amount: parseFloat(order.payment.amount || 0)
            } : null
        }));

        res.status(200).json(ordersForFrontend);
    } catch (error) {
        console.error('Error al obtener el historial de órdenes:', error);
        res.status(500).json({ message: 'Error interno del servidor al obtener el historial de órdenes.' });
    }
};

/**
 * Obtiene todas las órdenes del sistema. (Solo administradores)
 * @param {object} req - Objeto de solicitud.
 * @param {object} res - Objeto de respuesta.
 */
export const getAllOrders = async (req, res) => {
    const userId = req.user ? req.user.id : null;
    const ipAddress = req.ip; 
    const { status } = req.query; // Obtener el parámetro de consulta 'status'

    try {
        const whereClause = status && status !== 'Todos' ? { orderStatus: status } : {};

        const orders = await prisma.order.findMany({
            where: whereClause, // Aplicar el filtro si existe
            include: {
                user: { 
                    select: { id: true, email: true, fullName: true }
                },
                items: {
                    include: {
                        product: true,
                    },
                },
                payment: true,
            },
            orderBy: {
                createdAt: 'desc',
            },
        });

        const ordersForFrontend = orders.map(order => ({
            ...order,
            totalAmount: parseFloat(order.totalAmount || 0),
            items: order.items.map(item => ({
                ...item,
                price: parseFloat(item.price || 0),
                product: {
                    ...item.product,
                    price: parseFloat(item.product.price || 0)
                }
            })),
            payment: order.payment ? {
                ...order.payment,
                amount: parseFloat(order.payment.amount || 0)
            } : null
        }));

        await auditLog('GET_ALL_ORDERS', { userId, ipAddress, filterStatus: status || 'Todos' });
        res.status(200).json(ordersForFrontend);
    } catch (error) {
        console.error('Error al obtener todas las órdenes:', error);
        await auditLog('GET_ALL_ORDERS_FAILED', { userId, details: { error: error.message }, ipAddress });
        res.status(500).json({ message: 'Error interno del servidor al obtener las órdenes.' });
    }
};

/**
 * Obtiene una orden específica por su ID. (Solo administradores o dueño de la orden)
 * @param {object} req - Objeto de solicitud.
 * @param {object} res - Objeto de respuesta.
 */
export const getOrderById = async (req, res) => {
    const { id } = req.params;
    const requestingUserId = req.user ? req.user.id : null;
    const requestingUserRole = req.user ? req.user.role : null; 
    const ipAddress = req.ip;

    try {
        const order = await prisma.order.findUnique({
            where: { id: parseInt(id) },
            include: {
                user: { select: { id: true, email: true, fullName: true } },
                items: { include: { product: true } },
                payment: true,
            },
        });

        if (!order) {
            await auditLog('GET_ORDER_BY_ID_FAILED_NOT_FOUND', { 
                userId: requestingUserId, 
                entity: 'Order', 
                entityId: parseInt(id), 
                details: { error: 'Order not found' }, 
                ipAddress 
            });
            return res.status(404).json({ message: 'Orden no encontrada.' });
        }

        if (requestingUserRole !== 'Admin' && order.userId !== requestingUserId) {
            await auditLog('GET_ORDER_BY_ID_UNAUTHORIZED', { 
                userId: requestingUserId, 
                entity: 'Order', 
                entityId: parseInt(id), 
                details: { error: 'Unauthorized access attempt' }, 
                ipAddress 
            });
            return res.status(403).json({ message: 'No tienes permiso para ver esta orden.' });
        }
        
        const orderForFrontend = {
            ...order,
            totalAmount: parseFloat(order.totalAmount || 0),
            items: order.items.map(item => ({
                ...item,
                price: parseFloat(item.price || 0),
                product: {
                    ...item.product,
                    price: parseFloat(item.product.price || 0)
                }
            })),
            payment: order.payment ? {
                ...order.payment,
                amount: parseFloat(order.payment.amount || 0)
            } : null
        };
        
        await auditLog('GET_ORDER_BY_ID_SUCCESS', { 
            userId: requestingUserId, 
            entity: 'Order', 
            entityId: parseInt(id), 
            details: { status: order.orderStatus }, 
            ipAddress 
        });
        res.status(200).json(orderForFrontend);
    } catch (error) {
        console.error('Error al obtener la orden por ID:', error);
        await auditLog('GET_ORDER_BY_ID_FAILED_INTERNAL_ERROR', { 
            userId: requestingUserId, 
            entity: 'Order', 
            entityId: parseInt(id), 
            details: { error: error.message }, 
            ipAddress 
        });
        res.status(500).json({ message: 'Error interno del servidor al obtener la orden.' });
    }
};

/**
 * Actualiza el estado de una orden y/o el estado de su pago. (Solo administradores)
 * @param {object} req - Objeto de solicitud.
 * @param {object} res - Objeto de respuesta.
 */
export const updateOrderStatus = async (req, res) => {
    const { id } = req.params;
    // Ahora esperamos ambos, orderStatus y paymentStatus
    const { orderStatus, paymentStatus } = req.body;
    const adminUserId = req.user.id;
    const ipAddress = req.ip;

    try {
        const currentOrder = await prisma.order.findUnique({
            where: { id: parseInt(id) },
            include: { payment: true, user: { select: { id: true, email: true, fullName: true } } }, // Incluir usuario para correo
        });

        if (!currentOrder) {
            await auditLog('ORDER_UPDATE_STATUS_FAILED_NOT_FOUND', {
                userId: adminUserId, 
                entity: 'Order', 
                entityId: parseInt(id), 
                details: { error: 'Order not found for update' }, 
                ipAddress
            });
            return res.status(404).json({ message: 'Orden no encontrada para actualizar.' });
        }

        const updateData = {}; // Objeto para construir las actualizaciones
        const auditDetails = {}; // Objeto para construir los detalles del log de auditoría

        // Validar y añadir orderStatus a updateData si ha cambiado
        if (orderStatus && orderStatus !== currentOrder.orderStatus) {
            const validOrderStatuses = Object.values(OrderStatus);
            if (!validOrderStatuses.includes(orderStatus)) {
                await auditLog('ORDER_UPDATE_STATUS_FAILED_INVALID', {
                    userId: adminUserId, 
                    entity: 'Order', 
                    entityId: parseInt(id), 
                    details: { error: `Invalid order status provided: ${orderStatus}` }, 
                    ipAddress
                });
                return res.status(400).json({ message: 'Estado de orden inválido.' });
            }
            updateData.orderStatus = orderStatus;
            auditDetails.oldOrderStatus = currentOrder.orderStatus;
            auditDetails.newOrderStatus = orderStatus;
        }

        // Validar y añadir paymentStatus a updateData si ha cambiado y existe un pago
        if (paymentStatus && currentOrder.payment && paymentStatus !== currentOrder.payment.paymentStatus) {
            const validPaymentStatuses = Object.values(PaymentStatus);
            if (!validPaymentStatuses.includes(paymentStatus)) {
                await auditLog('PAYMENT_UPDATE_STATUS_FAILED_INVALID', {
                    userId: adminUserId, 
                    entity: 'Payment', 
                    entityId: currentOrder.payment.id, 
                    details: { error: `Invalid payment status provided: ${paymentStatus}` }, 
                    ipAddress
                });
                return res.status(400).json({ message: 'Estado de pago inválido.' });
            }
            // Para actualizar un campo anidado como paymentStatus, usamos la sintaxis 'update'
            updateData.payment = {
                update: {
                    paymentStatus: paymentStatus,
                }
            };
            auditDetails.oldPaymentStatus = currentOrder.payment.paymentStatus;
            auditDetails.newPaymentStatus = paymentStatus;
        }

        // Si no hay cambios en orderStatus ni paymentStatus, retornar sin hacer nada
        if (Object.keys(updateData).length === 0) {
            return res.status(200).json({ message: 'No hay cambios para aplicar.', order: currentOrder });
        }

        // Realizar la actualización
        const updatedOrder = await prisma.order.update({
            where: { id: parseInt(id) },
            data: updateData, // Usa el objeto updateData construido dinámicamente
            include: {
                user: { select: { id: true, email: true, fullName: true } },
                items: { include: { product: true } },
                payment: true // Asegúrate de incluir el pago para la respuesta y auditoría
            }
        });

        // Formatear la orden para el frontend (conversión de Decimal a Number)
        const updatedOrderForFrontend = {
            ...updatedOrder,
            totalAmount: parseFloat(updatedOrder.totalAmount || 0),
            items: updatedOrder.items.map(item => ({
                ...item,
                price: parseFloat(item.price || 0),
                product: {
                    ...item.product,
                    price: parseFloat(item.product.price || 0)
                }
            })),
            payment: updatedOrder.payment ? {
                ...updatedOrder.payment,
                amount: parseFloat(updatedOrder.payment.amount || 0)
            } : null
        };

        // Registrar en el log de auditoría
        await auditLog('ORDER_AND_PAYMENT_STATUS_UPDATED', {
            userId: adminUserId, 
            entity: 'Order', 
            entityId: updatedOrder.id,
            details: auditDetails, // Usar los detalles de auditoría acumulados
            ipAddress
        });

        // Envío de Correo de Notificación de Cambio de Estado/Pago
        if (currentOrder.user && currentOrder.user.email) {
            let subject = `Actualización de tu Orden #${updatedOrderForFrontend.id} - SIGECOB`;
            let emailBody = `
                <p>Hola ${currentOrder.user.fullName || currentOrder.user.email},</p>
                <p>¡Buenas noticias! Tu orden <strong>#${updatedOrderForFrontend.id}</strong> ha sido actualizada.</p>
            `;

            if (auditDetails.oldOrderStatus && auditDetails.newOrderStatus) {
                emailBody += `<p>El estado de tu orden ha cambiado de <strong>${auditDetails.oldOrderStatus}</strong> a <strong>${auditDetails.newOrderStatus}</strong>.</p>`;
            }
            if (auditDetails.oldPaymentStatus && auditDetails.newPaymentStatus) {
                emailBody += `<p>El estado de tu pago ha cambiado de <strong>${auditDetails.oldPaymentStatus}</strong> a <strong>${auditDetails.newPaymentStatus}</strong>.</p>`;
            }
            
            // Lógica para información de pago (ajústala según tus necesidades específicas para cualquier estado)
            // Ya que 'ReadyForDispatch' no existe en el esquema, puedes poner esta info cuando el pago sea 'Confirmed'
            // o cuando el estado de la orden pase a 'Processing' si es el momento de notificar métodos de pago.
            // Por ahora, no hay lógica específica para un estado de "listo para despacho" aquí,
            // ya que no existe en tu enum `OrderStatus`.

            emailBody += `
                <p>Puedes revisar los detalles completos de tu orden en tu cuenta de SIGECOB.</p>
                <p>Saludos,</p>
                <p>El equipo de SIGECOB</p>
            `;
            await sendEmail(currentOrder.user.email, subject, "Se actualizó tu orden.", emailBody);
        }

        res.status(200).json({ message: 'Estado de la orden/pago actualizado exitosamente.', order: updatedOrderForFrontend });     

    } catch (error) {
        console.error('Error al actualizar el estado de la orden:', error);
        // Asegúrate de que 'id' y 'adminUserId' estén definidos para el auditLog en caso de error
        const logOrderId = id ? parseInt(id) : null;
        const logAdminUserId = adminUserId || null;

        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                await auditLog('ORDER_STATUS_UPDATE_FAILED_NOT_FOUND_DB', {
                    userId: logAdminUserId, entity: 'Order', entityId: logOrderId, details: { error: error.message }, ipAddress
                });
                return res.status(404).json({ message: 'Orden no encontrada para actualizar.' });
            }
        }
        await auditLog('ORDER_STATUS_UPDATE_FAILED_INTERNAL_ERROR', {
            userId: logAdminUserId, entity: 'Order', entityId: logOrderId, details: { error: error.message, stack: error.stack }, ipAddress
        });
        res.status(500).json({ message: 'Error interno del servidor al actualizar el estado de la orden.' });
    }
};