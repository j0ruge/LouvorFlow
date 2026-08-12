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

/** Limite padrão de tentativas de login por IP na janela — vale para produção. */
const LOGIN_MAX_PADRAO = 10;

/**
 * Limitador do login: protege o `bcrypt.compare` (cost 12) contra brute force
 * de senha, credential stuffing e exaustão de CPU. O limite acomoda erros
 * legítimos de digitação sem abrir espaço para varredura automatizada.
 *
 * `LOGIN_RATE_LIMIT_MAX` existe para a suíte E2E, que roda dezenas de logins
 * legítimos do mesmo IP e, com o limite de produção, falhava em massa com 429 a
 * partir do 10º. **Definir apenas em ambiente de desenvolvimento** — sem a
 * variável o limite segue sendo {@link LOGIN_MAX_PADRAO}.
 */
const loginLimiter = rateLimit({
    windowMs: PUBLIC_WINDOW_MS,
    max: Number(process.env.LOGIN_RATE_LIMIT_MAX) || LOGIN_MAX_PADRAO,
    message: 'Muitas tentativas de login. Tente novamente em alguns minutos.',
});

/** Limite padrão de trocas de token por IP na janela — vale para produção. */
const TOKEN_EXCHANGE_MAX_PADRAO = 60;

/**
 * Limitador das trocas de token públicas (refresh e seleção de tenant):
 * barra a varredura de tokens por força bruta. Mais permissivo que o login,
 * pois um cliente legítimo renova a sessão várias vezes na mesma janela.
 *
 * `TOKEN_EXCHANGE_RATE_LIMIT_MAX` existe para a suíte E2E: cada carga de página
 * renova a sessão, e uma execução completa passa de 60 renovações do mesmo IP em
 * 15 min. **Definir apenas em ambiente de desenvolvimento** — sem a variável o
 * limite segue sendo {@link TOKEN_EXCHANGE_MAX_PADRAO}.
 */
const tokenExchangeLimiter = rateLimit({
    windowMs: PUBLIC_WINDOW_MS,
    max: Number(process.env.TOKEN_EXCHANGE_RATE_LIMIT_MAX) || TOKEN_EXCHANGE_MAX_PADRAO,
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
