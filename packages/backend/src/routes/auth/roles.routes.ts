/**
 * @module roles.routes
 * @description Rotas de gerenciamento de papéis (roles) e atribuição de permissões a papéis.
 * Todas as rotas são protegidas e restritas ao papel "admin".
 */

import { Router } from 'express';
import rolesController from '../../controllers/auth/roles.controller.js';
import rolePermissionsController from '../../controllers/auth/role-permissions.controller.js';
import { ensureAuthenticated } from '../../middlewares/ensureAuthenticated.js';
import { ensureTenantContext } from '../../middlewares/ensureTenantContext.js';
import { is } from '../../middlewares/is.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { createRoleBodySchema, roleIdParamsSchema, rolePermissionsBodySchema, paginationQuerySchema } from '../../validators/auth.validators.js';

const router: Router = Router();

/** Listagem de todos os papéis (roles) do sistema com permissões. */
router.get('/', ensureAuthenticated, ensureTenantContext, is(['admin', 'super-admin']), validateRequest({ query: paginationQuerySchema }), rolesController.list);

/** Criação de um novo papel (role) no sistema. */
router.post('/', ensureAuthenticated, ensureTenantContext, is(['admin', 'super-admin']), validateRequest({ body: createRoleBodySchema }), rolesController.create);

/** Atribuição de permissões a um papel específico. */
router.post('/:roleId/permissions', ensureAuthenticated, ensureTenantContext, is(['admin', 'super-admin']), validateRequest({ params: roleIdParamsSchema, body: rolePermissionsBodySchema }), rolePermissionsController.create);

export default router;
