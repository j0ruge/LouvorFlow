/**
 * Rotas do recurso de artistas.
 *
 * Define os endpoints REST para CRUD de artistas.
 * GETs exigem autenticação; POST/PUT/DELETE exigem permissão `configuracoes.write`.
 */
import { Router } from 'express';
import artistasController from '../controllers/artistas.controller.js';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated.js';
import { ensureTenantContext } from '../middlewares/ensureTenantContext.js';
import { can } from '../middlewares/can.js';

const router: Router = Router();

router.get('/', ensureAuthenticated, ensureTenantContext, artistasController.index);
router.get('/:id', ensureAuthenticated, ensureTenantContext, artistasController.show);
router.post('/', ensureAuthenticated, ensureTenantContext, can(['configuracoes.write']), artistasController.create);
router.put('/:id', ensureAuthenticated, ensureTenantContext, can(['configuracoes.write']), artistasController.update);
router.delete('/:id', ensureAuthenticated, ensureTenantContext, can(['configuracoes.write']), artistasController.delete);

export default router;
