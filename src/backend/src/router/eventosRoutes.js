import { Router } from 'express';
import eventosController from '../controllers/eventosController.js';

const router = Router();

// Base CRUD
router.get('/', eventosController.index);
router.get('/:id', eventosController.show);
router.post('/', eventosController.create);
router.put('/:id', eventosController.update);
router.delete('/:id', eventosController.delete);

// Junction: Musicas (eventos_musicas)
router.get('/:eventoId/musicas', eventosController.listMusicas);
router.post('/:eventoId/musicas', eventosController.addMusica);
router.delete('/:eventoId/musicas/:musicaId', eventosController.removeMusica);

// Junction: Integrantes (eventos_integrantes)
router.get('/:eventoId/integrantes', eventosController.listIntegrantes);
router.post('/:eventoId/integrantes', eventosController.addIntegrante);
router.delete('/:eventoId/integrantes/:integranteId', eventosController.removeIntegrante);

export default router;
