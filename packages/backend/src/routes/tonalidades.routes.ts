/**
 * Rotas do recurso de tonalidades.
 *
 * Define os endpoints REST para CRUD de tonalidades musicais.
 * GETs exigem autenticação; POST/PUT/DELETE exigem autenticação + role.
 */
import { Router } from 'express';
import tonalidadesController from '../controllers/tonalidades.controller.js';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated.js';
import { ensureHasRole } from '../middlewares/ensureHasRole.js';

const router: Router = Router();

router.get('/', ensureAuthenticated, tonalidadesController.index);
router.get('/:id', ensureAuthenticated, tonalidadesController.show);
router.post('/', ensureAuthenticated, ensureHasRole, tonalidadesController.create);
router.put('/:id', ensureAuthenticated, ensureHasRole, tonalidadesController.update);
router.delete('/:id', ensureAuthenticated, ensureHasRole, tonalidadesController.delete);

export default router;
