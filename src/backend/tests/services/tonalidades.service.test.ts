import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createFakeTonalidadesRepository } from '../fakes/fake-tonalidades.repository.js';
import { MOCK_TONALIDADES, NON_EXISTENT_ID } from '../fakes/mock-data.js';

const fakeRepo = createFakeTonalidadesRepository();

vi.mock('../../src/repositories/tonalidades.repository.js', () => ({
  default: fakeRepo,
}));

const { default: tonalidadesService } = await import('../../src/services/tonalidades.service.js');

describe('TonalidadesService', () => {
  beforeEach(() => {
    fakeRepo.reset();
  });

  // ─── listAll ─────────────────────────────────────────
  describe('listAll', () => {
    it('deve retornar todas as tonalidades', async () => {
      const result = await tonalidadesService.listAll();
      expect(result).toHaveLength(MOCK_TONALIDADES.length);
      expect(result[0]).toHaveProperty('tom');
    });
  });

  // ─── getById ─────────────────────────────────────────
  describe('getById', () => {
    it('deve retornar uma tonalidade pelo id', async () => {
      const result = await tonalidadesService.getById(MOCK_TONALIDADES[0].id);
      expect(result).toEqual({ id: MOCK_TONALIDADES[0].id, tom: MOCK_TONALIDADES[0].tom });
    });

    it('deve lançar AppError 400 quando id não é enviado', async () => {
      await expect(tonalidadesService.getById('')).rejects.toMatchObject({
        statusCode: 400,
        message: 'ID de tonalidade não enviado',
      });
    });

    it('deve lançar AppError 404 quando tonalidade não existe', async () => {
      await expect(tonalidadesService.getById(NON_EXISTENT_ID)).rejects.toMatchObject({
        statusCode: 404,
        message: 'A tonalidade não foi encontrada ou não existe',
      });
    });
  });

  // ─── create ──────────────────────────────────────────
  describe('create', () => {
    it('deve criar uma tonalidade com tom válido', async () => {
      const result = await tonalidadesService.create('F#');
      expect(result).toHaveProperty('id');
      expect(result.tom).toBe('F#');
    });

    it('deve lançar AppError 400 quando tom não é enviado', async () => {
      await expect(tonalidadesService.create(undefined)).rejects.toMatchObject({
        statusCode: 400,
        message: 'Tom da tonalidade é obrigatório',
      });
    });

    it('deve lançar AppError 409 quando tom é duplicado', async () => {
      await expect(tonalidadesService.create(MOCK_TONALIDADES[0].tom)).rejects.toMatchObject({
        statusCode: 409,
        message: 'Já existe uma tonalidade com esse tom',
      });
    });
  });

  // ─── update ──────────────────────────────────────────
  describe('update', () => {
    it('deve atualizar uma tonalidade com dados válidos', async () => {
      const result = await tonalidadesService.update(MOCK_TONALIDADES[0].id, 'Bb');
      expect(result.id).toBe(MOCK_TONALIDADES[0].id);
      expect(result.tom).toBe('Bb');
    });

    it('deve lançar AppError 400 quando id não é enviado', async () => {
      await expect(tonalidadesService.update('', 'Bb')).rejects.toMatchObject({
        statusCode: 400,
        message: 'ID de tonalidade não enviado',
      });
    });

    it('deve lançar AppError 404 quando tonalidade não existe', async () => {
      await expect(tonalidadesService.update(NON_EXISTENT_ID, 'Bb')).rejects.toMatchObject({
        statusCode: 404,
        message: 'Tonalidade com esse ID não existe ou não foi encontrada',
      });
    });

    it('deve lançar AppError 400 quando tom não é enviado', async () => {
      await expect(tonalidadesService.update(MOCK_TONALIDADES[0].id, undefined)).rejects.toMatchObject({
        statusCode: 400,
        message: 'Tom da tonalidade é obrigatório',
      });
    });

    it('deve lançar AppError 409 quando tom já existe em outra tonalidade', async () => {
      await expect(tonalidadesService.update(MOCK_TONALIDADES[0].id, MOCK_TONALIDADES[1].tom)).rejects.toMatchObject({
        statusCode: 409,
        message: 'Tom já existe',
      });
    });
  });

  // ─── delete ──────────────────────────────────────────
  describe('delete', () => {
    it('deve remover uma tonalidade existente', async () => {
      const result = await tonalidadesService.delete(MOCK_TONALIDADES[0].id);
      expect(result).toEqual({ id: MOCK_TONALIDADES[0].id, tom: MOCK_TONALIDADES[0].tom });
    });

    it('deve lançar AppError 400 quando id não é enviado', async () => {
      await expect(tonalidadesService.delete('')).rejects.toMatchObject({
        statusCode: 400,
        message: 'ID de tonalidade não enviado',
      });
    });

    it('deve lançar AppError 404 quando tonalidade não existe', async () => {
      await expect(tonalidadesService.delete(NON_EXISTENT_ID)).rejects.toMatchObject({
        statusCode: 404,
        message: 'A tonalidade não foi encontrada ou não existe',
      });
    });
  });
});
