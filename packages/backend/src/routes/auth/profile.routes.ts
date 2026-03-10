/**
 * @module profile.routes
 * @description Rotas de perfil do usuário autenticado.
 * Todas as rotas são protegidas por autenticação.
 */

import { Router } from 'express';
import profileController from '../../controllers/auth/profile.controller.js';
import { ensureAuthenticated } from '../../middlewares/ensureAuthenticated.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { updateProfileBodySchema } from '../../validators/auth.validators.js';

const router: Router = Router();

/** Consulta dos dados do perfil do usuário autenticado. */
router.get('/', ensureAuthenticated, profileController.show);

/** Atualização dos dados do perfil do usuário autenticado. */
router.put('/', ensureAuthenticated, validateRequest({ body: updateProfileBodySchema }), profileController.update);

export default router;
