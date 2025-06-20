import { Prisma } from '@prisma/client';
import prisma from '../config/prisma.js';
import { auditLog } from '../utils/audit-logger.js';
import fs from 'fs';   
import path from 'path'; 

/**
 * Crea un nuevo producto. (Solo administradores)
 * REQ-N1: Gestión de Inventario
 * @param {object} req - Objeto de solicitud. Contiene 'req.file' si se sube una imagen.
 * @param {object} res - Objeto de respuesta.
 */
export const createProduct = async (req, res) => {
    const { name, description, price, stock, category } = req.body;
    const userId = req.user ? req.user.id : null; 
    const ipAddress = req.ip;

    const imageUrl = req.file ? `/uploads/products/${req.file.filename}` : null;

    if (!name || !price || stock === undefined || stock < 0) {
        if (req.file) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Error al eliminar imagen huérfana por datos incompletos:', err);
            });
        }
        return res.status(400).json({ message: 'Nombre, precio y stock son obligatorios. El stock no puede ser negativo.' });
    }

    try {
        const existingProduct = await prisma.product.findUnique({
            where: { name },
        });

        if (existingProduct) {
            if (req.file) {
                fs.unlink(req.file.path, (err) => {
                    if (err) console.error('Error al eliminar imagen duplicada por nombre existente:', err);
                });
            }
            await auditLog('PRODUCT_CREATE_FAILED_DUPLICATE_NAME', {
                userId, entity: 'Product', details: { name, reason: 'Duplicate name' }, ipAddress
            });
            return res.status(409).json({ message: 'Ya existe un producto con este nombre.' });
        }

        const newProduct = await prisma.product.create({
            data: {
                name,
                description,
                price: parseFloat(price),
                stock: parseInt(stock),
                status: parseInt(stock) > 0 ? 'Available' : 'Out_of_Stock', // Usa el enum ProductStatus
                imageUrl, 
                category,
            },
        });

        await auditLog('PRODUCT_CREATED', {
            userId, entity: 'Product', entityId: newProduct.id, details: newProduct, ipAddress
        });

        res.status(201).json({ message: 'Producto creado exitosamente.', product: newProduct });

    } catch (error) {
        console.error('Error al crear producto:', error);
        if (req.file) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Error al eliminar imagen tras fallo de creación en DB:', err);
            });
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') {
                await auditLog('PRODUCT_CREATE_FAILED_DB_CONSTRAINT', {
                    userId, entity: 'Product', details: { name, error: error.message }, ipAddress
                });
                return res.status(409).json({ message: 'Ya existe un producto con este nombre.' });
            }
        }
        await auditLog('PRODUCT_CREATE_FAILED_INTERNAL_ERROR', {
            userId, entity: 'Product', details: { name, error: error.message }, ipAddress
        });
        res.status(500).json({ message: 'Error interno del servidor al crear el producto.' });
    }
};

/**
 * Actualiza un producto existente. (Solo administradores)
 * REQ-N1: Gestión de Inventario
 * @param {object} req - Objeto de solicitud. Contiene 'req.file' si se sube una nueva imagen.
 * @param {object} res - Objeto de respuesta.
 */
