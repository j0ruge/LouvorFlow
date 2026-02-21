import { Router } from 'express';
import categoriasController from '../controllers/categorias.controller.js';

const router: Router = Router();

router.get('/', categoriasController.index);
router.get('/:id', categoriasController.show);
router.post('/', categoriasController.create);
router.put('/:id', categoriasController.update);
router.delete('/:id', categoriasController.delete);

export default router;
