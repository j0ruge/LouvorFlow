import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createFakeCategoriasRepository } from '../fakes/fake-categorias.repository.js';
import { MOCK_CATEGORIAS, NON_EXISTENT_ID } from '../fakes/mock-data.js';

const fakeRepo = createFakeCategoriasRepository();

vi.mock('../../src/repositories/categorias.repository.js', () => ({
  default: fakeRepo,
}));

const { default: categoriasService } = await import('../../src/services/categorias.service.js');

describe('CategoriasService', () => {
  beforeEach(() => {
    fakeRepo.reset();
  });

  // ─── listAll ─────────────────────────────────────────
  describe('listAll', () => {
    it('deve retornar todas as categorias', async () => {
      const result = await categoriasService.listAll();
      expect(result).toHaveLength(MOCK_CATEGORIAS.length);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('nome');
    });
  });

  // ─── getById ─────────────────────────────────────────
  describe('getById', () => {
    it('deve retornar uma categoria pelo id', async () => {
      const result = await categoriasService.getById(MOCK_CATEGORIAS[0].id);
      expect(result).toEqual({ id: MOCK_CATEGORIAS[0].id, nome: MOCK_CATEGORIAS[0].nome });
    });

    it('deve lançar AppError 400 quando id não é enviado', async () => {
      await expect(categoriasService.getById('')).rejects.toMatchObject({
        statusCode: 400,
        message: 'ID de categoria não enviado',
      });
    });

    it('deve lançar AppError 404 quando categoria não existe', async () => {
      await expect(categoriasService.getById(NON_EXISTENT_ID)).rejects.toMatchObject({
        statusCode: 404,
        message: 'A categoria não foi encontrada ou não existe',
      });
    });
  });

  // ─── create ──────────────────────────────────────────
  describe('create', () => {
    it('deve criar uma categoria com nome válido', async () => {
      const result = await categoriasService.create('Louvor');
      expect(result).toHaveProperty('id');
      expect(result.nome).toBe('Louvor');
    });

    it('deve lançar AppError 400 quando nome não é enviado', async () => {
      await expect(categoriasService.create(undefined)).rejects.toMatchObject({
        statusCode: 400,
        message: 'Nome da categoria é obrigatório',
      });
    });

    it('deve lançar AppError 400 quando nome é string vazia', async () => {
      await expect(categoriasService.create('')).rejects.toMatchObject({
        statusCode: 400,
        message: 'Nome da categoria é obrigatório',
      });
    });

    it('deve lançar AppError 409 quando nome é duplicado', async () => {
      await expect(categoriasService.create(MOCK_CATEGORIAS[0].nome)).rejects.toMatchObject({
        statusCode: 409,
        message: 'Já existe uma categoria com esse nome',
      });
    });
  });

  // ─── update ──────────────────────────────────────────
  describe('update', () => {
    it('deve atualizar uma categoria com dados válidos', async () => {
      const result = await categoriasService.update(MOCK_CATEGORIAS[0].id, 'Nome Atualizado');
      expect(result.id).toBe(MOCK_CATEGORIAS[0].id);
      expect(result.nome).toBe('Nome Atualizado');
    });

    it('deve lançar AppError 400 quando id não é enviado', async () => {
      await expect(categoriasService.update('', 'Nome')).rejects.toMatchObject({
        statusCode: 400,
        message: 'ID de categoria não enviado',
      });
    });

    it('deve lançar AppError 404 quando categoria não existe', async () => {
      await expect(categoriasService.update(NON_EXISTENT_ID, 'Nome')).rejects.toMatchObject({
        statusCode: 404,
        message: 'Categoria com esse ID não existe ou não foi encontrada',
      });
    });

    it('deve lançar AppError 400 quando nome não é enviado', async () => {
      await expect(categoriasService.update(MOCK_CATEGORIAS[0].id, undefined)).rejects.toMatchObject({
        statusCode: 400,
        message: 'Nome da categoria é obrigatório',
      });
    });

    it('deve lançar AppError 409 quando nome já existe em outra categoria', async () => {
      await expect(categoriasService.update(MOCK_CATEGORIAS[0].id, MOCK_CATEGORIAS[1].nome)).rejects.toMatchObject({
        statusCode: 409,
        message: 'Nome da categoria já existe',
      });
    });
  });

  // ─── delete ──────────────────────────────────────────
  describe('delete', () => {
    it('deve remover uma categoria existente', async () => {
      const result = await categoriasService.delete(MOCK_CATEGORIAS[0].id);
      expect(result).toEqual({ id: MOCK_CATEGORIAS[0].id, nome: MOCK_CATEGORIAS[0].nome });
    });

    it('deve lançar AppError 400 quando id não é enviado', async () => {
      await expect(categoriasService.delete('')).rejects.toMatchObject({
        statusCode: 400,
        message: 'ID de categoria não enviado',
      });
    });

    it('deve lançar AppError 404 quando categoria não existe', async () => {
      await expect(categoriasService.delete(NON_EXISTENT_ID)).rejects.toMatchObject({
        statusCode: 404,
        message: 'A categoria não foi encontrada ou não existe',
      });
    });
  });
});
