/**
 * @module password.routes
 * @description Rotas públicas para recuperação e redefinição de senha.
 * Nenhuma autenticação é necessária.
 */

import { Router } from 'express';
import forgotPasswordController from '../../controllers/auth/forgot-password.controller.js';
import resetPasswordController from '../../controllers/auth/reset-password.controller.js';
import { validateRequest } from '../../middlewares/validateRequest.js';
import { forgotPasswordBodySchema, resetPasswordBodySchema } from '../../validators/auth.validators.js';

const router: Router = Router();

/** Solicitação de recuperação de senha (envia e-mail com token). */
router.post('/forgot', validateRequest({ body: forgotPasswordBodySchema }), forgotPasswordController.create);

/** Redefinição de senha utilizando o token recebido por e-mail. */
router.post('/reset', validateRequest({ body: resetPasswordBodySchema }), resetPasswordController.create);

export default router;
