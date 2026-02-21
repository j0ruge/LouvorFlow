import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createFakeTiposEventosRepository } from '../fakes/fake-tipos-eventos.repository.js';
import { MOCK_TIPOS_EVENTOS, NON_EXISTENT_ID } from '../fakes/mock-data.js';

const fakeRepo = createFakeTiposEventosRepository();

vi.mock('../../src/repositories/tipos-eventos.repository.js', () => ({
  default: fakeRepo,
}));

const { default: tiposEventosService } = await import('../../src/services/tipos-eventos.service.js');

describe('TiposEventosService', () => {
  beforeEach(() => {
    fakeRepo.reset();
  });

  // ─── listAll ─────────────────────────────────────────
  describe('listAll', () => {
    it('deve retornar todos os tipos de eventos', async () => {
      const result = await tiposEventosService.listAll();
      expect(result).toHaveLength(MOCK_TIPOS_EVENTOS.length);
      expect(result[0]).toHaveProperty('nome');
    });
  });

  // ─── getById ─────────────────────────────────────────
  describe('getById', () => {
    it('deve retornar um tipo de evento pelo id', async () => {
      const result = await tiposEventosService.getById(MOCK_TIPOS_EVENTOS[0].id);
      expect(result).toEqual({ id: MOCK_TIPOS_EVENTOS[0].id, nome: MOCK_TIPOS_EVENTOS[0].nome });
    });

    it('deve lançar AppError 400 quando id não é enviado', async () => {
      await expect(tiposEventosService.getById('')).rejects.toMatchObject({
        statusCode: 400,
        message: 'ID de tipo de evento não enviado',
      });
    });

    it('deve lançar AppError 404 quando tipo de evento não existe', async () => {
      await expect(tiposEventosService.getById(NON_EXISTENT_ID)).rejects.toMatchObject({
        statusCode: 404,
        message: 'O tipo de evento não foi encontrado ou não existe',
      });
    });
  });

  // ─── create ──────────────────────────────────────────
  describe('create', () => {
    it('deve criar um tipo de evento com nome válido', async () => {
      const result = await tiposEventosService.create('Retiro');
      expect(result).toHaveProperty('id');
      expect(result.nome).toBe('Retiro');
    });

    it('deve lançar AppError 400 quando nome não é enviado', async () => {
      await expect(tiposEventosService.create(undefined)).rejects.toMatchObject({
        statusCode: 400,
        message: 'Nome do tipo de evento é obrigatório',
      });
    });

    it('deve lançar AppError 409 quando nome é duplicado', async () => {
      await expect(tiposEventosService.create(MOCK_TIPOS_EVENTOS[0].nome)).rejects.toMatchObject({
        statusCode: 409,
        message: 'Já existe um tipo de evento com esse nome',
      });
    });
  });

  // ─── update ──────────────────────────────────────────
  describe('update', () => {
    it('deve atualizar um tipo de evento com dados válidos', async () => {
      const result = await tiposEventosService.update(MOCK_TIPOS_EVENTOS[0].id, 'Vigília');
      expect(result.id).toBe(MOCK_TIPOS_EVENTOS[0].id);
      expect(result.nome).toBe('Vigília');
    });

    it('deve lançar AppError 400 quando id não é enviado', async () => {
      await expect(tiposEventosService.update('', 'Nome')).rejects.toMatchObject({
        statusCode: 400,
        message: 'ID de tipo de evento não enviado',
      });
    });

    it('deve lançar AppError 404 quando tipo de evento não existe', async () => {
      await expect(tiposEventosService.update(NON_EXISTENT_ID, 'Nome')).rejects.toMatchObject({
        statusCode: 404,
        message: 'Tipo de evento com esse ID não existe ou não foi encontrado',
      });
    });

    it('deve lançar AppError 400 quando nome não é enviado', async () => {
      await expect(tiposEventosService.update(MOCK_TIPOS_EVENTOS[0].id, undefined)).rejects.toMatchObject({
        statusCode: 400,
        message: 'Nome do tipo de evento é obrigatório',
      });
    });

    it('deve lançar AppError 409 quando nome já existe em outro tipo', async () => {
      await expect(tiposEventosService.update(MOCK_TIPOS_EVENTOS[0].id, MOCK_TIPOS_EVENTOS[1].nome)).rejects.toMatchObject({
        statusCode: 409,
        message: 'Nome do tipo de evento já existe',
      });
    });
  });

  // ─── delete ──────────────────────────────────────────
  describe('delete', () => {
    it('deve remover um tipo de evento existente', async () => {
      const result = await tiposEventosService.delete(MOCK_TIPOS_EVENTOS[0].id);
      expect(result).toEqual({ id: MOCK_TIPOS_EVENTOS[0].id, nome: MOCK_TIPOS_EVENTOS[0].nome });
    });

    it('deve lançar AppError 400 quando id não é enviado', async () => {
      await expect(tiposEventosService.delete('')).rejects.toMatchObject({
        statusCode: 400,
        message: 'ID de tipo de evento não enviado',
      });
    });

    it('deve lançar AppError 404 quando tipo de evento não existe', async () => {
      await expect(tiposEventosService.delete(NON_EXISTENT_ID)).rejects.toMatchObject({
        statusCode: 404,
        message: 'O tipo de evento não foi encontrado ou não existe',
      });
    });
  });
});
