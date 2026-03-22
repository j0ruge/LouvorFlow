/**
 * Rotas do recurso de tonalidades.
 *
 * Define os endpoints REST para CRUD de tonalidades musicais.
 * GETs exigem autenticação; POST/PUT/DELETE exigem permissão `configuracoes.write`.
 */
import { Router } from 'express';
import tonalidadesController from '../controllers/tonalidades.controller.js';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated.js';
import { ensureTenantContext } from '../middlewares/ensureTenantContext.js';
import { can } from '../middlewares/can.js';

const router: Router = Router();

router.get('/', ensureAuthenticated, ensureTenantContext, tonalidadesController.index);
router.get('/:id', ensureAuthenticated, ensureTenantContext, tonalidadesController.show);
router.post('/', ensureAuthenticated, ensureTenantContext, can(['configuracoes.write']), tonalidadesController.create);
router.put('/:id', ensureAuthenticated, ensureTenantContext, can(['configuracoes.write']), tonalidadesController.update);
router.delete('/:id', ensureAuthenticated, ensureTenantContext, can(['configuracoes.write']), tonalidadesController.delete);

export default router;
