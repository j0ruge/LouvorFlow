/**
 * Rotas do recurso de funções musicais.
 *
 * Define os endpoints REST para CRUD de funções (ex: vocalista, guitarrista).
 * GETs exigem autenticação; POST/PUT/DELETE exigem autenticação + role.
 */
import { Router } from 'express';
import funcoesController from '../controllers/funcoes.controller.js';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated.js';
import { ensureHasRole } from '../middlewares/ensureHasRole.js';

const router: Router = Router();

router.get('/', ensureAuthenticated, funcoesController.index);
router.get('/:id', ensureAuthenticated, funcoesController.show);
router.post('/', ensureAuthenticated, ensureHasRole, funcoesController.create);
router.put('/:id', ensureAuthenticated, ensureHasRole, funcoesController.update);
router.delete('/:id', ensureAuthenticated, ensureHasRole, funcoesController.delete);

export default router;
