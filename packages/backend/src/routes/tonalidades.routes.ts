/**
 * Rotas do recurso de tonalidades.
 *
 * Define os endpoints REST para CRUD de tonalidades musicais.
 * GETs exigem autenticação; POST/PUT/DELETE exigem permissão `configuracoes.write`.
 */
import { Router } from 'express';
import tonalidadesController from '../controllers/tonalidades.controller.js';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated.js';
import { can } from '../middlewares/can.js';

const router: Router = Router();

router.get('/', ensureAuthenticated, tonalidadesController.index);
router.get('/:id', ensureAuthenticated, tonalidadesController.show);
router.post('/', ensureAuthenticated, can(['configuracoes.write']), tonalidadesController.create);
router.put('/:id', ensureAuthenticated, can(['configuracoes.write']), tonalidadesController.update);
router.delete('/:id', ensureAuthenticated, can(['configuracoes.write']), tonalidadesController.delete);

export default router;
