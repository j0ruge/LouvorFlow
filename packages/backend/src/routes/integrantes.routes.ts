/**
 * Rotas do recurso de integrantes.
 *
 * Define os endpoints REST para CRUD de integrantes (opera sobre Users)
 * e junções com funções musicais.
 * GETs exigem autenticação; POST/PUT/DELETE exigem autenticação + role.
 */
import { Router } from 'express';
import integrantesController from '../controllers/integrantes.controller.js';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated.js';
import { ensureHasRole } from '../middlewares/ensureHasRole.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import {
    createIntegranteBodySchema,
    updateIntegranteBodySchema,
    integranteIdParamsSchema,
    integranteFuncaoParamsSchema,
    integranteFuncaoRemoveParamsSchema,
    addFuncaoBodySchema,
} from '../validators/integrantes.validators.js';

const router: Router = Router();

/** CRUD de integrantes (opera sobre Users) */
router.get('/', ensureAuthenticated, integrantesController.index);
router.get('/:id', ensureAuthenticated, validateRequest({ params: integranteIdParamsSchema }), integrantesController.show);
router.post('/', ensureAuthenticated, ensureHasRole, validateRequest({ body: createIntegranteBodySchema }), integrantesController.create);
router.put('/:id', ensureAuthenticated, ensureHasRole, validateRequest({ params: integranteIdParamsSchema, body: updateIntegranteBodySchema }), integrantesController.update);
router.delete('/:id', ensureAuthenticated, ensureHasRole, validateRequest({ params: integranteIdParamsSchema }), integrantesController.delete);

/** Junction: Funções musicais (Users_Funcoes) */
router.get('/:integranteId/funcoes', ensureAuthenticated, validateRequest({ params: integranteFuncaoParamsSchema }), integrantesController.listFuncoes);
router.post('/:integranteId/funcoes', ensureAuthenticated, ensureHasRole, validateRequest({ params: integranteFuncaoParamsSchema, body: addFuncaoBodySchema }), integrantesController.addFuncao);
router.delete('/:integranteId/funcoes/:funcaoId', ensureAuthenticated, ensureHasRole, validateRequest({ params: integranteFuncaoRemoveParamsSchema }), integrantesController.removeFuncao);

export default router;
