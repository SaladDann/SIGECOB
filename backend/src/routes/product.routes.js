// backend/routes/product.routes.js
import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js'; 
import {
    createProduct,
    getAllProducts,
    updateProduct,
    deleteProduct
} from '../controllers/product.controller.js';
import upload from '../config/multerConfig.js'; // <<-- ¡IMPORTA MULTER AQUÍ!

const router = Router();

// Ruta pública para obtener todos los productos
router.get('/products', getAllProducts);

// Rutas protegidas que requieren autenticación
router.use(authenticate); // Todas las rutas debajo de aquí requerirán un token válido

// Rutas para administradores
// REQ-N2: Solo administradores tienen acceso a la gestión de productos

// Ruta para crear producto - ¡Añadimos Multer aquí!
// 'image' debe coincidir con el nombre del campo que el frontend usa para el archivo (dataToSubmit.append('image', imageFile))
router.post('/products/create', authorize(['Admin']), upload.single('image'), createProduct);

// Ruta para actualizar producto - ¡Añadimos Multer aquí!
// También usamos 'image' aquí porque el frontend envía el nuevo archivo con ese nombre.
router.put('/products/update/:id', authorize(['Admin']), upload.single('image'), updateProduct);

// Ruta para eliminar producto - ¡Corregimos la sintaxis del ID!
router.delete('/products/delete/:id', authorize(['Admin']), deleteProduct); // <<-- Corrige de :id a /:id

export default router;