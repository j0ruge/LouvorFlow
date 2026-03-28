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
import {
    acceptInviteBodySchema,
    tokenParamSchema,
    inviteIdParamSchema,
} from '../validators/convites.validators.js';

const router: Router = Router();

// ─── Rotas autenticadas (líder) ────────────────────────────────────────────

/** Gera um novo link de convite para o tenant do líder. */
router.post('/', ensureAuthenticated, ensureTenantContext, can(['integrantes.write']), convitesController.create);

/** Lista todos os convites do tenant do líder. */
router.get('/', ensureAuthenticated, ensureTenantContext, can(['integrantes.write']), convitesController.index);

/** Revoga um convite ativo antes de ser utilizado. */
router.delete('/:id', ensureAuthenticated, ensureTenantContext, can(['integrantes.write']), validateRequest({ params: inviteIdParamSchema }), convitesController.revoke);

// ─── Rotas públicas (participante) ─────────────────────────────────────────

/** Valida o estado de um token de convite e retorna nome do tenant. */
router.get('/:token/validate', validateRequest({ params: tokenParamSchema }), convitesController.validate);

/** Aceita um convite: cria conta ou vincula conta existente ao tenant. */
router.post('/:token/accept', validateRequest({ params: tokenParamSchema, body: acceptInviteBodySchema }), convitesController.accept);

export default router;
