import { Router } from 'express';
import healthController from '../controllers/health.controller.js';

/**
 * Rotas de health check da API.
 *
 * Endpoint público (sem autenticação nem contexto de tenant) montado em
 * `/api/health`, consumido pelo healthcheck do container e pelo smoke test
 * pós-deploy do CI/CD.
 */
const router: Router = Router();

router.get('/', healthController.index);

export default router;
