/**
 * Rotas de gestão de igrejas (tenants).
 *
 * Define os endpoints REST para CRUD de tenants e gerenciamento
 * de vínculos de usuários por igreja. Todos os endpoints exigem
 * autenticação JWT válida e papel `super-admin` (sentinela do tenant de sistema).
 *
 * Cadeia de middleware: `ensureAuthenticated → ensureSuperAdmin → validateRequest → controller`
 */
import { Router } from 'express';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated.js';
import { ensureSuperAdmin } from '../middlewares/ensureSuperAdmin.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import igrejasController from '../controllers/igrejas.controller.js';
import {
  createTenantBodySchema,
  updateTenantBodySchema,
  tenantIdParamSchema,
  addUserToTenantBodySchema,
  removeUserFromTenantParamsSchema,
} from '../validators/igrejas.validators.js';

const router: Router = Router();

/** Listagem de todas as igrejas (tenants). */
router.get('/', ensureAuthenticated, ensureSuperAdmin, igrejasController.index);

/** Detalhes de uma igreja por ID. */
router.get(
  '/:id',
  ensureAuthenticated,
  ensureSuperAdmin,
  validateRequest({ params: tenantIdParamSchema }),
  igrejasController.show,
);

/** Criação de nova igreja. */
router.post(
  '/',
  ensureAuthenticated,
  ensureSuperAdmin,
  validateRequest({ body: createTenantBodySchema }),
  igrejasController.create,
);

/** Atualização de dados de uma igreja. */
router.put(
  '/:id',
  ensureAuthenticated,
  ensureSuperAdmin,
  validateRequest({ params: tenantIdParamSchema, body: updateTenantBodySchema }),
  igrejasController.update,
);

/** Desativação (soft delete) de uma igreja. */
router.delete(
  '/:id',
  ensureAuthenticated,
  ensureSuperAdmin,
  validateRequest({ params: tenantIdParamSchema }),
  igrejasController.destroy,
);

/** Listagem dos usuários vinculados a uma igreja. */
router.get(
  '/:id/users',
  ensureAuthenticated,
  ensureSuperAdmin,
  validateRequest({ params: tenantIdParamSchema }),
  igrejasController.listUsers,
);

/** Vínculo de um usuário a uma igreja. */
router.post(
  '/:id/users',
  ensureAuthenticated,
  ensureSuperAdmin,
  validateRequest({ params: tenantIdParamSchema, body: addUserToTenantBodySchema }),
  igrejasController.addUser,
);

/** Remoção do vínculo de um usuário com uma igreja. */
router.delete(
  '/:id/users/:userId',
  ensureAuthenticated,
  ensureSuperAdmin,
  validateRequest({ params: removeUserFromTenantParamsSchema }),
  igrejasController.removeUser,
);

export default router;
