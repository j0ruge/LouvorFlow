/**
 * Rotas do módulo de convites para onboarding de integrantes.
 *
 * Combina rotas autenticadas (líder: gerar, listar, revogar)
 * e rotas públicas (participante: validar token, aceitar convite).
 */
import { Router } from 'express';
import convitesController from '../controllers/convites.controller.js';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated.js';
import { ensureTenantContext } from '../middlewares/ensureTenantContext.js';
import { can } from '../middlewares/can.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { rateLimit } from '../middlewares/rateLimit.js';
import {
    acceptInviteBodySchema,
    tokenParamSchema,
    inviteIdParamSchema,
} from '../validators/convites.validators.js';

const router: Router = Router();

/** Janela de contagem dos limitadores das rotas públicas: 15 minutos. */
const PUBLIC_WINDOW_MS = 15 * 60 * 1000;

/**
 * Limitador da aceitação de convite: protege o `bcrypt.compare` contra brute force
 * de senha e exaustão de CPU. Limite baixo, pois é uma ação rara por usuário.
 */
const acceptLimiter = rateLimit({
    windowMs: PUBLIC_WINDOW_MS,
    max: 10,
    message: 'Muitas tentativas de aceitar convite. Tente novamente em alguns minutos.',
});

/** Limitador da validação de token: mais permissivo (somente leitura), barra varredura. */
const validateLimiter = rateLimit({
    windowMs: PUBLIC_WINDOW_MS,
    max: 30,
    message: 'Muitas requisições. Tente novamente em alguns minutos.',
});

// ─── Rotas autenticadas (líder) ────────────────────────────────────────────

/** Gera um novo link de convite para o tenant do líder. */
router.post('/', ensureAuthenticated, ensureTenantContext, can(['integrantes.write']), convitesController.create);

/** Lista todos os convites do tenant do líder. */
router.get('/', ensureAuthenticated, ensureTenantContext, can(['integrantes.write']), convitesController.index);

/** Revoga um convite ativo antes de ser utilizado. */
router.delete('/:id', ensureAuthenticated, ensureTenantContext, can(['integrantes.write']), validateRequest({ params: inviteIdParamSchema }), convitesController.revoke);

// ─── Rotas públicas (participante) ─────────────────────────────────────────

/** Valida o estado de um token de convite e retorna nome do tenant. */
router.get('/:token/validate', validateLimiter, validateRequest({ params: tokenParamSchema }), convitesController.validate);

/** Aceita um convite: cria conta ou vincula conta existente ao tenant. */
router.post('/:token/accept', acceptLimiter, validateRequest({ params: tokenParamSchema, body: acceptInviteBodySchema }), convitesController.accept);

export default router;
