import { Router } from 'express';
import tiposEventosController from '../controllers/tiposEventosController.js';

const router: Router = Router();

router.get('/', tiposEventosController.index);
router.get('/:id', tiposEventosController.show);
router.post('/', tiposEventosController.create);
router.put('/:id', tiposEventosController.update);
router.delete('/:id', tiposEventosController.delete);

export default router;
