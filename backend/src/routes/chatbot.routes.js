import { Router } from 'express';
import { sendMessage } from '../controllers/chatbot.controller.js';
import { authenticateOptional } from '../middlewares/auth.middleware.js'; // Necesitaremos este middleware

const router = Router();

// Middleware opcional para autenticación. Si el usuario tiene token, se adjunta req.user. Si no, continua.
router.post('/chatbot/message', authenticateOptional, sendMessage);

export default router;