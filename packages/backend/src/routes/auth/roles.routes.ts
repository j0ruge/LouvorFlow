/**
 * @module roles.routes
 * @description Rotas de gerenciamento de papéis (roles) e atribuição de permissões a papéis.
 * Todas as rotas são protegidas e restritas ao papel "admin".
 */

import { Router } from 'express';
import rolesController from '../../controllers/auth/roles.controller.js';
import rolePermissionsController from '../../controllers/auth/role-permissions.controller.js';
import { ensureAuthenticated } from '../../middlewares/ensureAuthenticated.js';
import { is } from '../../middlewares/is.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { createRoleBodySchema, roleIdParamsSchema, rolePermissionsBodySchema } from '../../validators/auth.validators.js';

const router: Router = Router();

/** Criação de um novo papel (role) no sistema. */
router.post('/', ensureAuthenticated, is(['admin']), validateRequest({ body: createRoleBodySchema }), rolesController.create);

/** Atribuição de permissões a um papel específico. */
router.post('/:roleId/permissions', ensureAuthenticated, is(['admin']), validateRequest({ params: roleIdParamsSchema, body: rolePermissionsBodySchema }), rolePermissionsController.create);

export default router;
