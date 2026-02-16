import { Router } from 'express';
import artistasController from '../controllers/artistas.controller.js';

const router: Router = Router();

router.get('/', artistasController.index);
router.get('/:id', artistasController.show);
router.post('/', artistasController.create);
router.put('/:id', artistasController.update);
router.delete('/:id', artistasController.delete);

export default router;
