/**
 * Rotas do recurso de funções musicais.
 *
 * Define os endpoints REST para CRUD de funções (ex: vocalista, guitarrista).
 * GETs exigem autenticação; POST/PUT/DELETE exigem permissão `configuracoes.write`.
 * Validação de entrada via Zod em rotas com params/body.
 */
import { Router } from 'express';
import funcoesController from '../controllers/funcoes.controller.js';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated.js';
import { ensureTenantContext } from '../middlewares/ensureTenantContext.js';
import { can } from '../middlewares/can.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import {
    funcaoIdParamsSchema,
    createFuncaoBodySchema,
    updateFuncaoBodySchema,
} from '../validators/funcoes.validators.js';

const router: Router = Router();

router.get('/', ensureAuthenticated, ensureTenantContext, funcoesController.index);
router.get('/:id', ensureAuthenticated, ensureTenantContext, validateRequest({ params: funcaoIdParamsSchema }), funcoesController.show);
router.post('/', ensureAuthenticated, ensureTenantContext, can(['configuracoes.write']), validateRequest({ body: createFuncaoBodySchema }), funcoesController.create);
router.put('/:id', ensureAuthenticated, ensureTenantContext, can(['configuracoes.write']), validateRequest({ params: funcaoIdParamsSchema, body: updateFuncaoBodySchema }), funcoesController.update);
router.delete('/:id', ensureAuthenticated, ensureTenantContext, can(['configuracoes.write']), validateRequest({ params: funcaoIdParamsSchema }), funcoesController.delete);

export default router;
