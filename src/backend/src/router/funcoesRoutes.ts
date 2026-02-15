import { Router } from 'express';
import funcoesController from '../controllers/funcoesController.js';

const router: Router = Router();

router.get('/', funcoesController.index);
router.get('/:id', funcoesController.show);
router.post('/', funcoesController.create);
router.put('/:id', funcoesController.update);
router.delete('/:id', funcoesController.delete);

export default router;
