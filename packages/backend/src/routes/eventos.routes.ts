/**
 * Rotas do recurso de eventos.
 *
 * Define os endpoints REST para CRUD de eventos e suas junções
 * com músicas e integrantes.
 * GETs exigem autenticação; POST/PUT/DELETE exigem permissão `escalas.write`.
 */
import { Router } from 'express';
import eventosController from '../controllers/eventos.controller.js';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated.js';
import { can } from '../middlewares/can.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import { addIntegranteBodySchema } from '../validators/eventos.validators.js';

const router: Router = Router();

// Base CRUD
router.get('/', ensureAuthenticated, eventosController.index);
router.get('/:id', ensureAuthenticated, eventosController.show);
router.post('/', ensureAuthenticated, can(['escalas.write']), eventosController.create);
router.put('/:id', ensureAuthenticated, can(['escalas.write']), eventosController.update);
router.delete('/:id', ensureAuthenticated, can(['escalas.write']), eventosController.delete);

// Junction: Musicas (eventos_musicas)
router.get('/:eventoId/musicas', ensureAuthenticated, eventosController.listMusicas);
router.post('/:eventoId/musicas', ensureAuthenticated, can(['escalas.write']), eventosController.addMusica);
router.delete('/:eventoId/musicas/:musicaId', ensureAuthenticated, can(['escalas.write']), eventosController.removeMusica);

// Junction: Integrantes (eventos_integrantes)
router.get('/:eventoId/integrantes', ensureAuthenticated, eventosController.listIntegrantes);
router.post('/:eventoId/integrantes', ensureAuthenticated, can(['escalas.write']), validateRequest({ body: addIntegranteBodySchema }), eventosController.addIntegrante);
router.delete('/:eventoId/integrantes/:integranteId', ensureAuthenticated, can(['escalas.write']), eventosController.removeIntegrante);

export default router;
