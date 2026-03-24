/**
 * Rotas do recurso de categorias.
 *
 * Define os endpoints REST para CRUD de categorias.
 * GETs exigem autenticação; POST/PUT/DELETE exigem permissão `configuracoes.write`.
 * Validação de entrada via Zod em rotas com params/body.
 */
import { Router } from 'express';
import categoriasController from '../controllers/categorias.controller.js';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated.js';
import { ensureTenantContext } from '../middlewares/ensureTenantContext.js';
import { can } from '../middlewares/can.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import {
    categoriaIdParamsSchema,
    createCategoriaBodySchema,
    updateCategoriaBodySchema,
} from '../validators/categorias.validators.js';

const router: Router = Router();

router.get('/', ensureAuthenticated, ensureTenantContext, categoriasController.index);
router.get('/:id', ensureAuthenticated, ensureTenantContext, validateRequest({ params: categoriaIdParamsSchema }), categoriasController.show);
router.post('/', ensureAuthenticated, ensureTenantContext, can(['configuracoes.write']), validateRequest({ body: createCategoriaBodySchema }), categoriasController.create);
router.put('/:id', ensureAuthenticated, ensureTenantContext, can(['configuracoes.write']), validateRequest({ params: categoriaIdParamsSchema, body: updateCategoriaBodySchema }), categoriasController.update);
router.delete('/:id', ensureAuthenticated, ensureTenantContext, can(['configuracoes.write']), validateRequest({ params: categoriaIdParamsSchema }), categoriasController.delete);

export default router;
