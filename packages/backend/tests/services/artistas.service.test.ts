import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createFakeArtistasRepository } from '../fakes/fake-artistas.repository.js';
import { MOCK_ARTISTAS, NON_EXISTENT_ID } from '../fakes/mock-data.js';

const fakeRepo = createFakeArtistasRepository();

vi.mock('../../src/repositories/artistas.repository.js', () => ({
  default: fakeRepo,
}));

const { default: artistasService } = await import('../../src/services/artistas.service.js');

describe('ArtistasService', () => {
  beforeEach(() => {
    fakeRepo.reset();
  });

  // ─── listAll ─────────────────────────────────────────
  describe('listAll', () => {
    it('deve retornar todos os artistas', async () => {
      const result = await artistasService.listAll();
      expect(result).toHaveLength(MOCK_ARTISTAS.length);
      expect(result[0]).toHaveProperty('nome');
    });
  });

  // ─── getById ─────────────────────────────────────────
  describe('getById', () => {
    it('deve retornar um artista com músicas pelo id', async () => {
      const result = await artistasService.getById(MOCK_ARTISTAS[0].id);
      expect(result).toHaveProperty('id', MOCK_ARTISTAS[0].id);
      expect(result).toHaveProperty('nome', MOCK_ARTISTAS[0].nome);
      expect(result).toHaveProperty('Artistas_Musicas');
    });

    it('deve lançar AppError 400 quando id não é enviado', async () => {
      await expect(artistasService.getById('')).rejects.toMatchObject({
        statusCode: 400,
        message: 'ID de artista não enviado',
      });
    });

    it('deve lançar AppError 404 quando artista não existe', async () => {
      await expect(artistasService.getById(NON_EXISTENT_ID)).rejects.toMatchObject({
        statusCode: 404,
        message: 'O artista não foi encontrado ou não existe',
      });
    });
  });

  // ─── create ──────────────────────────────────────────
  describe('create', () => {
    it('deve criar um artista com nome válido retornando {id, nome}', async () => {
      const result = await artistasService.create('Diante do Trono');
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('nome', 'Diante do Trono');
      expect(Object.keys(result)).toEqual(['id', 'nome']);
    });

    it('deve lançar AppError 400 quando nome não é enviado', async () => {
      await expect(artistasService.create(undefined)).rejects.toMatchObject({
        statusCode: 400,
        message: 'Nome do artista é obrigatório',
      });
    });

    it('deve lançar AppError 409 quando nome é duplicado', async () => {
      await expect(artistasService.create('Aline Barros')).rejects.toMatchObject({
        statusCode: 409,
        message: 'Já existe um artista com esse nome',
      });
    });
  });

  // ─── update ──────────────────────────────────────────
  describe('update', () => {
    it('deve atualizar um artista com dados válidos retornando {id, nome}', async () => {
      const result = await artistasService.update(MOCK_ARTISTAS[0].id, 'Novo Nome');
      expect(result).toEqual({ id: MOCK_ARTISTAS[0].id, nome: 'Novo Nome' });
    });

    it('deve lançar AppError 400 quando id não é enviado', async () => {
      await expect(artistasService.update('', 'Nome')).rejects.toMatchObject({
        statusCode: 400,
        message: 'ID de artista não enviado',
      });
    });

    it('deve lançar AppError 404 quando artista não existe', async () => {
      await expect(artistasService.update(NON_EXISTENT_ID, 'Nome')).rejects.toMatchObject({
        statusCode: 404,
        message: 'Artista com esse ID não existe ou não foi encontrado',
      });
    });

    it('deve lançar AppError 400 quando nome não é enviado', async () => {
      await expect(artistasService.update(MOCK_ARTISTAS[0].id, undefined)).rejects.toMatchObject({
        statusCode: 400,
        message: 'Nome do artista é obrigatório',
      });
    });

    it('deve lançar AppError 409 quando nome pertence a outro artista', async () => {
      await expect(artistasService.update(MOCK_ARTISTAS[0].id, MOCK_ARTISTAS[1].nome)).rejects.toMatchObject({
        statusCode: 409,
        message: 'Nome do artista já existe',
      });
    });

    it('deve permitir update com o próprio nome atual sem erro', async () => {
      const result = await artistasService.update(MOCK_ARTISTAS[0].id, MOCK_ARTISTAS[0].nome);
      expect(result.nome).toBe(MOCK_ARTISTAS[0].nome);
    });
  });

  // ─── delete ──────────────────────────────────────────
  describe('delete', () => {
    it('deve remover um artista existente', async () => {
      const result = await artistasService.delete(MOCK_ARTISTAS[0].id);
      expect(result).toHaveProperty('id', MOCK_ARTISTAS[0].id);
    });

    it('deve lançar AppError 400 quando id não é enviado', async () => {
      await expect(artistasService.delete('')).rejects.toMatchObject({
        statusCode: 400,
        message: 'ID de artista não enviado',
      });
    });

    it('deve lançar AppError 404 quando artista não existe', async () => {
      await expect(artistasService.delete(NON_EXISTENT_ID)).rejects.toMatchObject({
        statusCode: 404,
        message: 'O artista não foi encontrado ou não existe',
      });
    });
  });
});
