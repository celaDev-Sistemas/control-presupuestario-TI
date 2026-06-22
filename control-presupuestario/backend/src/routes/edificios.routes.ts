import { Router } from 'express';
import {
  getEdificios,
  getEdificioById,
  createEdificio,
  updateEdificio,
  deleteEdificio,
  getEdificioStats,
} from '../controllers/edificios.controller';
import { authenticateToken, requireRole } from '../middleware/auth';

const router = Router();

// Todas las rutas requieren autenticación
router.use(authenticateToken);

// GET /api/v1/edificios - Listar edificios
router.get('/', getEdificios);

// GET /api/v1/edificios/:id - Obtener edificio por ID
router.get('/:id', getEdificioById);

// GET /api/v1/edificios/:id/stats - Estadísticas del edificio
router.get('/:id/stats', getEdificioStats);

// POST /api/v1/edificios - Crear edificio (solo ADMIN)
router.post('/', requireRole('ADMIN'), createEdificio);

// PUT /api/v1/edificios/:id - Actualizar edificio (ADMIN o GESTOR)
router.put('/:id', requireRole('ADMIN', 'GESTOR'), updateEdificio);

// DELETE /api/v1/edificios/:id - Desactivar edificio (solo ADMIN)
router.delete('/:id', requireRole('ADMIN'), deleteEdificio);

export default router;
