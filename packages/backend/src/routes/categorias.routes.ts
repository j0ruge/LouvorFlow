/**
 * Rotas do recurso de categorias.
 *
 * Define os endpoints REST para CRUD de categorias.
 * GETs exigem autenticação; POST/PUT/DELETE exigem autenticação + role.
 */
import { Router } from 'express';
import categoriasController from '../controllers/categorias.controller.js';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated.js';
import { ensureHasRole } from '../middlewares/ensureHasRole.js';

const router: Router = Router();

router.get('/', ensureAuthenticated, categoriasController.index);
router.get('/:id', ensureAuthenticated, categoriasController.show);
router.post('/', ensureAuthenticated, ensureHasRole, categoriasController.create);
router.put('/:id', ensureAuthenticated, ensureHasRole, categoriasController.update);
router.delete('/:id', ensureAuthenticated, ensureHasRole, categoriasController.delete);

export default router;
