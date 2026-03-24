/**
 * Rotas do recurso de tipos de eventos.
 *
 * Define os endpoints REST para CRUD de tipos de eventos.
 * GETs exigem autenticação; POST/PUT/DELETE exigem permissão `configuracoes.write`.
 */
import { Router } from 'express';
import tiposEventosController from '../controllers/tipos-eventos.controller.js';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated.js';
import { ensureTenantContext } from '../middlewares/ensureTenantContext.js';
import { can } from '../middlewares/can.js';

const router: Router = Router();

router.get('/', ensureAuthenticated, ensureTenantContext, tiposEventosController.index);
router.get('/:id', ensureAuthenticated, ensureTenantContext, tiposEventosController.show);
router.post('/', ensureAuthenticated, ensureTenantContext, can(['configuracoes.write']), tiposEventosController.create);
router.put('/:id', ensureAuthenticated, ensureTenantContext, can(['configuracoes.write']), tiposEventosController.update);
router.delete('/:id', ensureAuthenticated, ensureTenantContext, can(['configuracoes.write']), tiposEventosController.delete);

export default router;
