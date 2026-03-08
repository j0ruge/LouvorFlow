/**
 * @module sessions.routes
 * @description Rotas de autenticação: login, refresh de token e logout.
 */

import { Router } from 'express';
import sessionsController from '../../controllers/auth/sessions.controller.js';
import refreshTokenController from '../../controllers/auth/refresh-token.controller.js';
import logoutController from '../../controllers/auth/logout.controller.js';
import { ensureAuthenticated } from '../../middlewares/ensureAuthenticated.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { loginBodySchema, refreshTokenBodySchema } from '../../validators/auth.validators.js';

const router: Router = Router();

/** Rota pública para criação de sessão (login). */
router.post('/', validateRequest({ body: loginBodySchema }), sessionsController.create);

/** Rota pública para renovação do token de acesso via refresh token. */
router.post('/refresh-token', validateRequest({ body: refreshTokenBodySchema }), refreshTokenController.create);

/** Rota protegida para encerramento de sessão (logout). */
router.post('/logout', ensureAuthenticated, logoutController.create);

export default router;
