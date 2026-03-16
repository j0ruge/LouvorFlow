/**
 * Rotas do recurso de músicas.
 *
 * Define os endpoints REST para CRUD de músicas e suas junções
 * com versões (artistas), categorias e funções.
 * GETs exigem autenticação; POST/PUT/DELETE exigem autenticação + role.
 */
import { Router } from 'express';
import musicasController from '../controllers/musicas.controller.js';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated.js';
import { ensureHasRole } from '../middlewares/ensureHasRole.js';

const router: Router = Router();

// Base CRUD
router.get('/', ensureAuthenticated, musicasController.index);
router.post('/complete', ensureAuthenticated, ensureHasRole, musicasController.createComplete);
router.get('/:id', ensureAuthenticated, musicasController.show);
router.post('/', ensureAuthenticated, ensureHasRole, musicasController.create);
router.put('/:id/complete', ensureAuthenticated, ensureHasRole, musicasController.updateComplete);
router.put('/:id', ensureAuthenticated, ensureHasRole, musicasController.update);
router.delete('/:id', ensureAuthenticated, ensureHasRole, musicasController.delete);

// Junction: Versoes (artistas_musicas)
router.get('/:musicaId/versoes', ensureAuthenticated, musicasController.listVersoes);
router.post('/:musicaId/versoes', ensureAuthenticated, ensureHasRole, musicasController.addVersao);
router.put('/:musicaId/versoes/:versaoId', ensureAuthenticated, ensureHasRole, musicasController.updateVersao);
router.delete('/:musicaId/versoes/:versaoId', ensureAuthenticated, ensureHasRole, musicasController.removeVersao);

// Junction: Categorias (musicas_categorias)
router.get('/:musicaId/categorias', ensureAuthenticated, musicasController.listCategorias);
router.post('/:musicaId/categorias', ensureAuthenticated, ensureHasRole, musicasController.addCategoria);
router.delete('/:musicaId/categorias/:categoriaId', ensureAuthenticated, ensureHasRole, musicasController.removeCategoria);

// Junction: Funcoes (musicas_funcoes)
router.get('/:musicaId/funcoes', ensureAuthenticated, musicasController.listFuncoes);
router.post('/:musicaId/funcoes', ensureAuthenticated, ensureHasRole, musicasController.addFuncao);
router.delete('/:musicaId/funcoes/:funcaoId', ensureAuthenticated, ensureHasRole, musicasController.removeFuncao);

export default router;
