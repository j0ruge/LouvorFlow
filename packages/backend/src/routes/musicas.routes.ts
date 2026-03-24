/**
 * Rotas do recurso de músicas.
 *
 * Define os endpoints REST para CRUD de músicas e suas junções
 * com versões (artistas), categorias e funções.
 * GETs exigem autenticação; POST/PUT/DELETE exigem permissão `musicas.write`.
 */
import { Router } from 'express';
import musicasController from '../controllers/musicas.controller.js';
import { ensureAuthenticated } from '../middlewares/ensureAuthenticated.js';
import { ensureTenantContext } from '../middlewares/ensureTenantContext.js';
import { can } from '../middlewares/can.js';
import { validateRequest } from '../middlewares/validateRequest.js';
import {
    musicaIdParamsSchema,
    musicaIdNestedParamsSchema,
    musicaVersaoParamsSchema,
    musicaCategoriaParamsSchema,
    musicaFuncaoParamsSchema,
    createMusicaBodySchema,
    updateMusicaBodySchema,
    createMusicaCompleteBodySchema,
    updateMusicaCompleteBodySchema,
    addVersaoBodySchema,
    updateVersaoBodySchema,
    addCategoriaBodySchema,
    addFuncaoBodySchema,
} from '../validators/musicas.validators.js';

const router: Router = Router();

// Base CRUD
router.get('/', ensureAuthenticated, ensureTenantContext, musicasController.index);
router.post('/complete', ensureAuthenticated, ensureTenantContext, can(['musicas.write']), validateRequest({ body: createMusicaCompleteBodySchema }), musicasController.createComplete);
router.get('/:id', ensureAuthenticated, ensureTenantContext, validateRequest({ params: musicaIdParamsSchema }), musicasController.show);
router.post('/', ensureAuthenticated, ensureTenantContext, can(['musicas.write']), validateRequest({ body: createMusicaBodySchema }), musicasController.create);
router.put('/:id/complete', ensureAuthenticated, ensureTenantContext, can(['musicas.write']), validateRequest({ params: musicaIdParamsSchema, body: updateMusicaCompleteBodySchema }), musicasController.updateComplete);
router.put('/:id', ensureAuthenticated, ensureTenantContext, can(['musicas.write']), validateRequest({ params: musicaIdParamsSchema, body: updateMusicaBodySchema }), musicasController.update);
router.delete('/:id', ensureAuthenticated, ensureTenantContext, can(['musicas.write']), validateRequest({ params: musicaIdParamsSchema }), musicasController.delete);

// Junction: Versoes (artistas_musicas)
router.get('/:musicaId/versoes', ensureAuthenticated, ensureTenantContext, validateRequest({ params: musicaIdNestedParamsSchema }), musicasController.listVersoes);
router.post('/:musicaId/versoes', ensureAuthenticated, ensureTenantContext, can(['musicas.write']), validateRequest({ params: musicaIdNestedParamsSchema, body: addVersaoBodySchema }), musicasController.addVersao);
router.put('/:musicaId/versoes/:versaoId', ensureAuthenticated, ensureTenantContext, can(['musicas.write']), validateRequest({ params: musicaVersaoParamsSchema, body: updateVersaoBodySchema }), musicasController.updateVersao);
router.delete('/:musicaId/versoes/:versaoId', ensureAuthenticated, ensureTenantContext, can(['musicas.write']), validateRequest({ params: musicaVersaoParamsSchema }), musicasController.removeVersao);

// Junction: Categorias (musicas_categorias)
router.get('/:musicaId/categorias', ensureAuthenticated, ensureTenantContext, validateRequest({ params: musicaIdNestedParamsSchema }), musicasController.listCategorias);
router.post('/:musicaId/categorias', ensureAuthenticated, ensureTenantContext, can(['musicas.write']), validateRequest({ params: musicaIdNestedParamsSchema, body: addCategoriaBodySchema }), musicasController.addCategoria);
router.delete('/:musicaId/categorias/:categoriaId', ensureAuthenticated, ensureTenantContext, can(['musicas.write']), validateRequest({ params: musicaCategoriaParamsSchema }), musicasController.removeCategoria);

// Junction: Funcoes (musicas_funcoes)
router.get('/:musicaId/funcoes', ensureAuthenticated, ensureTenantContext, validateRequest({ params: musicaIdNestedParamsSchema }), musicasController.listFuncoes);
router.post('/:musicaId/funcoes', ensureAuthenticated, ensureTenantContext, can(['musicas.write']), validateRequest({ params: musicaIdNestedParamsSchema, body: addFuncaoBodySchema }), musicasController.addFuncao);
router.delete('/:musicaId/funcoes/:funcaoId', ensureAuthenticated, ensureTenantContext, can(['musicas.write']), validateRequest({ params: musicaFuncaoParamsSchema }), musicasController.removeFuncao);

export default router;
