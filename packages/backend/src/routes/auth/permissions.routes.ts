/**
 * @module permissions.routes
 * @description Rota de criação de permissões no sistema.
 * Protegida e restrita ao papel "admin".
 */

import { Router } from 'express';
import permissionsController from '../../controllers/auth/permissions.controller.js';
import { ensureAuthenticated } from '../../middlewares/ensureAuthenticated.js';
import { ensureTenantContext } from '../../middlewares/ensureTenantContext.js';
import { is } from '../../middlewares/is.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { createPermissionBodySchema, paginationQuerySchema } from '../../validators/auth.validators.js';

const router: Router = Router();

/** Listagem de todas as permissões do sistema. */
router.get('/', ensureAuthenticated, ensureTenantContext, is(['admin', 'super-admin']), validateRequest({ query: paginationQuerySchema }), permissionsController.list);

/** Criação de uma nova permissão no sistema. */
router.post('/', ensureAuthenticated, ensureTenantContext, is(['admin', 'super-admin']), validateRequest({ body: createPermissionBodySchema }), permissionsController.create);

export default router;