export const updateProduct = async (req, res) => {
    const { id } = req.params;
    const { name, description, price, stock, category, imageUrl: bodyImageUrl, status: bodyStatus } = req.body;
    const userId = req.user ? req.user.id : null;
    const ipAddress = req.ip;

    const newFileImageUrl = req.file ? `/uploads/products/${req.file.filename}` : undefined;

    if (stock !== undefined && (stock < 0 || isNaN(parseInt(stock)))) {
        if (req.file) { fs.unlink(req.file.path, (err) => { if (err) console.error('Error al eliminar imagen huérfana por stock inválido:', err); }); }
        return res.status(400).json({ message: 'El stock debe ser un número no negativo.' });
    }
    if (price !== undefined && (price < 0 || isNaN(parseFloat(price)))) {
        if (req.file) { fs.unlink(req.file.path, (err) => { if (err) console.error('Error al eliminar imagen huérfana por precio inválido:', err); }); }
        return res.status(400).json({ message: 'El precio debe ser un número no negativo.' });
    }

    try {
        const currentProduct = await prisma.product.findUnique({ where: { id: parseInt(id) } });
        if (!currentProduct) {
            if (req.file) { 
                fs.unlink(req.file.path, (err) => {
                    if (err) console.error('Error al eliminar nueva imagen para producto no encontrado:', err);
                });
            }
            await auditLog('PRODUCT_UPDATE_FAILED_NOT_FOUND', {
                userId, entity: 'Product', entityId: parseInt(id), details: { id, reason: 'Product not found' }, ipAddress
            });
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }

        let finalImageUrl = currentProduct.imageUrl; 

        if (newFileImageUrl !== undefined) { 
            finalImageUrl = newFileImageUrl;
            if (currentProduct.imageUrl) {
                const oldImagePath = path.join(process.cwd(), currentProduct.imageUrl);
                if (fs.existsSync(oldImagePath)) { 
                    fs.unlink(oldImagePath, (err) => {
                        if (err) console.error('Error al eliminar imagen antigua durante actualización (nueva imagen subida):', err);
                    });
                }
            }
        } else if (bodyImageUrl !== undefined) { 
            if (currentProduct.imageUrl && bodyImageUrl !== currentProduct.imageUrl) {
                const oldImagePath = path.join(process.cwd(), currentProduct.imageUrl);
                if (fs.existsSync(oldImagePath)) { 
                    fs.unlink(oldImagePath, (err) => {
                        if (err) console.error('Error al eliminar imagen antigua (campo imageUrl modificado/borrado):', err);
                    });
                }
            }
            finalImageUrl = bodyImageUrl === '' ? null : bodyImageUrl; 
        }

        const parsedPrice = price !== undefined ? parseFloat(price) : currentProduct.price;
        const parsedStock = stock !== undefined ? parseInt(stock) : currentProduct.stock;
        const parsedId = parseInt(id);


        const changes = {};
        if (name !== undefined && name !== currentProduct.name) changes.name = { old: currentProduct.name, new: name };
        if (description !== undefined && description !== currentProduct.description) changes.description = { old: currentProduct.description, new: description };
        if (price !== undefined && parsedPrice !== parseFloat(currentProduct.price)) changes.price = { old: parseFloat(currentProduct.price), new: parsedPrice };
        if (stock !== undefined && parsedStock !== currentProduct.stock) changes.stock = { old: currentProduct.stock, new: parsedStock };
        
        if (finalImageUrl !== currentProduct.imageUrl) {
            changes.imageUrl = { old: currentProduct.imageUrl, new: finalImageUrl };
        }
        
        if (category !== undefined && category !== currentProduct.category) changes.category = { old: currentProduct.category, new: category };
        
        // Determinar el nuevo estado basado en el stock si se proporcionó, o si el status se envió explícitamente
        let newStatus = currentProduct.status;
        if (stock !== undefined) {
            if (parsedStock === 0) {
                newStatus = 'Out_of_Stock';
            } else if (parsedStock > 0 && currentProduct.status === 'Out_of_Stock') {
                newStatus = 'Available';
            }
        } 
        
        // Si el frontend envía un 'status' explícitamente (ej. para descontinuar manualmente)
        if (bodyStatus !== undefined && bodyStatus !== currentProduct.status) {
            const validStatuses = ['Available', 'Out_of_Stock', 'Discontinued'];
            if (validStatuses.includes(bodyStatus)) {
                newStatus = bodyStatus;
                changes.status = { old: currentProduct.status, new: newStatus };
            } else {
                console.warn(`Estado de producto no válido recibido: ${bodyStatus}. Se mantiene el estado actual.`);
            }
        }


        const updatedProduct = await prisma.product.update({
            where: { id: parsedId },
            data: {
                name: name !== undefined ? name : currentProduct.name,
                description: description !== undefined ? description : currentProduct.description,
                price: parsedPrice,
                stock: parsedStock,
                status: newStatus, 
                imageUrl: finalImageUrl, 
                category: category !== undefined ? category : currentProduct.category,
            },
        });

        await auditLog('PRODUCT_UPDATED', {
            userId, entity: 'Product', entityId: updatedProduct.id, details: { changes }, ipAddress
        });

        res.status(200).json({ message: 'Producto actualizado exitosamente.', product: updatedProduct });

    } catch (error) {
        console.error('Error al actualizar producto:', error);
        if (req.file) {
            fs.unlink(req.file.path, (err) => {
                if (err) console.error('Error al eliminar imagen tras fallo de actualización en DB:', err);
            });
        }
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2002') { 
                await auditLog('PRODUCT_UPDATE_FAILED_DUPLICATE_NAME', {
                    userId, entity: 'Product', entityId: parseInt(id), details: { name, error: error.message }, ipAddress
                });
                return res.status(409).json({ message: 'Ya existe un producto con este nombre.' });
            }
            if (error.code === 'P2025') { 
                await auditLog('PRODUCT_UPDATE_FAILED_NOT_FOUND', {
                    userId, entity: 'Product', entityId: parseInt(id), details: { error: error.message }, ipAddress
                });
                return res.status(404).json({ message: 'Producto no encontrado.' });
            }
        }
        await auditLog('PRODUCT_UPDATE_FAILED_INTERNAL_ERROR', {
            userId, entity: 'Product', entityId: parseInt(id), details: { error: error.message }, ipAddress
        });
        res.status(500).json({ message: 'Error interno del servidor al actualizar el producto.' });
    }
};

/**
 * "Elimina" (descontinua) un producto cambiando su estado a 'Discontinued'. (Solo administradores)
 * Este método ahora realiza una "eliminación suave".
 * @param {object} req - Objeto de solicitud.
 * @param {object} res - Objeto de respuesta.
 */
