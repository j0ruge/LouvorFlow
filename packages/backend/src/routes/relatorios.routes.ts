/**
 * Rotas do recurso de relatórios.
 *
 * Define os endpoints REST para consulta de dados agregados
 * de relatórios do ministério.
 * Exige autenticação para acesso.
 */

import { Router } from 'express';
import relatoriosController from '../controllers/relatorios.controller.js';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated.js';
import { ensureTenantContext } from '../middlewares/ensureTenantContext.js';

const router: Router = Router();

/** GET /resumo — retorna o resumo completo de relatórios. */
router.get('/resumo', ensureAuthenticated, ensureTenantContext, relatoriosController.resumo);

export default router;
