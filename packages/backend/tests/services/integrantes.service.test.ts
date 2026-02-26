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

/** Testes unitários do serviço de integrantes. */
describe('IntegrantesService', () => {
  /** Reseta dados e mocks antes de cada teste. */
  beforeEach(() => {
    fakeRepo.reset();
    vi.clearAllMocks();
  });

  // ─── listAll ─────────────────────────────────────────
  /** Testes do método listAll. */
  describe('listAll', () => {
    /** Verifica que a listagem retorna integrantes com funções mapeadas e sem senha. */
    it('deve retornar integrantes com funções mapeadas', async () => {
      const result = await integrantesService.listAll();
      expect(result).toHaveLength(MOCK_INTEGRANTES.length);
      expect(result[0]).toHaveProperty('funcoes');
      expect(result[0]).not.toHaveProperty('senha');
      expect(result[0].Integrantes_Funcoes).toBeUndefined();
    });
  });

  // ─── getById ─────────────────────────────────────────
  /** Testes do método getById. */
  describe('getById', () => {
    /** Verifica que retorna integrante com funções quando ID é válido. */
    it('deve retornar um integrante com funções pelo id', async () => {
      const result = await integrantesService.getById(MOCK_INTEGRANTES[0].id);
      expect(result).toHaveProperty('funcoes');
      expect(result.Integrantes_Funcoes).toBeUndefined();
    });

    /** Verifica que ID vazio lança AppError 400. */
    it('deve lançar AppError 400 quando id não é enviado', async () => {
      await expect(integrantesService.getById('')).rejects.toMatchObject({
        statusCode: 400,
        message: 'ID de integrante não enviado',
      });
    });

    /** Verifica que ID inexistente lança AppError 404. */
    it('deve lançar AppError 404 quando integrante não existe', async () => {
      await expect(integrantesService.getById(NON_EXISTENT_ID)).rejects.toMatchObject({
        statusCode: 404,
        message: 'O integrante não foi encontrado ou não existe',
      });
    });
  });

  // ─── create ──────────────────────────────────────────
  /** Testes do método create. */
  describe('create', () => {
    /** Verifica que integrante é criado com senha hasheada e sem campo senha no retorno. */
    it('deve criar integrante com senha hasheada e sem campo senha no retorno', async () => {
      const result = await integrantesService.create({
        nome: 'Novo Integrante',
        email: 'novo@igreja.com',
        senha: 'senha123',
        telefone: '11999990099',
      });
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('nome', 'Novo Integrante');
      expect(result).not.toHaveProperty('senha');
      expect(bcrypt.hash).toHaveBeenCalledWith('senha123', 12);
    });

    /** Verifica que dados obrigatórios ausentes lançam AppError 400. */
    it('deve lançar AppError 400 quando dados obrigatórios não são enviados', async () => {
      await expect(integrantesService.create({})).rejects.toMatchObject({
        statusCode: 400,
        message: 'Dados não enviados',
      });
    });

    /** Verifica que email duplicado no create lança AppError 409. */
    it('deve lançar AppError 409 quando email é duplicado', async () => {
      await expect(integrantesService.create({
        nome: 'Outro',
        email: MOCK_INTEGRANTES[0].email,
        senha: 'senha123',
      })).rejects.toMatchObject({
        statusCode: 409,
        message: 'Já existe um integrante com esse email',
      });
    });
  });

  // ─── update ──────────────────────────────────────────
  /** Testes do método update. */
  describe('update', () => {
    /** Verifica que atualização com dados válidos retorna integrante atualizado. */
    it('deve atualizar integrante com dados válidos', async () => {
      const result = await integrantesService.update(MOCK_INTEGRANTES[0].id, { nome: 'Nome Atualizado' });
      expect(result.nome).toBe('Nome Atualizado');
      expect(result).not.toHaveProperty('senha');
    });

    /** Verifica que ID vazio no update lança AppError 400. */
    it('deve lançar AppError 400 quando id não é enviado', async () => {
      await expect(integrantesService.update('', { nome: 'X' })).rejects.toMatchObject({
        statusCode: 400,
        message: 'ID de integrante não enviado',
      });
    });

    /** Verifica que ID inexistente no update lança AppError 404. */
    it('deve lançar AppError 404 quando integrante não existe', async () => {
      await expect(integrantesService.update(NON_EXISTENT_ID, { nome: 'X' })).rejects.toMatchObject({
        statusCode: 404,
        message: 'Integrante com esse ID não existe ou não foi encontrado',
      });
    });

    /** Verifica que body vazio no update lança AppError 400. */
    it('deve lançar AppError 400 quando nenhum dado é enviado', async () => {
      await expect(integrantesService.update(MOCK_INTEGRANTES[0].id, {})).rejects.toMatchObject({
        statusCode: 400,
        message: 'Nenhum dado enviado',
      });
    });

    /** Verifica que email duplicado no update lança AppError 409. */
    it('deve lançar AppError 409 quando email duplicado no update', async () => {
      await expect(integrantesService.update(MOCK_INTEGRANTES[0].id, {
        email: MOCK_INTEGRANTES[1].email,
      })).rejects.toMatchObject({
        statusCode: 409,
        message: 'Já existe um integrante com esse email',
      });
    });

    /** Verifica que nova senha é hasheada corretamente no update. */
    it('deve hashear nova senha no update', async () => {
      await integrantesService.update(MOCK_INTEGRANTES[0].id, { senha: 'novaSenha' });
      expect(bcrypt.hash).toHaveBeenCalledWith('novaSenha', 12);
    });
  });

  // ─── delete ──────────────────────────────────────────
  /** Testes do método delete. */
  describe('delete', () => {
    /** Verifica que integrante existente é removido e retornado sem senha. */
    it('deve remover um integrante existente', async () => {
      const result = await integrantesService.delete(MOCK_INTEGRANTES[0].id);
      expect(result).toHaveProperty('id', MOCK_INTEGRANTES[0].id);
      expect(result).not.toHaveProperty('senha');
    });

    /** Verifica que ID vazio no delete lança AppError 400. */
    it('deve lançar AppError 400 quando id não é enviado', async () => {
      await expect(integrantesService.delete('')).rejects.toMatchObject({
        statusCode: 400,
        message: 'ID de integrante não enviado',
      });
    });

    /** Verifica que ID inexistente no delete lança AppError 404. */
    it('deve lançar AppError 404 quando integrante não existe', async () => {
      await expect(integrantesService.delete(NON_EXISTENT_ID)).rejects.toMatchObject({
        statusCode: 404,
        message: 'O integrante não foi encontrado ou não existe',
      });
    });
  });

  // ─── listFuncoes ─────────────────────────────────────
  /** Testes do método listFuncoes. */
  describe('listFuncoes', () => {
    /** Verifica que retorna lista de funções com id e nome. */
    it('deve retornar funções mapeadas do integrante', async () => {
      const result = await integrantesService.listFuncoes(MOCK_INTEGRANTES[0].id);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('nome');
    });
  });

  // ─── addFuncao ───────────────────────────────────────
  /** Testes do método addFuncao. */
  describe('addFuncao', () => {
    /** Verifica que vinculação de função ao integrante resolve sem erro. */
    it('deve vincular uma função ao integrante', async () => {
      const integranteId = MOCK_INTEGRANTES[2].id;
      const funcaoId = MOCK_FUNCOES[0].id;
      await expect(integrantesService.addFuncao(integranteId, funcaoId)).resolves.toBeUndefined();
    });

    /** Verifica que funcao_id ausente lança AppError 400. */
    it('deve lançar AppError 400 quando funcao_id não é enviado', async () => {
      await expect(integrantesService.addFuncao(MOCK_INTEGRANTES[0].id, undefined)).rejects.toMatchObject({
        statusCode: 400,
        message: 'ID da função é obrigatório',
      });
    });

    /** Verifica que integrante inexistente no addFuncao lança AppError 404. */
    it('deve lançar AppError 404 quando integrante não existe', async () => {
      await expect(integrantesService.addFuncao(NON_EXISTENT_ID, MOCK_FUNCOES[0].id)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Integrante não encontrado',
      });
    });

    /** Verifica que função inexistente no addFuncao lança AppError 404. */
    it('deve lançar AppError 404 quando função não existe', async () => {
      await expect(integrantesService.addFuncao(MOCK_INTEGRANTES[0].id, NON_EXISTENT_ID)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Função não encontrada',
      });
    });

    /** Verifica que vínculo duplicado lança AppError 409. */
    it('deve lançar AppError 409 quando relação já existe', async () => {
      const existing = MOCK_INTEGRANTES_FUNCOES[0];
      await expect(integrantesService.addFuncao(existing.fk_integrante_id, existing.funcao_id)).rejects.toMatchObject({
        statusCode: 409,
        message: 'Registro duplicado',
      });
    });
  });

  // ─── removeFuncao ────────────────────────────────────
  /** Testes do método removeFuncao. */
  describe('removeFuncao', () => {
    /** Verifica que remoção de vínculo existente resolve sem erro. */
    it('deve remover uma função vinculada ao integrante', async () => {
      const existing = MOCK_INTEGRANTES_FUNCOES[0];
      await expect(integrantesService.removeFuncao(existing.fk_integrante_id, existing.funcao_id)).resolves.toBeUndefined();
    });

    /** Verifica que remoção de vínculo inexistente lança AppError 404. */
    it('deve lançar AppError 404 quando registro não existe', async () => {
      await expect(integrantesService.removeFuncao(MOCK_INTEGRANTES[0].id, NON_EXISTENT_ID)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Registro não encontrado',
      });
    });
  });
});
