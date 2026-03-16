/**
 * Rotas do recurso de categorias.
 *
 * Define os endpoints REST para CRUD de categorias.
 * GETs exigem autenticação; POST/PUT/DELETE exigem permissão `configuracoes.write`.
 */
import { Router } from 'express';
import categoriasController from '../controllers/categorias.controller.js';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated.js';
import { can } from '../middlewares/can.js';

const router: Router = Router();

router.get('/', ensureAuthenticated, categoriasController.index);
router.get('/:id', ensureAuthenticated, categoriasController.show);
router.post('/', ensureAuthenticated, can(['configuracoes.write']), categoriasController.create);
router.put('/:id', ensureAuthenticated, can(['configuracoes.write']), categoriasController.update);
router.delete('/:id', ensureAuthenticated, can(['configuracoes.write']), categoriasController.delete);

export default router;
