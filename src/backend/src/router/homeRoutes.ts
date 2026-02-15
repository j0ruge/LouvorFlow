import { Router } from 'express';
import homeController from '../controllers/homeController.js';

const router: Router = Router();

// Rotas de Home
router.get('/', homeController.index);

export default router;
