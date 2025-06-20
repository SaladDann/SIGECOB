import prisma from '../config/prisma.js';
import { Prisma } from '@prisma/client';
import { auditLog } from '../utils/audit-logger.js'
import { sendEmail } from '../utils/email-sender.js';

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

    // --- CAMBIO: Línea 20 (aproximadamente) ---
    // Se define ipAddress al inicio de la función para que esté en el ámbito correcto
    const ipAddress = req.ip || req.connection.remoteAddress;
    // Si estás detrás de un proxy/balanceador de carga, podrías necesitar:
    // const ipAddress = req.headers['x-forwarded-for'] || req.ip || req.connection.remoteAddress;
    // --- FIN CAMBIO ---

    // Validación básica de los campos requeridos
    if (!shippingAddress || !paymentMethod) {
        // --- CAMBIO: Línea 28 (aproximadamente) ---
        // Logging antes de enviar respuesta de error para capturar intentos fallidos
        await auditLog('ORDER_CREATION_FAILED', {
            userId: userId,
            details: { error: 'Dirección de envío o método de pago obligatorios', requestBody: req.body },
            ipAddress
        });
        // --- FIN CAMBIO ---
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
            // --- CAMBIO: Línea 47 (aproximadamente) ---
            // Logging antes de enviar respuesta de error
            await auditLog('ORDER_CREATION_FAILED', {
                userId: userId,
                details: { error: 'El carrito está vacío', cartId: cart ? cart.id : 'N/A' },
                ipAddress
            });
            // --- FIN CAMBIO ---
            return res.status(400).json({ message: 'El carrito está vacío. No se puede crear una orden.' });
        }

        let totalAmount = 0;
        // 2. Pre-verificar stock y calcular el total de la orden
        // Esto se hace antes de la transacción para devolver errores rápidamente sin bloquear la DB
        for (const item of cart.items) {
            if (item.product.stock < item.quantity) {
                // --- CAMBIO: Línea 60 (aproximadamente) ---
                // Logging antes de enviar respuesta de error
                await auditLog('ORDER_CREATION_FAILED', {
                    userId: userId,
                    details: { error: `Stock insuficiente para ${item.product.name}`, productId: item.productId, availableStock: item.product.stock, requestedQuantity: item.quantity },
                    ipAddress
                });
                // --- FIN CAMBIO ---
                return res.status(400).json({ message: `Stock insuficiente para ${item.product.name}. Solo hay ${item.product.stock} unidades disponibles.` });
            }
            totalAmount += item.quantity * item.price; // Asegúrate de que item.price esté bien aquí
        }

        // --- Iniciar una **transacción de base de datos** ---
        // Esto asegura que todas las operaciones dentro del bloque ($transaction)
        // se completen con éxito o se reviertan si alguna falla.
        // --- CAMBIO: Línea 72 (aproximadamente) ---
        // Capturamos tanto la orden final como el pago final de la transacción
        const transactionResult = await prisma.$transaction(async (prismaTransaction) => {
        // --- FIN CAMBIO ---
            // 3. Crear la **Orden**
            const order = await prismaTransaction.order.create({
                data: {
                    userId: userId,
                    totalAmount: totalAmount,
                    shippingAddress: shippingAddress,
                    orderStatus: 'Pending', // Estado inicial de la orden según tu Enum
                },
            });

            // 4. Mover los ítems del carrito a **OrderItems** y **actualizar el stock**
            const orderItemsData = cart.items.map(item => ({
                orderId: order.id,
                productId: item.productId,
                quantity: item.quantity,
                price: item.price, // Usar 'price' como en tu schema.prisma para OrderItem
            }));

            // Crear todos los ítems de la orden en un solo batch
            await prismaTransaction.orderItem.createMany({
                data: orderItemsData,
            });

            // Actualizar el stock de cada producto individualmente
            for (const item of cart.items) {
                await prismaTransaction.product.update({
                    where: { id: item.productId },
                    data: {
                        stock: {
                            decrement: item.quantity, // Decrementar la cantidad vendida
                        },
                        // Actualizar el estado del producto si el stock llega a 0
                        status: item.product.stock - item.quantity === 0 ? 'Out_of_Stock' : 'Available',
                    },
                });
            }

            // 5. Simular el proceso de **pago**
            const payment = await prismaTransaction.payment.create({
                data: {
                    userId: userId,
                    orderId: order.id, // Enlazar el pago a la orden creada
                    amount: totalAmount,
                    paymentMethod: paymentMethod,
                    transactionId: `TXN-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`, // ID de transacción simulado
                    paymentStatus: 'Confirmed', // Usar 'Confirmed' de tu enum PaymentStatus
                    paidAt: new Date(), // Registrar el momento del pago
                },
            });

            // 6. Actualizar la orden con el ID del pago y su estado final
            const updatedOrder = await prismaTransaction.order.update({
                where: { id: order.id },
                data: {
                    paymentId: payment.id,
                    orderStatus: 'Processing', // Usar 'Processing' de tu enum OrderStatus
                },
                include: { // Incluir las relaciones para la respuesta
                    items: {
                        include: {
                            product: true
                        }
                    },
                    // --- CAMBIO: Línea 124 (aproximadamente) ---
                    payment: true // Incluir el pago para poder retornarlo
                    // --- FIN CAMBIO ---
                }
            });

            // 7. Vaciar el carrito después de una compra exitosa
            await prismaTransaction.cartItem.deleteMany({
                where: { cartId: cart.id },
            });

            // --- CAMBIO: Línea 130 (aproximadamente) ---
            // Retornar la orden actualizada y el pago para usar fuera de la transacción
            return { updatedOrder, payment };
        });

        // Ahora, extraemos la orden y el pago del resultado de la transacción
        const { updatedOrder: finalOrder, payment: finalPayment } = transactionResult;
        // --- FIN CAMBIO ---

        // Registrar en el log de auditoría
        // --- CAMBIO: Línea 136 (aproximadamente) ---
        // Usar finalOrder y finalPayment, y ipAddress que ya está definida
        await auditLog('ORDER_CREATED_AND_PAYMENT_PROCESSED', {
            userId: userId,
            entity: 'Order',
            entityId: finalOrder.id, // Usar finalOrder
            details: { totalAmount, paymentStatus: finalPayment.paymentStatus }, // Usar finalPayment
            ipAddress // Ahora ipAddress está definida
        });
        // --- FIN CAMBIO ---

        // --- Envío de Correo de Confirmación de Orden ---
        const customer = await prisma.user.findUnique({
            where: { id: userId },
            select: { email: true, fullName: true, address: true } // Incluir dirección para el email
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
        // Manejo de errores específicos de Prisma para una mejor retroalimentación
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                return res.status(409).json({ message: 'Conflicto de datos. Ya existe un registro con estos valores únicos.' });
            }
            if (error.code === 'P2025') {
                return res.status(404).json({ message: 'Recurso no encontrado. Verifique IDs de productos o carrito.' });
            }
            // Agrega más códigos de error de Prisma si los necesitas
            return res.status(500).json({ message: `Error en la base de datos: ${error.message}` });
        }
        
        // --- CAMBIO: Línea 198 (aproximadamente) ---
        // Log para errores generales, incluyendo los ReferenceError. Agregamos stack para mejor depuración.
        await auditLog('ORDER_CREATION_FAILED', {
            userId: userId,
            details: { error: error.message, stack: error.stack, requestBody: req.body }, // Agregamos stack para mejor depuración
            ipAddress // ipAddress está definida aquí también
        });
        // --- FIN CAMBIO ---
        res.status(500).json({ message: 'Error interno del servidor al procesar la orden o el pago.' });
    }
};

