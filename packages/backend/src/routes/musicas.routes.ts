import { Router } from 'express';
import musicasController from '../controllers/musicas.controller.js';

const router: Router = Router();

// Base CRUD
router.get('/', musicasController.index);
router.post('/complete', musicasController.createComplete);
router.get('/:id', musicasController.show);
router.post('/', musicasController.create);
router.put('/:id/complete', musicasController.updateComplete);
router.put('/:id', musicasController.update);
router.delete('/:id', musicasController.delete);

// Junction: Versoes (artistas_musicas)
router.get('/:musicaId/versoes', musicasController.listVersoes);
router.post('/:musicaId/versoes', musicasController.addVersao);
router.put('/:musicaId/versoes/:versaoId', musicasController.updateVersao);
router.delete('/:musicaId/versoes/:versaoId', musicasController.removeVersao);

// Junction: Categorias (musicas_categorias)
router.get('/:musicaId/categorias', musicasController.listCategorias);
router.post('/:musicaId/categorias', musicasController.addCategoria);
router.delete('/:musicaId/categorias/:categoriaId', musicasController.removeCategoria);

// Junction: Funcoes (musicas_funcoes)
router.get('/:musicaId/funcoes', musicasController.listFuncoes);
router.post('/:musicaId/funcoes', musicasController.addFuncao);
router.delete('/:musicaId/funcoes/:funcaoId', musicasController.removeFuncao);

export default router;
