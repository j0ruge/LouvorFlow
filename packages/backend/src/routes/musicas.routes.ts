/**
 * Rotas do recurso de músicas.
 *
 * Define os endpoints REST para CRUD de músicas e suas junções
 * com versões (artistas), categorias e funções.
 * GETs exigem autenticação; POST/PUT/DELETE exigem permissão `musicas.write`.
 */
import { Router } from 'express';
import musicasController from '../controllers/musicas.controller.js';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated.js';
import { can } from '../middlewares/can.js';

const router: Router = Router();

// Base CRUD
router.get('/', ensureAuthenticated, musicasController.index);
router.post('/complete', ensureAuthenticated, can(['musicas.write']), musicasController.createComplete);
router.get('/:id', ensureAuthenticated, musicasController.show);
router.post('/', ensureAuthenticated, can(['musicas.write']), musicasController.create);
router.put('/:id/complete', ensureAuthenticated, can(['musicas.write']), musicasController.updateComplete);
router.put('/:id', ensureAuthenticated, can(['musicas.write']), musicasController.update);
router.delete('/:id', ensureAuthenticated, can(['musicas.write']), musicasController.delete);

// Junction: Versoes (artistas_musicas)
router.get('/:musicaId/versoes', ensureAuthenticated, musicasController.listVersoes);
router.post('/:musicaId/versoes', ensureAuthenticated, can(['musicas.write']), musicasController.addVersao);
router.put('/:musicaId/versoes/:versaoId', ensureAuthenticated, can(['musicas.write']), musicasController.updateVersao);
router.delete('/:musicaId/versoes/:versaoId', ensureAuthenticated, can(['musicas.write']), musicasController.removeVersao);

// Junction: Categorias (musicas_categorias)
router.get('/:musicaId/categorias', ensureAuthenticated, musicasController.listCategorias);
router.post('/:musicaId/categorias', ensureAuthenticated, can(['musicas.write']), musicasController.addCategoria);
router.delete('/:musicaId/categorias/:categoriaId', ensureAuthenticated, can(['musicas.write']), musicasController.removeCategoria);

// Junction: Funcoes (musicas_funcoes)
router.get('/:musicaId/funcoes', ensureAuthenticated, musicasController.listFuncoes);
router.post('/:musicaId/funcoes', ensureAuthenticated, can(['musicas.write']), musicasController.addFuncao);
router.delete('/:musicaId/funcoes/:funcaoId', ensureAuthenticated, can(['musicas.write']), musicasController.removeFuncao);

export default router;
