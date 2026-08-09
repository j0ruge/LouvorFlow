/**
 * Rotas do recurso de grupos de funções.
 *
 * Grupos organizam as funções por papel (Ministração, Vocal, Instrumentos...)
 * e definem a ordem dos blocos de integrantes no compartilhamento da escala.
 * GETs exigem autenticação; escritas exigem permissão `configuracoes.write`.
 *
 * A rota `PATCH /reorder` é declarada antes das rotas com `:id` para que
 * "reorder" nunca seja interpretado como identificador.
 */
import { Router } from 'express';
import funcoesGruposController from '../controllers/funcoes-grupos.controller.js';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated.js';
import { ensureTenantContext } from '../middlewares/ensureTenantContext.js';
import { can } from '../middlewares/can.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import {
    grupoIdParamsSchema,
    createGrupoBodySchema,
    updateGrupoBodySchema,
    reorderGruposBodySchema,
    setFuncoesBodySchema,
} from '../validators/funcoes-grupos.validators.js';

const router: Router = Router();

router.get('/', ensureAuthenticated, ensureTenantContext, funcoesGruposController.index);
router.patch('/reorder', ensureAuthenticated, ensureTenantContext, can(['configuracoes.write']), validateRequest({ body: reorderGruposBodySchema }), funcoesGruposController.reorder);
router.post('/', ensureAuthenticated, ensureTenantContext, can(['configuracoes.write']), validateRequest({ body: createGrupoBodySchema }), funcoesGruposController.create);
router.put('/:id/funcoes', ensureAuthenticated, ensureTenantContext, can(['configuracoes.write']), validateRequest({ params: grupoIdParamsSchema, body: setFuncoesBodySchema }), funcoesGruposController.setFuncoes);
router.put('/:id', ensureAuthenticated, ensureTenantContext, can(['configuracoes.write']), validateRequest({ params: grupoIdParamsSchema, body: updateGrupoBodySchema }), funcoesGruposController.update);
router.delete('/:id', ensureAuthenticated, ensureTenantContext, can(['configuracoes.write']), validateRequest({ params: grupoIdParamsSchema }), funcoesGruposController.delete);

export default router;
