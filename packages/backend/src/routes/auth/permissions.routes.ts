/**
 * @module permissions.routes
 * @description Rota de criação de permissões no sistema.
 * Protegida e restrita ao papel "admin".
 */

import { Router } from 'express';
import permissionsController from '../../controllers/auth/permissions.controller.js';
import { ensureAuthenticated } from '../../middlewares/ensureAuthenticated.js';
import { is } from '../../middlewares/is.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { createPermissionBodySchema } from '../../validators/auth.validators.js';

const router: Router = Router();

/** Criação de uma nova permissão no sistema. */
router.post('/', validateRequest({ body: createPermissionBodySchema }), ensureAuthenticated, is(['admin']), permissionsController.create);

export default router;
