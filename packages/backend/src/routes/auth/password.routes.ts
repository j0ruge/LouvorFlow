/**
 * @module password.routes
 * @description Rotas públicas para recuperação e redefinição de senha.
 * Nenhuma autenticação é necessária.
 */

import { Router } from 'express';
import forgotPasswordController from '../../controllers/auth/forgot-password.controller.js';
import resetPasswordController from '../../controllers/auth/reset-password.controller.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { rateLimit } from '../../middlewares/rateLimit.js';
import { forgotPasswordBodySchema, resetPasswordBodySchema } from '../../validators/auth.validators.js';

const router: Router = Router();

/** Janela de contagem dos limitadores das rotas públicas: 15 minutos. */
const PUBLIC_WINDOW_MS = 15 * 60 * 1000;

/**
 * Limitador da solicitação de recuperação: cada requisição dispara um envio de
 * e-mail. Sem limite, a rota permite enumerar contas e usar o servidor como
 * mail bomb contra um endereço alheio.
 */
const forgotLimiter = rateLimit({
    windowMs: PUBLIC_WINDOW_MS,
    max: 5,
    message: 'Muitas solicitações de recuperação de senha. Tente novamente em alguns minutos.',
});

/**
 * Limitador da redefinição: o token de recuperação é a única credencial aqui,
 * então a rota precisa barrar tentativa de adivinhação por força bruta.
 */
const resetLimiter = rateLimit({
    windowMs: PUBLIC_WINDOW_MS,
    max: 10,
    message: 'Muitas tentativas de redefinição de senha. Tente novamente em alguns minutos.',
});

/** Solicitação de recuperação de senha (envia e-mail com token). */
router.post('/forgot', forgotLimiter, validateRequest({ body: forgotPasswordBodySchema }), forgotPasswordController.create);

/** Redefinição de senha utilizando o token recebido por e-mail. */
router.post('/reset', resetLimiter, validateRequest({ body: resetPasswordBodySchema }), resetPasswordController.create);

export default router;