/**
 * Obtiene el historial de órdenes del usuario autenticado.
 * @param {object} req - Objeto de solicitud.
 * @param {object} res - Objeto de respuesta.
 */
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

        // Mapear las órdenes para convertir los campos Decimal (que vienen como string) a números
        const ordersForFrontend = orders.map(order => ({
            ...order,
            // 1. Convierte totalAmount a número
            totalAmount: parseFloat(order.totalAmount || 0), 
            
            // 2. Mapea los ítems para convertir sus precios y el precio del producto anidado
            items: order.items.map(item => ({
                ...item,
                price: parseFloat(item.price || 0), 
                product: {
                    ...item.product,
                    price: parseFloat(item.product.price || 0) 
                }
            })),
            
            // 3. Si hay un pago, convierte su 'amount' a número
            payment: order.payment ? {
                ...order.payment,
                amount: parseFloat(order.payment.amount || 0)
            } : null
        }));

        res.status(200).json(ordersForFrontend); // Envía los datos convertidos
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

    try {
        const orders = await prisma.order.findMany({
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

        await auditLog('GET_ALL_ORDERS', { userId, ipAddress });
        res.status(200).json(ordersForFrontend); // Envía los datos mapeados
    } catch (error) {
        console.error('Error al obtener todas las órdenes:', error);
        await auditLog('GET_ALL_ORDERS_FAILED', { userId, details: { error: error.message }, ipAddress });
        res.status(500).json({ message: 'Error interno del servidor al obtener las órdenes.' });
    }
};

/**
 * Obtiene una orden específica por su ID. (Solo administradores)
 * @param {object} req - Objeto de solicitud.
 * @param {object} res - Objeto de respuesta.
 */
export const getOrderById = async (req, res) => {
    const { id } = req.params;
    const requestingUserId = req.user ? req.user.id : null;
    // Asegúrate de que tu token JWT incluye el 'role' del usuario.
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
            // ... (log de auditoría) ...
            return res.status(404).json({ message: 'Orden no encontrada.' });
        }

        // --- Lógica de Autorización: CLAVE ---
        // Si el usuario NO es un administrador Y la orden NO pertenece a este usuario
        if (requestingUserRole !== 'Admin' && order.userId !== requestingUserId) { // <-- ¡Importante: 'Admin' debe coincidir con el rol en tu DB/token!
            // ... (log de auditoría de intento no autorizado) ...
            return res.status(403).json({ message: 'No tienes permiso para ver esta orden.' });
        }
        // --- FIN Lógica de Autorización ---

        // ... (el resto de tu código para formatear la orden y enviarla) ...
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
        
        // ... (log de auditoría) ...
        res.status(200).json(orderForFrontend);
    } catch (error) {
        // ... (manejo de errores) ...
    }
};

