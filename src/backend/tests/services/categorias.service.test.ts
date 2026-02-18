import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createFakeTagsRepository } from '../fakes/fake-tags.repository.js';
import { MOCK_TAGS, NON_EXISTENT_ID } from '../fakes/mock-data.js';

const fakeRepo = createFakeTagsRepository();

vi.mock('../../src/repositories/tags.repository.js', () => ({
  default: fakeRepo,
}));

const { default: tagsService } = await import('../../src/services/tags.service.js');

describe('TagsService', () => {
  beforeEach(() => {
    fakeRepo.reset();
  });

  // ─── listAll ─────────────────────────────────────────
  describe('listAll', () => {
    it('deve retornar todas as tags', async () => {
      const result = await tagsService.listAll();
      expect(result).toHaveLength(MOCK_TAGS.length);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('nome');
    });
  });

  // ─── getById ─────────────────────────────────────────
  describe('getById', () => {
    it('deve retornar uma tag pelo id', async () => {
      const result = await tagsService.getById(MOCK_TAGS[0].id);
      expect(result).toEqual({ id: MOCK_TAGS[0].id, nome: MOCK_TAGS[0].nome });
    });

    it('deve lançar AppError 400 quando id não é enviado', async () => {
      await expect(tagsService.getById('')).rejects.toMatchObject({
        statusCode: 400,
        message: 'ID de tag não enviado',
      });
    });

    it('deve lançar AppError 404 quando tag não existe', async () => {
      await expect(tagsService.getById(NON_EXISTENT_ID)).rejects.toMatchObject({
        statusCode: 404,
        message: 'A tag não foi encontrada ou não existe',
      });
    });
  });

  // ─── create ──────────────────────────────────────────
  describe('create', () => {
    it('deve criar uma tag com nome válido', async () => {
      const result = await tagsService.create('Louvor');
      expect(result).toHaveProperty('id');
      expect(result.nome).toBe('Louvor');
    });

    it('deve lançar AppError 400 quando nome não é enviado', async () => {
      await expect(tagsService.create(undefined)).rejects.toMatchObject({
        statusCode: 400,
        message: 'Nome da tag é obrigatório',
      });
    });

    it('deve lançar AppError 400 quando nome é string vazia', async () => {
      await expect(tagsService.create('')).rejects.toMatchObject({
        statusCode: 400,
        message: 'Nome da tag é obrigatório',
      });
    });

    it('deve lançar AppError 409 quando nome é duplicado', async () => {
      await expect(tagsService.create(MOCK_TAGS[0].nome)).rejects.toMatchObject({
        statusCode: 409,
        message: 'Já existe uma tag com esse nome',
      });
    });
  });

  // ─── update ──────────────────────────────────────────
  describe('update', () => {
    it('deve atualizar uma tag com dados válidos', async () => {
      const result = await tagsService.update(MOCK_TAGS[0].id, 'Nome Atualizado');
      expect(result.id).toBe(MOCK_TAGS[0].id);
      expect(result.nome).toBe('Nome Atualizado');
    });

    it('deve lançar AppError 400 quando id não é enviado', async () => {
      await expect(tagsService.update('', 'Nome')).rejects.toMatchObject({
        statusCode: 400,
        message: 'ID de tag não enviado',
      });
    });

    it('deve lançar AppError 404 quando tag não existe', async () => {
      await expect(tagsService.update(NON_EXISTENT_ID, 'Nome')).rejects.toMatchObject({
        statusCode: 404,
        message: 'Tag com esse ID não existe ou não foi encontrada',
      });
    });

    it('deve lançar AppError 400 quando nome não é enviado', async () => {
      await expect(tagsService.update(MOCK_TAGS[0].id, undefined)).rejects.toMatchObject({
        statusCode: 400,
        message: 'Nome da tag é obrigatório',
      });
    });

    it('deve lançar AppError 409 quando nome já existe em outra tag', async () => {
      await expect(tagsService.update(MOCK_TAGS[0].id, MOCK_TAGS[1].nome)).rejects.toMatchObject({
        statusCode: 409,
        message: 'Nome da tag já existe',
      });
    });
  });

  // ─── delete ──────────────────────────────────────────
  describe('delete', () => {
    it('deve remover uma tag existente', async () => {
      const result = await tagsService.delete(MOCK_TAGS[0].id);
      expect(result).toEqual({ id: MOCK_TAGS[0].id, nome: MOCK_TAGS[0].nome });
    });

    it('deve lançar AppError 400 quando id não é enviado', async () => {
      await expect(tagsService.delete('')).rejects.toMatchObject({
        statusCode: 400,
        message: 'ID de tag não enviado',
      });
    });

    it('deve lançar AppError 404 quando tag não existe', async () => {
      await expect(tagsService.delete(NON_EXISTENT_ID)).rejects.toMatchObject({
        statusCode: 404,
        message: 'A tag não foi encontrada ou não existe',
      });
    });
  });
});
