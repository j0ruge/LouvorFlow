/**
 * Rotas do recurso de tipos de eventos.
 *
 * Define os endpoints REST para CRUD de tipos de eventos.
 * GETs exigem autenticação; POST/PUT/DELETE exigem autenticação + role.
 */
import { Router } from 'express';
import tiposEventosController from '../controllers/tipos-eventos.controller.js';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated.js';
import { ensureHasRole } from '../middlewares/ensureHasRole.js';

const router: Router = Router();

router.get('/', ensureAuthenticated, tiposEventosController.index);
router.get('/:id', ensureAuthenticated, tiposEventosController.show);
router.post('/', ensureAuthenticated, ensureHasRole, tiposEventosController.create);
router.put('/:id', ensureAuthenticated, ensureHasRole, tiposEventosController.update);
router.delete('/:id', ensureAuthenticated, ensureHasRole, tiposEventosController.delete);

export default router;
