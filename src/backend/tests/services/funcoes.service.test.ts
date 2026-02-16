import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createFakeFuncoesRepository } from '../fakes/fake-funcoes.repository.js';
import { MOCK_FUNCOES, NON_EXISTENT_ID } from '../fakes/mock-data.js';

const fakeRepo = createFakeFuncoesRepository();

vi.mock('../../src/repositories/funcoes.repository.js', () => ({
  default: fakeRepo,
}));

const { default: funcoesService } = await import('../../src/services/funcoes.service.js');

describe('FuncoesService', () => {
  beforeEach(() => {
    fakeRepo.reset();
  });

  // ─── listAll ─────────────────────────────────────────
  describe('listAll', () => {
    it('deve retornar todas as funções', async () => {
      const result = await funcoesService.listAll();
      expect(result).toHaveLength(MOCK_FUNCOES.length);
      expect(result[0]).toHaveProperty('nome');
    });
  });

  // ─── getById ─────────────────────────────────────────
  describe('getById', () => {
    it('deve retornar uma função pelo id', async () => {
      const result = await funcoesService.getById(MOCK_FUNCOES[0].id);
      expect(result).toEqual({ id: MOCK_FUNCOES[0].id, nome: MOCK_FUNCOES[0].nome });
    });

    it('deve lançar AppError 400 quando id não é enviado', async () => {
      await expect(funcoesService.getById('')).rejects.toMatchObject({
        statusCode: 400,
        message: 'ID de função não enviado',
      });
    });

    it('deve lançar AppError 404 quando função não existe', async () => {
      await expect(funcoesService.getById(NON_EXISTENT_ID)).rejects.toMatchObject({
        statusCode: 404,
        message: 'A função não foi encontrada ou não existe',
      });
    });
  });

  // ─── create ──────────────────────────────────────────
  describe('create', () => {
    it('deve criar uma função com nome válido', async () => {
      const result = await funcoesService.create('Violão');
      expect(result).toHaveProperty('id');
      expect(result.nome).toBe('Violão');
    });

    it('deve lançar AppError 400 quando nome não é enviado', async () => {
      await expect(funcoesService.create(undefined)).rejects.toMatchObject({
        statusCode: 400,
        message: 'Nome da função é obrigatório',
      });
    });

    it('deve lançar AppError 409 quando nome é duplicado', async () => {
      await expect(funcoesService.create(MOCK_FUNCOES[0].nome)).rejects.toMatchObject({
        statusCode: 409,
        message: 'Já existe uma função com esse nome',
      });
    });
  });

  // ─── update ──────────────────────────────────────────
  describe('update', () => {
    it('deve atualizar uma função com dados válidos', async () => {
      const result = await funcoesService.update(MOCK_FUNCOES[0].id, 'Percussão');
      expect(result.id).toBe(MOCK_FUNCOES[0].id);
      expect(result.nome).toBe('Percussão');
    });

    it('deve lançar AppError 400 quando id não é enviado', async () => {
      await expect(funcoesService.update('', 'Nome')).rejects.toMatchObject({
        statusCode: 400,
        message: 'ID de função não enviado',
      });
    });

    it('deve lançar AppError 404 quando função não existe', async () => {
      await expect(funcoesService.update(NON_EXISTENT_ID, 'Nome')).rejects.toMatchObject({
        statusCode: 404,
        message: 'Função com esse ID não existe ou não foi encontrada',
      });
    });

    it('deve lançar AppError 400 quando nome não é enviado', async () => {
      await expect(funcoesService.update(MOCK_FUNCOES[0].id, undefined)).rejects.toMatchObject({
        statusCode: 400,
        message: 'Nome da função é obrigatório',
      });
    });

    it('deve lançar AppError 409 quando nome já existe em outra função', async () => {
      await expect(funcoesService.update(MOCK_FUNCOES[0].id, MOCK_FUNCOES[1].nome)).rejects.toMatchObject({
        statusCode: 409,
        message: 'Nome de função já existe',
      });
    });
  });

  // ─── delete ──────────────────────────────────────────
  describe('delete', () => {
    it('deve remover uma função existente', async () => {
      const result = await funcoesService.delete(MOCK_FUNCOES[0].id);
      expect(result).toEqual({ id: MOCK_FUNCOES[0].id, nome: MOCK_FUNCOES[0].nome });
    });

    it('deve lançar AppError 400 quando id não é enviado', async () => {
      await expect(funcoesService.delete('')).rejects.toMatchObject({
        statusCode: 400,
        message: 'ID de função não enviado',
      });
    });

    it('deve lançar AppError 404 quando função não existe', async () => {
      await expect(funcoesService.delete(NON_EXISTENT_ID)).rejects.toMatchObject({
        statusCode: 404,
        message: 'A função não foi encontrada ou não existe',
      });
    });
  });
});