export const deleteProduct = async (req, res) => {
    const { id } = req.params;
    const userId = req.user ? req.user.id : null;
    const ipAddress = req.ip;

    try {
        const productToDiscontinue = await prisma.product.findUnique({
            where: { id: parseInt(id) },
        });

        if (!productToDiscontinue) {
            await auditLog('PRODUCT_DISCONTINUE_FAILED_NOT_FOUND', {
                userId, entity: 'Product', entityId: parseInt(id), details: { reason: 'Product not found' }, ipAddress
            });
            return res.status(404).json({ message: 'Producto no encontrado.' });
        }


        if (productToDiscontinue.status === 'Discontinued') {
             return res.status(200).json({ message: `El producto "${productToDiscontinue.name}" ya está descontinuado.` });
        }

        // Cambiar el estado del producto a 'Discontinued'
        const discontinuedProduct = await prisma.product.update({
            where: { id: parseInt(id) },
            data: {
                status: 'Discontinued',
            },
        });

        await auditLog('PRODUCT_DISCONTINUED', {
            userId, entity: 'Product', entityId: parseInt(id), details: { id, name: productToDiscontinue.name, oldStatus: productToDiscontinue.status, newStatus: 'Discontinued' }, ipAddress
        });

        res.status(200).json({ message: `Producto "${discontinuedProduct.name}" descontinuado exitosamente.`, product: discontinuedProduct });

    } catch (error) {
        console.error('Error al descontinuar producto:', error);
        if (error instanceof Prisma.PrismaClientKnownRequestError) {
            if (error.code === 'P2025') { 
                await auditLog('PRODUCT_DISCONTINUE_FAILED_NOT_FOUND', {
                    userId, entity: 'Product', entityId: parseInt(id), details: { error: error.message }, ipAddress
                });
                return res.status(404).json({ message: 'Producto no encontrado para descontinuar.' });
            }
        }
        await auditLog('PRODUCT_DISCONTINUE_FAILED_INTERNAL_ERROR', {
            userId, entity: 'Product', entityId: parseInt(id), details: { error: error.message }, ipAddress
        });
        res.status(500).json({ message: 'Error interno del servidor al descontinuar el producto.' });
    }
};

/**
 * Obtiene todos los productos con opciones de búsqueda, filtrado, ordenamiento y paginación.
 * Accessible por todos los usuarios. Por defecto, excluye productos "Discontinued".
 * Los administradores pueden solicitar incluir productos descontinuados.
 * @param {object} req - Objeto de solicitud. Contiene query parameters para filtros.
 * @param {object} res - Objeto de respuesta.
 */
export const getAllProducts = async (req, res) => {
    const {
        search,
        category,
        minPrice,
        maxPrice,
        status,
        sortBy = 'createdAt', 
        order = 'desc',      
        page = 1,            
        pageSize = 10,       
        includeDiscontinued
    } = req.query;

    const userId = req.user ? req.user.id : null; 
    const ipAddress = req.ip;

    const take = parseInt(pageSize);
    const skip = (parseInt(page) - 1) * take;

    const where = {};
    const lowerCaseSearch = search ? search.toLowerCase() : undefined;

    if (lowerCaseSearch) {
        where.OR = [
            { name: { contains: lowerCaseSearch, mode: 'insensitive' } },
            { description: { contains: lowerCaseSearch, mode: 'insensitive' } },
        ];
    }

    if (category) {
        where.category = category;
    }

    if (minPrice || maxPrice) {
        where.price = {};
        if (minPrice) where.price.gte = parseFloat(minPrice);
        if (maxPrice) where.price.lte = parseFloat(maxPrice);
    }

    // Lógica para filtrar por status y manejar 'Discontinued'
    if (status) {
        const validProductStatuses = ['Available', 'Out_of_Stock', 'Discontinued'];
        if (!validProductStatuses.includes(status)) {
            return res.status(400).json({ message: `El estado '${status}' no es válido. Los estados permitidos son: ${validProductStatuses.join(', ')}.` });
        }
        where.status = status;
    } else {

        if (!(req.user && req.user.role === 'Admin' && includeDiscontinued === 'true')) {
            where.status = { not: 'Discontinued' }; // Excluye 'Discontinued' por defecto
        }
    }

    const orderBy = {};
    if (['name', 'price', 'stock', 'createdAt', 'updatedAt'].includes(sortBy)) {
        orderBy[sortBy] = order === 'asc' ? 'asc' : 'desc';
    } else {
        orderBy.createdAt = 'desc';
    }

    try {
        const [products, totalProducts] = await prisma.$transaction([
            prisma.product.findMany({
                where,
                orderBy,
                take,
                skip,
            }),
            prisma.product.count({ where }),
        ]);

        await auditLog('GET_ALL_PRODUCTS_FILTERED', {
            userId,
            details: { filters: req.query, count: products.length },
            ipAddress
        });

        res.status(200).json({
            products,
            pagination: {
                totalProducts,
                currentPage: parseInt(page),
                pageSize: take,
                totalPages: Math.ceil(totalProducts / take),
            },
        });

    } catch (error) {
        console.error('Error al obtener productos:', error);
        await auditLog('GET_ALL_PRODUCTS_FAILED', {
            userId,
            details: { filters: req.query, error: error.message },
            ipAddress
        });
        res.status(500).json({ message: 'Error interno del servidor al obtener los productos.' });
    }
};