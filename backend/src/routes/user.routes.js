import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import {
    getAllUsers,
    getUserById,
    updateUser,
    deleteUser,
    createUserByAdmin
} from '../controllers/user.controller.js';

const router = Router();

// Todas estas rutas requieren que el usuario esté autenticado y sea 'Admin'
router.use(authenticate); // Primero, asegurar que el usuario esté logueado
router.use(authorize(['Admin'])); // Luego, asegurar que el usuario tenga rol 'Admin'

router.get('/users/get', getAllUsers);           // Obtener todos los usuarios
router.get('/users/getbyid/:id', getUserById);       // Obtener un usuario por ID
router.put('/users/update/:id', updateUser);        // Actualizar datos de usuario (incluyendo rol)
router.delete('/users/delete/:id', deleteUser);     // Eliminar usuario
router.post('/users/create', createUserByAdmin); 

export default router;