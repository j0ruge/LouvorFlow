import { Router } from 'express';
import musicasController from '../controllers/musicas.controller.js';

const router: Router = Router();

// Base CRUD
router.get('/', musicasController.index);
router.get('/:id', musicasController.show);
router.post('/', musicasController.create);
router.put('/:id', musicasController.update);
router.delete('/:id', musicasController.delete);

// Junction: Versoes (artistas_musicas)
router.get('/:musicaId/versoes', musicasController.listVersoes);
router.post('/:musicaId/versoes', musicasController.addVersao);
router.put('/:musicaId/versoes/:versaoId', musicasController.updateVersao);
router.delete('/:musicaId/versoes/:versaoId', musicasController.removeVersao);

// Junction: Tags (musicas_tags)
router.get('/:musicaId/tags', musicasController.listTags);
router.post('/:musicaId/tags', musicasController.addTag);
router.delete('/:musicaId/tags/:tagId', musicasController.removeTag);

// Junction: Funcoes (musicas_funcoes)
router.get('/:musicaId/funcoes', musicasController.listFuncoes);
router.post('/:musicaId/funcoes', musicasController.addFuncao);
router.delete('/:musicaId/funcoes/:funcaoId', musicasController.removeFuncao);

export default router;
