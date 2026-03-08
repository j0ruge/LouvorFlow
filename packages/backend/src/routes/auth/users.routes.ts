/**
 * @module users.routes
 * @description Rotas de gerenciamento de usuários e suas listas de controle de acesso (ACL).
 * Todas as rotas são protegidas e restritas ao papel "admin".
 */

import { Router } from 'express';
import usersController from '../../controllers/auth/users.controller.js';
import userAclController from '../../controllers/auth/user-acl.controller.js';
import { ensureAuthenticated } from '../../middlewares/ensureAuthenticated.js';
import { is } from '../../middlewares/is.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { createUserBodySchema, userIdParamsSchema, userAclBodySchema } from '../../validators/auth.validators.js';

const router: Router = Router();

/** Criação de um novo usuário no sistema. */
router.post('/', validateRequest({ body: createUserBodySchema }), ensureAuthenticated, is(['admin']), usersController.create);

/** Atribuição de permissões/papéis a um usuário específico. */
router.post('/acl/:userId', validateRequest({ params: userIdParamsSchema, body: userAclBodySchema }), ensureAuthenticated, is(['admin']), userAclController.create);

/** Consulta das permissões/papéis atribuídos a um usuário específico. */
router.get('/acl/:userId', validateRequest({ params: userIdParamsSchema }), ensureAuthenticated, is(['admin']), userAclController.show);

export default router;