/**
 * Actualiza el estado de una orden. (Solo administradores)
 * @param {object} req - Objeto de solicitud.
 * @param {object} res - Objeto de respuesta.
 */
export const updateOrderStatus = async (req, res) => {
    // ... (código existente para updateOrderStatus) ...

    try {
        // ... (código existente para updateOrderStatus) ...

        const updatedOrder = await prisma.order.update({
            where: { id: parseInt(id) },
            data: {
                orderStatus: orderStatus,
            },
            include: {
                user: { select: { id: true, email: true, fullName: true } },
                items: { include: { product: true } },
                payment: true
            }
        });

        // --- INICIO DE LA MODIFICACIÓN PARA updateOrderStatus (en la respuesta) ---
        // Crea una versión de la orden actualizada con los campos Decimal convertidos
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
        // --- FIN DE LA MODIFICACIÓN PARA updateOrderStatus ---

        await auditLog('ORDER_STATUS_UPDATED', {
            userId: adminUserId, entity: 'Order', entityId: updatedOrder.id,
            details: {
                oldStatus: currentOrder.orderStatus,
                newStatus: updatedOrderForFrontend.orderStatus // Usa la versión convertida aquí también
            },
            ipAddress
        });

        // --- Envío de Correo de Notificación de Cambio de Estado ---
        // Asegúrate de usar updatedOrderForFrontend en el cuerpo del correo si necesitas valores numéricos
        if (currentOrder.user && currentOrder.user.email) { 
            const subject = `Actualización de tu Orden #${updatedOrderForFrontend.id} - SIGECOB`;
            const text = `Hola ${currentOrder.user.fullName || currentOrder.user.email},\n\nEl estado de tu orden #${updatedOrderForFrontend.id} ha cambiado de ${currentOrder.orderStatus} a ${updatedOrderForFrontend.orderStatus}.\n\nSaludos,\nEl equipo de SIGECOB`;
            const html = `
                <p>Hola ${currentOrder.user.fullName || currentOrder.user.email},</p>
                <p>¡Buenas noticias! El estado de tu orden <strong>#${updatedOrderForFrontend.id}</strong> ha sido actualizado.</p>
                <p>El estado ha cambiado de <strong>${currentOrder.orderStatus}</strong> a <strong>${updatedOrderForFrontend.orderStatus}</strong>.</p>
                <p>Puedes revisar los detalles de tu orden en tu cuenta de SIGECOB.</p>
                <p>Saludos,</p>
                <p>El equipo de SIGECOB</p>
            `;
            await sendEmail(currentOrder.user.email, subject, text, html);
        }

        res.status(200).json({ message: 'Estado de la orden actualizado exitosamente.', order: updatedOrderForFrontend });     

    } catch (error) {
        console.error('Error al actualizar el estado de la orden:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') {
                await auditLog('ORDER_STATUS_UPDATE_FAILED_NOT_FOUND_DB', {
                    userId: adminUserId, entity: 'Order', entityId: parseInt(id), details: { error: error.message }, ipAddress
                });
                return res.status(404).json({ message: 'Orden no encontrada para actualizar.' });
            }
        }
        await auditLog('ORDER_STATUS_UPDATE_FAILED_INTERNAL_ERROR', {
            userId: adminUserId, entity: 'Order', entityId: parseInt(id), details: { error: error.message }, ipAddress
        });
        res.status(500).json({ message: 'Error interno del servidor al actualizar el estado de la orden.' });
    }
};