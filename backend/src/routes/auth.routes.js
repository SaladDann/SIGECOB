import { Router } from 'express';
import { registerUser, loginUser } from '../controllers/auth.controller.js';

const router = Router();

// Ruta para el registro de nuevos usuarios
router.post('/registrar', registerUser);

// Ruta para el inicio de sesión
router.post('/login', loginUser);

export default router;