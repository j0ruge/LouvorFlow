import { Router } from 'express';
import tonalidadesController from '../controllers/tonalidadesController.js';

const router = Router();

router.get('/', tonalidadesController.index);
router.get('/:id', tonalidadesController.show);
router.post('/', tonalidadesController.create);
router.put('/:id', tonalidadesController.update);
router.delete('/:id', tonalidadesController.delete);

export default router;
