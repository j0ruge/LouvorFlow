import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createFakeEventosRepository } from '../fakes/fake-eventos.repository.js';
import {
  MOCK_EVENTOS,
  MOCK_TIPOS_EVENTOS,
  MOCK_MUSICAS_BASE,
  MOCK_INTEGRANTES,
  MOCK_EVENTOS_MUSICAS,
  MOCK_EVENTOS_INTEGRANTES,
  NON_EXISTENT_ID,
} from '../fakes/mock-data.js';

const fakeRepo = createFakeEventosRepository();

vi.mock('../../src/repositories/eventos.repository.js', () => ({
  default: fakeRepo,
}));

const { default: eventosService } = await import('../../src/services/eventos.service.js');

describe('EventosService', () => {
  beforeEach(() => {
    fakeRepo.reset();
  });

  // ─── listAll ────────────────────────────────────────────
  describe('listAll', () => {
    it('deve retornar eventos formatados com tipoEvento, musicas e integrantes', async () => {
      const result = await eventosService.listAll();
      expect(result).toHaveLength(MOCK_EVENTOS.length);
      expect(result[0]).toHaveProperty('tipoEvento');
      expect(result[0]).toHaveProperty('musicas');
      expect(result[0]).toHaveProperty('integrantes');
    });
  });

  // ─── getById ────────────────────────────────────────────
  describe('getById', () => {
    it('deve retornar evento detalhado pelo id', async () => {
      const result = await eventosService.getById(MOCK_EVENTOS[0].id);
      expect(result).toHaveProperty('id', MOCK_EVENTOS[0].id);
      expect(result).toHaveProperty('tipoEvento');
      expect(result.musicas[0]).toHaveProperty('tonalidade');
      expect(result.integrantes[0]).toHaveProperty('funcoes');
    });

    it('deve lançar AppError 400 quando id não é enviado', async () => {
      await expect(eventosService.getById('')).rejects.toMatchObject({
        statusCode: 400,
        message: 'ID de evento não enviado',
      });
    });

    it('deve lançar AppError 404 quando evento não existe', async () => {
      await expect(eventosService.getById(NON_EXISTENT_ID)).rejects.toMatchObject({
        statusCode: 404,
        message: 'O evento não foi encontrado ou não existe',
      });
    });
  });

  // ─── create ─────────────────────────────────────────────
  describe('create', () => {
    it('deve criar evento com dados válidos', async () => {
      const result = await eventosService.create({
        data: '2026-05-01T10:00:00Z',
        fk_tipo_evento: MOCK_TIPOS_EVENTOS[0].id,
        descricao: 'Novo evento de teste',
      });
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('descricao', 'Novo evento de teste');
      expect(result).toHaveProperty('tipoEvento');
    });

    it('deve lançar AppError 400 quando data não é enviada', async () => {
      await expect(eventosService.create({
        fk_tipo_evento: MOCK_TIPOS_EVENTOS[0].id,
        descricao: 'Teste',
      })).rejects.toMatchObject({
        statusCode: 400,
        message: 'Data do evento é obrigatória',
      });
    });

    it('deve lançar AppError 400 quando fk_tipo_evento não é enviado', async () => {
      await expect(eventosService.create({
        data: '2026-05-01T10:00:00Z',
        descricao: 'Teste',
      })).rejects.toMatchObject({
        statusCode: 400,
        message: 'Tipo de evento é obrigatório',
      });
    });

    it('deve lançar AppError 400 quando descricao não é enviada', async () => {
      await expect(eventosService.create({
        data: '2026-05-01T10:00:00Z',
        fk_tipo_evento: MOCK_TIPOS_EVENTOS[0].id,
      })).rejects.toMatchObject({
        statusCode: 400,
        message: 'Descrição do evento é obrigatória',
      });
    });

    it('deve lançar AppError 400 quando data é inválida', async () => {
      await expect(eventosService.create({
        data: 'not-a-date',
        fk_tipo_evento: MOCK_TIPOS_EVENTOS[0].id,
        descricao: 'Teste',
      })).rejects.toMatchObject({
        statusCode: 400,
        message: 'Data do evento é inválida (use formato ISO 8601, ex: 2026-02-14T10:00:00Z)',
      });
    });
  });

  // ─── update ─────────────────────────────────────────────
  describe('update', () => {
    it('deve atualizar evento com dados válidos', async () => {
      const result = await eventosService.update(MOCK_EVENTOS[0].id, { descricao: 'Descrição atualizada' });
      expect(result.descricao).toBe('Descrição atualizada');
      expect(result).toHaveProperty('tipoEvento');
    });

    it('deve lançar AppError 400 quando id não é enviado', async () => {
      await expect(eventosService.update('', { descricao: 'X' })).rejects.toMatchObject({
        statusCode: 400,
        message: 'ID de evento não enviado',
      });
    });

    it('deve lançar AppError 404 quando evento não existe', async () => {
      await expect(eventosService.update(NON_EXISTENT_ID, { descricao: 'X' })).rejects.toMatchObject({
        statusCode: 404,
        message: 'O evento não foi encontrado ou não existe',
      });
    });

    it('deve lançar AppError 400 quando data é inválida no update', async () => {
      await expect(eventosService.update(MOCK_EVENTOS[0].id, { data: 'invalid-date' })).rejects.toMatchObject({
        statusCode: 400,
        message: 'Data do evento é inválida (use formato ISO 8601, ex: 2026-02-14T10:00:00Z)',
      });
    });

    it('deve lançar AppError 400 quando nenhum campo é enviado', async () => {
      await expect(eventosService.update(MOCK_EVENTOS[0].id, {})).rejects.toMatchObject({
        statusCode: 400,
        message: 'Ao menos um campo deve ser enviado para atualização',
      });
    });
  });

  // ─── delete ─────────────────────────────────────────────
  describe('delete', () => {
    it('deve remover um evento existente', async () => {
      const result = await eventosService.delete(MOCK_EVENTOS[0].id);
      expect(result).toHaveProperty('id', MOCK_EVENTOS[0].id);
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('descricao');
    });

    it('deve lançar AppError 400 quando id não é enviado', async () => {
      await expect(eventosService.delete('')).rejects.toMatchObject({
        statusCode: 400,
        message: 'ID de evento não enviado',
      });
    });

    it('deve lançar AppError 404 quando evento não existe', async () => {
      await expect(eventosService.delete(NON_EXISTENT_ID)).rejects.toMatchObject({
        statusCode: 404,
        message: 'O evento não foi encontrado ou não existe',
      });
    });
  });

  // ─── listMusicas ────────────────────────────────────────
  describe('listMusicas', () => {
    it('deve retornar músicas do evento com tonalidade', async () => {
      const result = await eventosService.listMusicas(MOCK_EVENTOS[0].id);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('nome');
      expect(result[0]).toHaveProperty('tonalidade');
    });

    it('deve lançar AppError 404 quando evento não existe', async () => {
      await expect(eventosService.listMusicas(NON_EXISTENT_ID)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Evento não encontrado',
      });
    });
  });

  // ─── addMusica ──────────────────────────────────────────
  describe('addMusica', () => {
    it('deve vincular música ao evento', async () => {
      await expect(
        eventosService.addMusica(MOCK_EVENTOS[0].id, MOCK_MUSICAS_BASE[2].id)
      ).resolves.toBeUndefined();
    });

    it('deve lançar AppError 400 quando musicas_id não é enviado', async () => {
      await expect(eventosService.addMusica(MOCK_EVENTOS[0].id, undefined)).rejects.toMatchObject({
        statusCode: 400,
        message: 'ID da música é obrigatório',
      });
    });

    it('deve lançar AppError 404 quando evento não existe', async () => {
      await expect(eventosService.addMusica(NON_EXISTENT_ID, MOCK_MUSICAS_BASE[0].id)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Evento não encontrado',
      });
    });

    it('deve lançar AppError 404 quando música não existe', async () => {
      await expect(eventosService.addMusica(MOCK_EVENTOS[0].id, NON_EXISTENT_ID)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Música não encontrada',
      });
    });

    it('deve lançar AppError 409 quando registro duplicado', async () => {
      const existing = MOCK_EVENTOS_MUSICAS[0];
      await expect(eventosService.addMusica(existing.evento_id, existing.musicas_id)).rejects.toMatchObject({
        statusCode: 409,
        message: 'Registro duplicado',
      });
    });
  });

  // ─── removeMusica ───────────────────────────────────────
  describe('removeMusica', () => {
    it('deve remover música vinculada', async () => {
      const existing = MOCK_EVENTOS_MUSICAS[0];
      await expect(eventosService.removeMusica(existing.evento_id, existing.musicas_id)).resolves.toBeUndefined();
    });

    it('deve lançar AppError 404 quando registro não existe', async () => {
      await expect(eventosService.removeMusica(MOCK_EVENTOS[0].id, NON_EXISTENT_ID)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Registro não encontrado',
      });
    });
  });

  // ─── listIntegrantes ────────────────────────────────────
  describe('listIntegrantes', () => {
    it('deve retornar integrantes do evento com funções', async () => {
      const result = await eventosService.listIntegrantes(MOCK_EVENTOS[0].id);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('nome');
      expect(result[0]).toHaveProperty('funcoes');
    });

    it('deve lançar AppError 404 quando evento não existe', async () => {
      await expect(eventosService.listIntegrantes(NON_EXISTENT_ID)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Evento não encontrado',
      });
    });
  });

  // ─── addIntegrante ──────────────────────────────────────
  describe('addIntegrante', () => {
    it('deve vincular integrante ao evento', async () => {
      await expect(
        eventosService.addIntegrante(MOCK_EVENTOS[0].id, MOCK_INTEGRANTES[2].id)
      ).resolves.toBeUndefined();
    });

    it('deve lançar AppError 400 quando fk_integrante_id não é enviado', async () => {
      await expect(eventosService.addIntegrante(MOCK_EVENTOS[0].id, undefined)).rejects.toMatchObject({
        statusCode: 400,
        message: 'ID do integrante é obrigatório',
      });
    });

    it('deve lançar AppError 404 quando evento não existe', async () => {
      await expect(eventosService.addIntegrante(NON_EXISTENT_ID, MOCK_INTEGRANTES[0].id)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Evento não encontrado',
      });
    });

    it('deve lançar AppError 404 quando integrante não existe', async () => {
      await expect(eventosService.addIntegrante(MOCK_EVENTOS[0].id, NON_EXISTENT_ID)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Integrante não encontrado',
      });
    });

    it('deve lançar AppError 409 quando registro duplicado', async () => {
      const existing = MOCK_EVENTOS_INTEGRANTES[0];
      await expect(eventosService.addIntegrante(existing.evento_id, existing.fk_integrante_id)).rejects.toMatchObject({
        statusCode: 409,
        message: 'Registro duplicado',
      });
    });
  });

  // ─── removeIntegrante ───────────────────────────────────
  describe('removeIntegrante', () => {
    it('deve remover integrante vinculado', async () => {
      const existing = MOCK_EVENTOS_INTEGRANTES[0];
      await expect(eventosService.removeIntegrante(existing.evento_id, existing.fk_integrante_id)).resolves.toBeUndefined();
    });

    it('deve lançar AppError 404 quando registro não existe', async () => {
      await expect(eventosService.removeIntegrante(MOCK_EVENTOS[0].id, NON_EXISTENT_ID)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Registro não encontrado',
      });
    });
  });
});
