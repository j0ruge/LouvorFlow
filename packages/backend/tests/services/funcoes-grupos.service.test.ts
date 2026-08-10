import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createFakeFuncoesGruposRepository } from '../fakes/fake-funcoes-grupos.repository.js';
import { MOCK_FUNCOES, MOCK_FUNCOES_GRUPOS, NON_EXISTENT_ID } from '../fakes/mock-data.js';

const fakeRepo = createFakeFuncoesGruposRepository();

vi.mock('../../src/repositories/funcoes-grupos.repository.js', () => ({
  default: fakeRepo,
}));

const { default: funcoesGruposService } = await import('../../src/services/funcoes-grupos.service.js');

/** IDs dos grupos mock, na ordem em que foram declarados. */
const [GRUPO_MINISTRACAO, GRUPO_VOCAL, GRUPO_INSTRUMENTOS] = MOCK_FUNCOES_GRUPOS;

/**
 * Suíte do serviço de grupos de funções — cobre CRUD, reordenação
 * e substituição do conjunto de funções de um grupo.
 */
describe('FuncoesGruposService', () => {
  beforeEach(() => {
    fakeRepo.reset();
  });

  // ─── listAll ─────────────────────────────────────────
  describe('listAll', () => {
    /** Garante que a listagem devolve todos os grupos na ordem de exibição. */
    it('deve retornar os grupos ordenados por ordem crescente', async () => {
      const result = await funcoesGruposService.listAll();
      expect(result).toHaveLength(MOCK_FUNCOES_GRUPOS.length);
      expect(result.map(g => g.ordem)).toEqual([1, 2, 3]);
      expect(result[0].nome).toBe('Ministração');
    });

    /** Garante que a relação Prisma `Funcoes` é achatada para `funcoes` na resposta. */
    it('deve expor as funções do grupo na chave "funcoes"', async () => {
      const result = await funcoesGruposService.listAll();
      const vocal = result.find(g => g.id === GRUPO_VOCAL.id);
      expect(vocal).toBeDefined();
      expect(vocal).not.toHaveProperty('Funcoes');
      expect(vocal!.funcoes).toEqual([{ id: MOCK_FUNCOES[0].id, nome: 'Vocal' }]);
    });
  });

  // ─── create ──────────────────────────────────────────
  describe('create', () => {
    /** Garante que um grupo novo entra no fim da sequência, sem funções. */
    it('deve criar um grupo com ordem igual à maior existente + 1', async () => {
      const result = await funcoesGruposService.create('Apoio Técnico', 'tenant-fake-id');
      expect(result).toHaveProperty('id');
      expect(result.nome).toBe('Apoio Técnico');
      expect(result.ordem).toBe(MOCK_FUNCOES_GRUPOS.length + 1);
      expect(result.funcoes).toEqual([]);
    });

    /** Garante que o nome é obrigatório na criação. */
    it('deve lançar AppError 400 quando nome não é enviado', async () => {
      await expect(funcoesGruposService.create(undefined, 'tenant-fake-id')).rejects.toMatchObject({
        statusCode: 400,
        message: 'Nome do grupo é obrigatório',
      });
    });

    /** Garante que a unicidade de nome por tenant é respeitada. */
    it('deve lançar AppError 409 quando nome é duplicado', async () => {
      await expect(funcoesGruposService.create(GRUPO_VOCAL.nome, 'tenant-fake-id')).rejects.toMatchObject({
        statusCode: 409,
        message: 'Já existe um grupo com esse nome',
      });
    });
  });

  // ─── update ──────────────────────────────────────────
  describe('update', () => {
    /** Garante que a renomeação preserva ordem e funções do grupo. */
    it('deve renomear um grupo existente', async () => {
      const result = await funcoesGruposService.update(GRUPO_VOCAL.id, 'Vozes');
      expect(result.nome).toBe('Vozes');
      expect(result.ordem).toBe(GRUPO_VOCAL.ordem);
      expect(result.funcoes).toHaveLength(1);
    });

    /** Garante 404 para grupo inexistente. */
    it('deve lançar AppError 404 quando o grupo não existe', async () => {
      await expect(funcoesGruposService.update(NON_EXISTENT_ID, 'Vozes')).rejects.toMatchObject({
        statusCode: 404,
        message: 'Grupo com esse ID não existe ou não foi encontrado',
      });
    });

    /** Garante que o nome é obrigatório na edição. */
    it('deve lançar AppError 400 quando nome não é enviado', async () => {
      await expect(funcoesGruposService.update(GRUPO_VOCAL.id, undefined)).rejects.toMatchObject({
        statusCode: 400,
        message: 'Nome do grupo é obrigatório',
      });
    });

    /** Garante que renomear para um nome já usado por outro grupo é rejeitado. */
    it('deve lançar AppError 409 quando o novo nome já pertence a outro grupo', async () => {
      await expect(funcoesGruposService.update(GRUPO_VOCAL.id, GRUPO_MINISTRACAO.nome)).rejects.toMatchObject({
        statusCode: 409,
        message: 'Nome de grupo já existe',
      });
    });
  });

  // ─── delete ──────────────────────────────────────────
  describe('delete', () => {
    /** Garante que a exclusão remove o grupo e devolve o registro removido. */
    it('deve remover o grupo e retorná-lo', async () => {
      const result = await funcoesGruposService.delete(GRUPO_VOCAL.id);
      expect(result.id).toBe(GRUPO_VOCAL.id);

      const restantes = await funcoesGruposService.listAll();
      expect(restantes.map(g => g.id)).not.toContain(GRUPO_VOCAL.id);
    });

    /** Garante 404 ao excluir grupo inexistente. */
    it('deve lançar AppError 404 quando o grupo não existe', async () => {
      await expect(funcoesGruposService.delete(NON_EXISTENT_ID)).rejects.toMatchObject({
        statusCode: 404,
        message: 'O grupo não foi encontrado ou não existe',
      });
    });
  });

  // ─── reorder ─────────────────────────────────────────
  describe('reorder', () => {
    /** Garante que a nova sequência é persistida como ordem 1..N. */
    it('deve reordenar os grupos conforme a lista recebida', async () => {
      await funcoesGruposService.reorder([
        GRUPO_INSTRUMENTOS.id,
        GRUPO_MINISTRACAO.id,
        GRUPO_VOCAL.id,
      ]);

      const result = await funcoesGruposService.listAll();
      expect(result.map(g => g.id)).toEqual([
        GRUPO_INSTRUMENTOS.id,
        GRUPO_MINISTRACAO.id,
        GRUPO_VOCAL.id,
      ]);
      expect(result.map(g => g.ordem)).toEqual([1, 2, 3]);
    });

    /** Garante que um subconjunto é rejeitado — a ordem final ficaria ambígua. */
    it('deve lançar AppError 400 quando faltam grupos na lista', async () => {
      await expect(
        funcoesGruposService.reorder([GRUPO_VOCAL.id, GRUPO_MINISTRACAO.id])
      ).rejects.toMatchObject({
        statusCode: 400,
        message: 'A lista de grupos não corresponde aos grupos cadastrados',
      });
    });

    /** Garante que IDs sobrando são rejeitados. */
    it('deve lançar AppError 400 quando há ID a mais na lista', async () => {
      await expect(
        funcoesGruposService.reorder([
          GRUPO_MINISTRACAO.id,
          GRUPO_VOCAL.id,
          GRUPO_INSTRUMENTOS.id,
          NON_EXISTENT_ID,
        ])
      ).rejects.toMatchObject({ statusCode: 400 });
    });

    /** Garante que um ID de outro tenant (ou inexistente) é rejeitado. */
    it('deve lançar AppError 400 quando a lista contém ID desconhecido', async () => {
      await expect(
        funcoesGruposService.reorder([
          GRUPO_MINISTRACAO.id,
          GRUPO_VOCAL.id,
          NON_EXISTENT_ID,
        ])
      ).rejects.toMatchObject({
        statusCode: 400,
        message: 'A lista de grupos não corresponde aos grupos cadastrados',
      });
    });
  });

  // ─── setFuncoes ──────────────────────────────────────
  describe('setFuncoes', () => {
    /** Garante que o conjunto de funções do grupo é substituído pelo recebido. */
    it('deve substituir as funções do grupo', async () => {
      const guitarra = MOCK_FUNCOES[1];
      const result = await funcoesGruposService.setFuncoes(GRUPO_VOCAL.id, [guitarra.id]);

      expect(result.funcoes).toEqual([{ id: guitarra.id, nome: guitarra.nome }]);
    });

    /** Garante que mover uma função a remove do grupo anterior (vínculo 1:N). */
    it('deve remover a função do grupo anterior ao movê-la', async () => {
      const guitarra = MOCK_FUNCOES[1];
      await funcoesGruposService.setFuncoes(GRUPO_VOCAL.id, [guitarra.id]);

      const grupos = await funcoesGruposService.listAll();
      const instrumentos = grupos.find(g => g.id === GRUPO_INSTRUMENTOS.id);
      expect(instrumentos!.funcoes.map(f => f.id)).not.toContain(guitarra.id);
    });

    /** Garante que lista vazia esvazia o grupo, desvinculando suas funções. */
    it('deve aceitar lista vazia e esvaziar o grupo', async () => {
      const result = await funcoesGruposService.setFuncoes(GRUPO_INSTRUMENTOS.id, []);
      expect(result.funcoes).toEqual([]);
    });

    /** Garante 404 para grupo inexistente. */
    it('deve lançar AppError 404 quando o grupo não existe', async () => {
      await expect(funcoesGruposService.setFuncoes(NON_EXISTENT_ID, [])).rejects.toMatchObject({
        statusCode: 404,
        message: 'O grupo não foi encontrado ou não existe',
      });
    });

    /** Garante que IDs de função inexistentes no tenant são rejeitados. */
    it('deve lançar AppError 400 quando alguma função não existe', async () => {
      await expect(
        funcoesGruposService.setFuncoes(GRUPO_VOCAL.id, [MOCK_FUNCOES[0].id, NON_EXISTENT_ID])
      ).rejects.toMatchObject({
        statusCode: 400,
        message: 'Uma ou mais funções não foram encontradas',
      });
    });
  });
});
