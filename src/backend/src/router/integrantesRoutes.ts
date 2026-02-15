import { Router } from 'express';
import integrantesController from '../controllers/integrantesController.js';

const router: Router = Router();

// Base CRUD
router.get('/', integrantesController.index);
router.get('/:id', integrantesController.show);
router.post('/', integrantesController.create);
router.put('/:id', integrantesController.update);
router.delete('/:id', integrantesController.delete);

// Junction: Funcoes (integrantes_funcoes)
router.get('/:integranteId/funcoes', integrantesController.listFuncoes);
router.post('/:integranteId/funcoes', integrantesController.addFuncao);
router.delete('/:integranteId/funcoes/:funcaoId', integrantesController.removeFuncao);

export default router;
