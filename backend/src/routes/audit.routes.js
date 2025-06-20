import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import {
    getAuditLogs,
    searchAuditLogs
} from '../controllers/audit.controller.js';

const router = Router();

// Solo los roles 'Admin' o 'Auditor' pueden acceder a los logs de auditoría
router.use(authenticate);
console.log("Roles being passed to authorize for audit routes:", ['Admin', 'Auditor']);
router.use(authorize(['Admin', 'Auditor'])); // REQ-N8: Auditoría accesible por roles autorizados

router.get('/get', getAuditLogs);       // Obtener todos los logs (últimos 100)
router.get('/search', searchAuditLogs); // Búsqueda de logs con filtros

export default router;