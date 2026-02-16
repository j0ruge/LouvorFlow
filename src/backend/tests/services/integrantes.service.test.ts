import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createFakeIntegrantesRepository } from '../fakes/fake-integrantes.repository.js';
import { MOCK_INTEGRANTES, MOCK_FUNCOES, MOCK_INTEGRANTES_FUNCOES, NON_EXISTENT_ID } from '../fakes/mock-data.js';

const fakeRepo = createFakeIntegrantesRepository();

vi.mock('../../src/repositories/integrantes.repository.js', () => ({
  default: fakeRepo,
}));

vi.mock('bcryptjs', () => ({
  default: {
    hash: vi.fn().mockResolvedValue('hashed_password'),
    compare: vi.fn().mockResolvedValue(true),
  },
}));

const { default: integrantesService } = await import('../../src/services/integrantes.service.js');
const bcrypt = (await import('bcryptjs')).default;

describe('IntegrantesService', () => {
  beforeEach(() => {
    fakeRepo.reset();
    vi.clearAllMocks();
  });

  // ─── listAll ─────────────────────────────────────────
  describe('listAll', () => {
    it('deve retornar integrantes com funções mapeadas', async () => {
      const result = await integrantesService.listAll();
      expect(result).toHaveLength(MOCK_INTEGRANTES.length);
      expect(result[0]).toHaveProperty('funcoes');
      expect(result[0]).not.toHaveProperty('senha');
      expect(result[0].Integrantes_Funcoes).toBeUndefined();
    });
  });

  // ─── getById ─────────────────────────────────────────
  describe('getById', () => {
    it('deve retornar um integrante com funções pelo id', async () => {
      const result = await integrantesService.getById(MOCK_INTEGRANTES[0].id);
      expect(result).toHaveProperty('funcoes');
      expect(result.Integrantes_Funcoes).toBeUndefined();
    });

    it('deve lançar AppError 400 quando id não é enviado', async () => {
      await expect(integrantesService.getById('')).rejects.toMatchObject({
        statusCode: 400,
        message: 'ID de integrante não enviado',
      });
    });

    it('deve lançar AppError 404 quando integrante não existe', async () => {
      await expect(integrantesService.getById(NON_EXISTENT_ID)).rejects.toMatchObject({
        statusCode: 404,
        message: 'O integrante não foi encontrado ou não existe',
      });
    });
  });

  // ─── create ──────────────────────────────────────────
  describe('create', () => {
    it('deve criar integrante com senha hasheada e sem campo senha no retorno', async () => {
      const result = await integrantesService.create({
        nome: 'Novo Integrante',
        doc_id: '55566677788',
        email: 'novo@igreja.com',
        senha: 'senha123',
        telefone: '11999990099',
      });
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('nome', 'Novo Integrante');
      expect(result).not.toHaveProperty('senha');
      expect(bcrypt.hash).toHaveBeenCalledWith('senha123', 12);
    });

    it('deve normalizar doc_id removendo caracteres não numéricos', async () => {
      const result = await integrantesService.create({
        nome: 'Teste CPF',
        doc_id: '555.666.777-88',
        email: 'teste@igreja.com',
        senha: 'senha123',
      });
      expect(result.doc_id).toBe('55566677788');
    });

    it('deve lançar AppError 400 quando dados obrigatórios não são enviados', async () => {
      await expect(integrantesService.create({})).rejects.toMatchObject({
        statusCode: 400,
        message: 'Dados não enviados',
      });
    });

    it('deve lançar AppError 409 quando doc_id é duplicado', async () => {
      await expect(integrantesService.create({
        nome: 'Outro',
        doc_id: MOCK_INTEGRANTES[0].doc_id,
        email: 'outro@igreja.com',
        senha: 'senha123',
      })).rejects.toMatchObject({
        statusCode: 409,
        message: 'Já existe um integrante com esse doc_id',
      });
    });
  });

  // ─── update ──────────────────────────────────────────
  describe('update', () => {
    it('deve atualizar integrante com dados válidos', async () => {
      const result = await integrantesService.update(MOCK_INTEGRANTES[0].id, { nome: 'Nome Atualizado' });
      expect(result.nome).toBe('Nome Atualizado');
      expect(result).not.toHaveProperty('senha');
    });

    it('deve lançar AppError 400 quando id não é enviado', async () => {
      await expect(integrantesService.update('', { nome: 'X' })).rejects.toMatchObject({
        statusCode: 400,
        message: 'ID de integrante não enviado',
      });
    });

    it('deve lançar AppError 404 quando integrante não existe', async () => {
      await expect(integrantesService.update(NON_EXISTENT_ID, { nome: 'X' })).rejects.toMatchObject({
        statusCode: 404,
        message: 'Integrante com esse ID não existe ou não foi encontrado',
      });
    });

    it('deve lançar AppError 400 quando nenhum dado é enviado', async () => {
      await expect(integrantesService.update(MOCK_INTEGRANTES[0].id, {})).rejects.toMatchObject({
        statusCode: 400,
        message: 'Nenhum dado enviado',
      });
    });

    it('deve lançar AppError 409 quando doc_id duplicado no update', async () => {
      await expect(integrantesService.update(MOCK_INTEGRANTES[0].id, {
        doc_id: MOCK_INTEGRANTES[1].doc_id,
      })).rejects.toMatchObject({
        statusCode: 409,
        message: 'Já existe um integrante com esse doc_id',
      });
    });

    it('deve hashear nova senha no update', async () => {
      await integrantesService.update(MOCK_INTEGRANTES[0].id, { senha: 'novaSenha' });
      expect(bcrypt.hash).toHaveBeenCalledWith('novaSenha', 12);
    });
  });

  // ─── delete ──────────────────────────────────────────
  describe('delete', () => {
    it('deve remover um integrante existente', async () => {
      const result = await integrantesService.delete(MOCK_INTEGRANTES[0].id);
      expect(result).toHaveProperty('id', MOCK_INTEGRANTES[0].id);
      expect(result).not.toHaveProperty('senha');
    });

    it('deve lançar AppError 400 quando id não é enviado', async () => {
      await expect(integrantesService.delete('')).rejects.toMatchObject({
        statusCode: 400,
        message: 'ID de integrante não enviado',
      });
    });

    it('deve lançar AppError 404 quando integrante não existe', async () => {
      await expect(integrantesService.delete(NON_EXISTENT_ID)).rejects.toMatchObject({
        statusCode: 404,
        message: 'O integrante não foi encontrado ou não existe',
      });
    });
  });

  // ─── listFuncoes ─────────────────────────────────────
  describe('listFuncoes', () => {
    it('deve retornar funções mapeadas do integrante', async () => {
      const result = await integrantesService.listFuncoes(MOCK_INTEGRANTES[0].id);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('nome');
    });
  });

  // ─── addFuncao ───────────────────────────────────────
  describe('addFuncao', () => {
    it('deve vincular uma função ao integrante', async () => {
      const integranteId = MOCK_INTEGRANTES[2].id;
      const funcaoId = MOCK_FUNCOES[0].id;
      await expect(integrantesService.addFuncao(integranteId, funcaoId)).resolves.toBeUndefined();
    });

    it('deve lançar AppError 400 quando funcao_id não é enviado', async () => {
      await expect(integrantesService.addFuncao(MOCK_INTEGRANTES[0].id, undefined)).rejects.toMatchObject({
        statusCode: 400,
        message: 'ID da função é obrigatório',
      });
    });

    it('deve lançar AppError 404 quando integrante não existe', async () => {
      await expect(integrantesService.addFuncao(NON_EXISTENT_ID, MOCK_FUNCOES[0].id)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Integrante não encontrado',
      });
    });

    it('deve lançar AppError 404 quando função não existe', async () => {
      await expect(integrantesService.addFuncao(MOCK_INTEGRANTES[0].id, NON_EXISTENT_ID)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Função não encontrada',
      });
    });

    it('deve lançar AppError 409 quando relação já existe', async () => {
      const existing = MOCK_INTEGRANTES_FUNCOES[0];
      await expect(integrantesService.addFuncao(existing.musico_id, existing.funcao_id)).rejects.toMatchObject({
        statusCode: 409,
        message: 'Registro duplicado',
      });
    });
  });

  // ─── removeFuncao ────────────────────────────────────
  describe('removeFuncao', () => {
    it('deve remover uma função vinculada ao integrante', async () => {
      const existing = MOCK_INTEGRANTES_FUNCOES[0];
      await expect(integrantesService.removeFuncao(existing.musico_id, existing.funcao_id)).resolves.toBeUndefined();
    });

    it('deve lançar AppError 404 quando registro não existe', async () => {
      await expect(integrantesService.removeFuncao(MOCK_INTEGRANTES[0].id, NON_EXISTENT_ID)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Registro não encontrado',
      });
    });
  });
});
