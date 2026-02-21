import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createFakeCategoriasRepository } from '../fakes/fake-categorias.repository.js';
import { MOCK_CATEGORIAS, NON_EXISTENT_ID } from '../fakes/mock-data.js';

const fakeRepo = createFakeCategoriasRepository();

vi.mock('../../src/repositories/categorias.repository.js', () => ({
  default: fakeRepo,
}));

const { default: categoriasService } = await import('../../src/services/categorias.service.js');

/** Suite de testes unitários para o CategoriasService. */
describe('CategoriasService', () => {
  /** Reseta o repositório fake antes de cada teste para garantir isolamento. */
  beforeEach(() => {
    fakeRepo.reset();
  });

  // ─── listAll ─────────────────────────────────────────
  /** Testes do método listAll. */
  describe('listAll', () => {
    /** Deve retornar todas as categorias cadastradas no repositório. */
    it('deve retornar todas as categorias', async () => {
      const result = await categoriasService.listAll();
      expect(result).toHaveLength(MOCK_CATEGORIAS.length);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('nome');
    });
  });

  // ─── getById ─────────────────────────────────────────
  /** Testes do método getById. */
  describe('getById', () => {
    /** Deve retornar a categoria correspondente ao ID informado. */
    it('deve retornar uma categoria pelo id', async () => {
      const result = await categoriasService.getById(MOCK_CATEGORIAS[0].id);
      expect(result).toEqual({ id: MOCK_CATEGORIAS[0].id, nome: MOCK_CATEGORIAS[0].nome });
    });

    /** Deve lançar erro 400 quando o ID é uma string vazia. */
    it('deve lançar AppError 400 quando id não é enviado', async () => {
      await expect(categoriasService.getById('')).rejects.toMatchObject({
        statusCode: 400,
        message: 'ID de categoria não enviado',
      });
    });

    /** Deve lançar erro 404 quando o ID não corresponde a nenhuma categoria. */
    it('deve lançar AppError 404 quando categoria não existe', async () => {
      await expect(categoriasService.getById(NON_EXISTENT_ID)).rejects.toMatchObject({
        statusCode: 404,
        message: 'A categoria não foi encontrada ou não existe',
      });
    });
  });

  // ─── create ──────────────────────────────────────────
  /** Testes do método create. */
  describe('create', () => {
    /** Deve criar e retornar uma categoria quando o nome é válido e único. */
    it('deve criar uma categoria com nome válido', async () => {
      const result = await categoriasService.create('Louvor');
      expect(result).toHaveProperty('id');
      expect(result.nome).toBe('Louvor');
    });

    /** Deve lançar erro 400 quando o nome é undefined. */
    it('deve lançar AppError 400 quando nome não é enviado', async () => {
      await expect(categoriasService.create(undefined)).rejects.toMatchObject({
        statusCode: 400,
        message: 'Nome da categoria é obrigatório',
      });
    });

    /** Deve lançar erro 400 quando o nome é uma string vazia. */
    it('deve lançar AppError 400 quando nome é string vazia', async () => {
      await expect(categoriasService.create('')).rejects.toMatchObject({
        statusCode: 400,
        message: 'Nome da categoria é obrigatório',
      });
    });

    /** Deve lançar erro 409 quando já existe categoria com o mesmo nome. */
    it('deve lançar AppError 409 quando nome é duplicado', async () => {
      await expect(categoriasService.create(MOCK_CATEGORIAS[0].nome)).rejects.toMatchObject({
        statusCode: 409,
        message: 'Já existe uma categoria com esse nome',
      });
    });
  });

  // ─── update ──────────────────────────────────────────
  /** Testes do método update. */
  describe('update', () => {
    /** Deve atualizar e retornar a categoria quando ID e nome são válidos. */
    it('deve atualizar uma categoria com dados válidos', async () => {
      const result = await categoriasService.update(MOCK_CATEGORIAS[0].id, 'Nome Atualizado');
      expect(result.id).toBe(MOCK_CATEGORIAS[0].id);
      expect(result.nome).toBe('Nome Atualizado');
    });

    /** Deve lançar erro 400 quando o ID é vazio. */
    it('deve lançar AppError 400 quando id não é enviado', async () => {
      await expect(categoriasService.update('', 'Nome')).rejects.toMatchObject({
        statusCode: 400,
        message: 'ID de categoria não enviado',
      });
    });

    /** Deve lançar erro 404 quando o ID não corresponde a nenhuma categoria. */
    it('deve lançar AppError 404 quando categoria não existe', async () => {
      await expect(categoriasService.update(NON_EXISTENT_ID, 'Nome')).rejects.toMatchObject({
        statusCode: 404,
        message: 'Categoria com esse ID não existe ou não foi encontrada',
      });
    });

    /** Deve lançar erro 400 quando o nome não é informado no update. */
    it('deve lançar AppError 400 quando nome não é enviado', async () => {
      await expect(categoriasService.update(MOCK_CATEGORIAS[0].id, undefined)).rejects.toMatchObject({
        statusCode: 400,
        message: 'Nome da categoria é obrigatório',
      });
    });

    /** Deve lançar erro 409 quando o novo nome já pertence a outra categoria. */
    it('deve lançar AppError 409 quando nome já existe em outra categoria', async () => {
      await expect(categoriasService.update(MOCK_CATEGORIAS[0].id, MOCK_CATEGORIAS[1].nome)).rejects.toMatchObject({
        statusCode: 409,
        message: 'Nome da categoria já existe',
      });
    });
  });

  // ─── delete ──────────────────────────────────────────
  /** Testes do método delete. */
  describe('delete', () => {
    /** Deve remover e retornar a categoria quando o ID é válido. */
    it('deve remover uma categoria existente', async () => {
      const result = await categoriasService.delete(MOCK_CATEGORIAS[0].id);
      expect(result).toEqual({ id: MOCK_CATEGORIAS[0].id, nome: MOCK_CATEGORIAS[0].nome });
    });

    /** Deve lançar erro 400 quando o ID é vazio. */
    it('deve lançar AppError 400 quando id não é enviado', async () => {
      await expect(categoriasService.delete('')).rejects.toMatchObject({
        statusCode: 400,
        message: 'ID de categoria não enviado',
      });
    });

    /** Deve lançar erro 404 quando o ID não corresponde a nenhuma categoria. */
    it('deve lançar AppError 404 quando categoria não existe', async () => {
      await expect(categoriasService.delete(NON_EXISTENT_ID)).rejects.toMatchObject({
        statusCode: 404,
        message: 'A categoria não foi encontrada ou não existe',
      });
    });
  });
});
