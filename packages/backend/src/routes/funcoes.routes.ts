/**
 * Rotas do recurso de funções musicais.
 *
 * Define os endpoints REST para CRUD de funções (ex: vocalista, guitarrista).
 * GETs exigem autenticação; POST/PUT/DELETE exigem permissão `configuracoes.write`.
 */
import { Router } from 'express';
import funcoesController from '../controllers/funcoes.controller.js';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated.js';
import { ensureTenantContext } from '../middlewares/ensureTenantContext.js';
import { can } from '../middlewares/can.js';

const router: Router = Router();

router.get('/', ensureAuthenticated, ensureTenantContext, funcoesController.index);
router.get('/:id', ensureAuthenticated, ensureTenantContext, funcoesController.show);
router.post('/', ensureAuthenticated, ensureTenantContext, can(['configuracoes.write']), funcoesController.create);
router.put('/:id', ensureAuthenticated, ensureTenantContext, can(['configuracoes.write']), funcoesController.update);
router.delete('/:id', ensureAuthenticated, ensureTenantContext, can(['configuracoes.write']), funcoesController.delete);

export default router;
