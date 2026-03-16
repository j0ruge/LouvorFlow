/**
 * Rotas do recurso de eventos.
 *
 * Define os endpoints REST para CRUD de eventos e suas junções
 * com músicas e integrantes.
 * GETs exigem autenticação; POST/PUT/DELETE exigem autenticação + role.
 */
import { Router } from 'express';
import eventosController from '../controllers/eventos.controller.js';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated.js';
import { ensureHasRole } from '../middlewares/ensureHasRole.js';

const router: Router = Router();

// Base CRUD
router.get('/', ensureAuthenticated, eventosController.index);
router.get('/:id', ensureAuthenticated, eventosController.show);
router.post('/', ensureAuthenticated, ensureHasRole, eventosController.create);
router.put('/:id', ensureAuthenticated, ensureHasRole, eventosController.update);
router.delete('/:id', ensureAuthenticated, ensureHasRole, eventosController.delete);

// Junction: Musicas (eventos_musicas)
router.get('/:eventoId/musicas', ensureAuthenticated, eventosController.listMusicas);
router.post('/:eventoId/musicas', ensureAuthenticated, ensureHasRole, eventosController.addMusica);
router.delete('/:eventoId/musicas/:musicaId', ensureAuthenticated, ensureHasRole, eventosController.removeMusica);

// Junction: Integrantes (eventos_integrantes)
router.get('/:eventoId/integrantes', ensureAuthenticated, eventosController.listIntegrantes);
router.post('/:eventoId/integrantes', ensureAuthenticated, ensureHasRole, eventosController.addIntegrante);
router.delete('/:eventoId/integrantes/:integranteId', ensureAuthenticated, ensureHasRole, eventosController.removeIntegrante);

export default router;
