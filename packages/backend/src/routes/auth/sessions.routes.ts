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
import { rateLimit } from '../../middlewares/rateLimit.js';
import { loginBodySchema, refreshTokenBodySchema, selectTenantBodySchema, switchTenantBodySchema } from '../../validators/auth.validators.js';

const router: Router = Router();

/** Janela de contagem dos limitadores das rotas públicas: 15 minutos. */
const PUBLIC_WINDOW_MS = 15 * 60 * 1000;

/**
 * Limitador do login: protege o `bcrypt.compare` (cost 12) contra brute force
 * de senha, credential stuffing e exaustão de CPU. O limite acomoda erros
 * legítimos de digitação sem abrir espaço para varredura automatizada.
 */
const loginLimiter = rateLimit({
    windowMs: PUBLIC_WINDOW_MS,
    max: 10,
    message: 'Muitas tentativas de login. Tente novamente em alguns minutos.',
});

/**
 * Limitador das trocas de token públicas (refresh e seleção de tenant):
 * barra a varredura de tokens por força bruta. Mais permissivo que o login,
 * pois um cliente legítimo renova a sessão várias vezes na mesma janela.
 */
const tokenExchangeLimiter = rateLimit({
    windowMs: PUBLIC_WINDOW_MS,
    max: 60,
    message: 'Muitas requisições. Tente novamente em alguns minutos.',
});

/** Rota pública para criação de sessão (login). */
router.post('/', loginLimiter, validateRequest({ body: loginBodySchema }), sessionsController.create);

/** Rota pública para renovação do token de acesso via refresh token. */
router.post('/refresh-token', tokenExchangeLimiter, validateRequest({ body: refreshTokenBodySchema }), refreshTokenController.create);

/** Rota pública para seleção de tenant no fluxo multi-tenant (POST /api/sessions/select-tenant). */
router.post('/select-tenant', tokenExchangeLimiter, validateRequest({ body: selectTenantBodySchema }), sessionsController.selectTenant);

/** Rota protegida para troca de tenant sem re-login (POST /api/sessions/switch-tenant). */
router.post('/switch-tenant', ensureAuthenticated, validateRequest({ body: switchTenantBodySchema }), sessionsController.switchTenant);

/** Rota protegida para encerramento de sessão (logout). */
router.post('/logout', ensureAuthenticated, logoutController.create);

export default router;
