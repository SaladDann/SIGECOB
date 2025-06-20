// backend/src/routes/support.routes.js
import { Router } from 'express';
import { createSupportRequest } from '../controllers/support.controller.js';
import { authenticate } from '../middlewares/auth.middleware.js'; 

import { sendContactMessage } from '../controllers/contact.controller.js';

const router = Router();

router.post('/contact', sendContactMessage);

// Ruta para crear una solicitud de soporte (protegida por autenticación)
router.post('/requests', authenticate, createSupportRequest); // <-- Usa 'authenticate' directamente

export default router;