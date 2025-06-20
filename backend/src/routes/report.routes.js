import { Router } from 'express';
import { authenticate, authorize } from '../middlewares/auth.middleware.js';
import {
    getGeneralStatistics,
    getTopSellingProducts,
    getLowStockProducts
} from '../controllers/report.controller.js';

const router = Router();

// Todas estas rutas requieren que el usuario esté autenticado y sea 'Admin'
router.use(authenticate);
router.use(authorize(['Admin'])); // Solo administradores pueden acceder a los reportes

router.get('/reports/statistics', getGeneralStatistics);
router.get('/reports/top-selling', getTopSellingProducts);
router.get('/reports/low-stock', getLowStockProducts);

export default router;