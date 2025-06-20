import { Prisma } from '@prisma/client';
import prisma from '../config/prisma.js';
import { auditLog } from '../utils/audit-logger.js';

/**
 * Obtiene un resumen de estadísticas generales para el administrador.
 * Incluye conteo de usuarios, productos, órdenes y ventas totales.
 * @param {object} req - Objeto de solicitud.
 * @param {object} res - Objeto de respuesta.
 */
export const getGeneralStatistics = async (req, res) => {
    const userId = req.user ? req.user.id : null;
    const ipAddress = req.ip;

    try {
        const [
            totalUsers,
            totalProducts,
            totalOrders,
            totalRevenueResult // Resultado de la agregación de suma
        ] = await prisma.$transaction([
            prisma.user.count(),
            prisma.product.count(),
            prisma.order.count(),
            prisma.order.aggregate({
                _sum: {
                    totalAmount: true,
                },
                where: {
                    orderStatus: {
                        in: ['Processing', 'Shipped', 'Delivered'] // Considerar solo órdenes no canceladas/pendientes para revenue
                    }
                }
            })
        ]);

        const totalRevenue = totalRevenueResult._sum.totalAmount || 0;

        await auditLog('REPORT_GENERAL_STATS_FETCHED', { userId, ipAddress });
        res.status(200).json({
            totalUsers,
            totalProducts,
            totalOrders,
            totalRevenue: parseFloat(totalRevenue.toFixed(2)), // Formatear a 2 decimales
        });

    } catch (error) {
        console.error('Error al obtener estadísticas generales:', error);
        await auditLog('REPORT_GENERAL_STATS_FAILED', { userId, details: { error: error.message }, ipAddress });
        res.status(500).json({ message: 'Error interno del servidor al obtener estadísticas generales.' });
    }
};

/**
 * Obtiene los productos más vendidos (top N).
 * @param {object} req - Objeto de solicitud.
 * @param {object} res - Objeto de respuesta.
 */
export const getTopSellingProducts = async (req, res) => {
    const { limit = 5 } = req.query; // Por defecto, los 5 productos más vendidos
    const userId = req.user ? req.user.id : null;
    const ipAddress = req.ip;

    try {
        const topProducts = await prisma.orderItem.groupBy({
            by: ['productId'],
            _sum: {
                quantity: true,
            },
            orderBy: {
                _sum: {
                    quantity: 'desc', // Ordenar por la suma de la cantidad vendida
                },
            },
            take: parseInt(limit),
        });

        // Para obtener los detalles completos de los productos
        const productIds = topProducts.map(item => item.productId);
        const productsDetails = await prisma.product.findMany({
            where: {
                id: {
                    in: productIds,
                },
            },
        });

        // Combinar la cantidad vendida con los detalles del producto
        const result = topProducts.map(item => {
            const product = productsDetails.find(p => p.id === item.productId);
            return {
                product: product,
                totalQuantitySold: item._sum.quantity,
            };
        }).filter(item => item.product !== undefined); // Asegurarse de que el producto se encuentre

        await auditLog('REPORT_TOP_SELLING_PRODUCTS_FETCHED', { userId, details: { limit: parseInt(limit) }, ipAddress });
        res.status(200).json(result);

    } catch (error) {
        console.error('Error al obtener productos más vendidos:', error);
        await auditLog('REPORT_TOP_SELLING_PRODUCTS_FAILED', { userId, details: { error: error.message }, ipAddress });
        res.status(500).json({ message: 'Error interno del servidor al obtener productos más vendidos.' });
    }
};

/**
 * Obtiene productos con stock bajo.
 * @param {object} req - Objeto de solicitud.
 * @param {object} res - Objeto de respuesta.
 */
export const getLowStockProducts = async (req, res) => {
    const { threshold = 10 } = req.query; // Por defecto, stock menor o igual a 10
    const userId = req.user ? req.user.id : null;
    const ipAddress = req.ip;

    try {
        const lowStockProducts = await prisma.product.findMany({
            where: {
                stock: {
                    lte: parseInt(threshold), // Less than or equal to threshold
                },
                status: 'Available', // Solo productos "disponibles" pero con stock bajo
            },
            orderBy: {
                stock: 'asc', // Los de menor stock primero
            },
        });

        await auditLog('REPORT_LOW_STOCK_PRODUCTS_FETCHED', { userId, details: { threshold: parseInt(threshold) }, ipAddress });
        res.status(200).json(lowStockProducts);

    } catch (error) {
        console.error('Error al obtener productos con bajo stock:', error);
        await auditLog('REPORT_LOW_STOCK_PRODUCTS_FAILED', { userId, details: { error: error.message }, ipAddress });
        res.status(500).json({ message: 'Error interno del servidor al obtener productos con bajo stock.' });
    }
};