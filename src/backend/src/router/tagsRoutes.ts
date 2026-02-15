import { Router } from 'express';
import tagsController from '../controllers/tagsController.js';

const router: Router = Router();

router.get('/', tagsController.index);
router.get('/:id', tagsController.show);
router.post('/', tagsController.create);
router.put('/:id', tagsController.update);
router.delete('/:id', tagsController.delete);

export default router;
