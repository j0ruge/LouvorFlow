/**
 * Rotas do recurso de artistas.
 *
 * Define os endpoints REST para CRUD de artistas.
 * GETs exigem autenticação; POST/PUT/DELETE exigem autenticação + role.
 */
import { Router } from 'express';
import artistasController from '../controllers/artistas.controller.js';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated.js';
import { ensureHasRole } from '../middlewares/ensureHasRole.js';

const router: Router = Router();

router.get('/', ensureAuthenticated, artistasController.index);
router.get('/:id', ensureAuthenticated, artistasController.show);
router.post('/', ensureAuthenticated, ensureHasRole, artistasController.create);
router.put('/:id', ensureAuthenticated, ensureHasRole, artistasController.update);
router.delete('/:id', ensureAuthenticated, ensureHasRole, artistasController.delete);

export default router;
