import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createFakeMusicasRepository } from '../fakes/fake-musicas.repository.js';
import {
  MOCK_MUSICAS_BASE,
  MOCK_TONALIDADES,
  MOCK_ARTISTAS,
  MOCK_ARTISTAS_MUSICAS,
  MOCK_MUSICAS_TAGS,
  MOCK_MUSICAS_FUNCOES,
  MOCK_TAGS,
  MOCK_FUNCOES,
  NON_EXISTENT_ID,
} from '../fakes/mock-data.js';

const fakeRepo = createFakeMusicasRepository();

vi.mock('../../src/repositories/musicas.repository.js', () => ({
  default: fakeRepo,
}));

vi.mock('../../src/repositories/tonalidades.repository.js', () => ({
  default: {
    findById: async (id: string) => MOCK_TONALIDADES.find(t => t.id === id) ?? null,
  },
}));

const { default: musicasService } = await import('../../src/services/musicas.service.js');

describe('MusicasService', () => {
  beforeEach(() => {
    fakeRepo.reset();
  });

  // ─── listAll (paginação) ────────────────────────────────
  describe('listAll', () => {
    it('deve retornar músicas paginadas com meta (defaults page=1, limit=20)', async () => {
      const result = await musicasService.listAll(undefined as unknown as number, undefined as unknown as number);
      expect(result.items).toHaveLength(20);
      expect(result.meta.total).toBe(25);
      expect(result.meta.page).toBe(1);
      expect(result.meta.per_page).toBe(20);
      expect(result.meta.total_pages).toBe(2);
    });

    it('deve retornar segunda página corretamente', async () => {
      const result = await musicasService.listAll(2, 20);
      expect(result.items).toHaveLength(5);
      expect(result.meta.page).toBe(2);
    });

    it('deve limitar limit a 100', async () => {
      const result = await musicasService.listAll(1, 200);
      expect(result.meta.per_page).toBe(100);
    });

    it('deve formatar cada música com campos esperados', async () => {
      const result = await musicasService.listAll(1, 5);
      const musica = result.items[0];
      expect(musica).toHaveProperty('id');
      expect(musica).toHaveProperty('nome');
      expect(musica).toHaveProperty('tonalidade');
      expect(musica).toHaveProperty('tags');
      expect(musica).toHaveProperty('versoes');
      expect(musica).toHaveProperty('funcoes');
    });
  });

  // ─── getById ────────────────────────────────────────────
  describe('getById', () => {
    it('deve retornar música formatada pelo id', async () => {
      const result = await musicasService.getById(MOCK_MUSICAS_BASE[0].id);
      expect(result).toHaveProperty('id', MOCK_MUSICAS_BASE[0].id);
      expect(result).toHaveProperty('tonalidade');
      expect(result).toHaveProperty('tags');
      expect(result).toHaveProperty('versoes');
      expect(result).toHaveProperty('funcoes');
    });

    it('deve lançar AppError 400 quando id não é enviado', async () => {
      await expect(musicasService.getById('')).rejects.toMatchObject({
        statusCode: 400,
        message: 'ID de música não enviado',
      });
    });

    it('deve lançar AppError 404 quando música não existe', async () => {
      await expect(musicasService.getById(NON_EXISTENT_ID)).rejects.toMatchObject({
        statusCode: 404,
        message: 'A música não foi encontrada ou não existe',
      });
    });
  });

  // ─── create ─────────────────────────────────────────────
  describe('create', () => {
    it('deve criar música com nome e tonalidade válidos', async () => {
      const result = await musicasService.create({
        nome: 'Nova Música',
        fk_tonalidade: MOCK_TONALIDADES[0].id,
      });
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('nome', 'Nova Música');
      expect(result).toHaveProperty('tonalidade');
      expect(result.tonalidade).toMatchObject({ id: MOCK_TONALIDADES[0].id, tom: 'G' });
    });

    it('deve lançar AppError 400 quando nome não é enviado', async () => {
      await expect(musicasService.create({ fk_tonalidade: MOCK_TONALIDADES[0].id })).rejects.toMatchObject({
        statusCode: 400,
        message: 'Nome da música é obrigatório',
      });
    });

    it('deve lançar AppError 400 quando fk_tonalidade não é enviado', async () => {
      await expect(musicasService.create({ nome: 'Teste' })).rejects.toMatchObject({
        statusCode: 400,
        message: 'Tonalidade é obrigatória',
      });
    });

    it('deve lançar AppError 404 quando tonalidade não existe', async () => {
      await expect(musicasService.create({ nome: 'Teste', fk_tonalidade: NON_EXISTENT_ID })).rejects.toMatchObject({
        statusCode: 404,
        message: 'Tonalidade não encontrada',
      });
    });
  });

  // ─── update ─────────────────────────────────────────────
  describe('update', () => {
    it('deve atualizar música com dados válidos', async () => {
      const result = await musicasService.update(MOCK_MUSICAS_BASE[0].id, { nome: 'Nome Atualizado' });
      expect(result.nome).toBe('Nome Atualizado');
      expect(result).toHaveProperty('tonalidade');
    });

    it('deve lançar AppError 400 quando id não é enviado', async () => {
      await expect(musicasService.update('', { nome: 'X' })).rejects.toMatchObject({
        statusCode: 400,
        message: 'ID de música não enviado',
      });
    });

    it('deve lançar AppError 404 quando música não existe', async () => {
      await expect(musicasService.update(NON_EXISTENT_ID, { nome: 'X' })).rejects.toMatchObject({
        statusCode: 404,
        message: 'A música não foi encontrada ou não existe',
      });
    });

    it('deve lançar AppError 404 quando tonalidade não existe no update', async () => {
      await expect(musicasService.update(MOCK_MUSICAS_BASE[0].id, { fk_tonalidade: NON_EXISTENT_ID })).rejects.toMatchObject({
        statusCode: 404,
        message: 'Tonalidade não encontrada',
      });
    });
  });

  // ─── delete ─────────────────────────────────────────────
  describe('delete', () => {
    it('deve remover uma música existente', async () => {
      const result = await musicasService.delete(MOCK_MUSICAS_BASE[0].id);
      expect(result).toHaveProperty('id', MOCK_MUSICAS_BASE[0].id);
      expect(result).toHaveProperty('nome');
    });

    it('deve lançar AppError 400 quando id não é enviado', async () => {
      await expect(musicasService.delete('')).rejects.toMatchObject({
        statusCode: 400,
        message: 'ID de música não enviado',
      });
    });

    it('deve lançar AppError 404 quando música não existe', async () => {
      await expect(musicasService.delete(NON_EXISTENT_ID)).rejects.toMatchObject({
        statusCode: 404,
        message: 'A música não foi encontrada ou não existe',
      });
    });
  });

  // ─── listVersoes ────────────────────────────────────────
  describe('listVersoes', () => {
    it('deve retornar versões da música com artista mapeado', async () => {
      const result = await musicasService.listVersoes(MOCK_MUSICAS_BASE[0].id);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('artista');
      expect(result[0]).toHaveProperty('bpm');
    });
  });

  // ─── addVersao ──────────────────────────────────────────
  describe('addVersao', () => {
    it('deve vincular uma versão à música', async () => {
      const result = await musicasService.addVersao(MOCK_MUSICAS_BASE[0].id, {
        artista_id: MOCK_ARTISTAS[2].id,
        bpm: 80,
        cifras: 'Am G F C',
      });
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('artista');
      expect(result.bpm).toBe(80);
    });

    it('deve lançar AppError 400 quando artista_id não é enviado', async () => {
      await expect(musicasService.addVersao(MOCK_MUSICAS_BASE[0].id, {})).rejects.toMatchObject({
        statusCode: 400,
        message: 'ID do artista é obrigatório',
      });
    });

    it('deve lançar AppError 404 quando música não existe', async () => {
      await expect(musicasService.addVersao(NON_EXISTENT_ID, { artista_id: MOCK_ARTISTAS[0].id })).rejects.toMatchObject({
        statusCode: 404,
        message: 'Música não encontrada',
      });
    });

    it('deve lançar AppError 404 quando artista não existe', async () => {
      await expect(musicasService.addVersao(MOCK_MUSICAS_BASE[0].id, { artista_id: NON_EXISTENT_ID })).rejects.toMatchObject({
        statusCode: 404,
        message: 'Artista não encontrado',
      });
    });

    it('deve lançar AppError 409 quando versão duplicada', async () => {
      const existing = MOCK_ARTISTAS_MUSICAS[0];
      await expect(musicasService.addVersao(existing.musica_id, { artista_id: existing.artista_id })).rejects.toMatchObject({
        statusCode: 409,
        message: 'Registro duplicado',
      });
    });
  });

  // ─── updateVersao ───────────────────────────────────────
  describe('updateVersao', () => {
    it('deve atualizar versão existente', async () => {
      const result = await musicasService.updateVersao(MOCK_ARTISTAS_MUSICAS[0].id, { bpm: 90 });
      expect(result.bpm).toBe(90);
      expect(result).toHaveProperty('artista');
    });

    it('deve lançar AppError 400 quando nenhum dado é enviado', async () => {
      await expect(musicasService.updateVersao(MOCK_ARTISTAS_MUSICAS[0].id, {})).rejects.toMatchObject({
        statusCode: 400,
        message: 'Ao menos um campo deve ser enviado para atualização',
      });
    });

    it('deve lançar AppError 404 quando versão não existe', async () => {
      await expect(musicasService.updateVersao(NON_EXISTENT_ID, { bpm: 90 })).rejects.toMatchObject({
        statusCode: 404,
        message: 'Versão não encontrada',
      });
    });
  });

  // ─── removeVersao ───────────────────────────────────────
  describe('removeVersao', () => {
    it('deve remover versão existente', async () => {
      await expect(musicasService.removeVersao(MOCK_ARTISTAS_MUSICAS[0].id)).resolves.toBeUndefined();
    });

    it('deve lançar AppError 404 quando versão não existe', async () => {
      await expect(musicasService.removeVersao(NON_EXISTENT_ID)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Versão não encontrada',
      });
    });
  });

  // ─── listTags ───────────────────────────────────────────
  describe('listTags', () => {
    it('deve retornar tags da música', async () => {
      const result = await musicasService.listTags(MOCK_MUSICAS_BASE[0].id);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('nome');
    });
  });

  // ─── addTag ─────────────────────────────────────────────
  describe('addTag', () => {
    it('deve vincular tag à música', async () => {
      await expect(musicasService.addTag(MOCK_MUSICAS_BASE[0].id, MOCK_TAGS[2].id)).resolves.toBeUndefined();
    });

    it('deve lançar AppError 400 quando tag_id não é enviado', async () => {
      await expect(musicasService.addTag(MOCK_MUSICAS_BASE[0].id, undefined)).rejects.toMatchObject({
        statusCode: 400,
        message: 'ID da tag é obrigatório',
      });
    });

    it('deve lançar AppError 404 quando música não existe', async () => {
      await expect(musicasService.addTag(NON_EXISTENT_ID, MOCK_TAGS[0].id)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Música não encontrada',
      });
    });

    it('deve lançar AppError 404 quando tag não existe', async () => {
      await expect(musicasService.addTag(MOCK_MUSICAS_BASE[0].id, NON_EXISTENT_ID)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Tag não encontrada',
      });
    });

    it('deve lançar AppError 409 quando tag duplicada', async () => {
      const existing = MOCK_MUSICAS_TAGS[0];
      await expect(musicasService.addTag(existing.musica_id, existing.tag_id)).rejects.toMatchObject({
        statusCode: 409,
        message: 'Registro duplicado',
      });
    });
  });

  // ─── removeTag ──────────────────────────────────────────
  describe('removeTag', () => {
    it('deve remover tag vinculada', async () => {
      const existing = MOCK_MUSICAS_TAGS[0];
      await expect(musicasService.removeTag(existing.musica_id, existing.tag_id)).resolves.toBeUndefined();
    });

    it('deve lançar AppError 404 quando registro não existe', async () => {
      await expect(musicasService.removeTag(MOCK_MUSICAS_BASE[0].id, NON_EXISTENT_ID)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Registro não encontrado',
      });
    });
  });

  // ─── listFuncoes ────────────────────────────────────────
  describe('listFuncoes', () => {
    it('deve retornar funções da música', async () => {
      const result = await musicasService.listFuncoes(MOCK_MUSICAS_BASE[0].id);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('nome');
    });
  });

  // ─── addFuncao ──────────────────────────────────────────
  describe('addFuncao', () => {
    it('deve vincular função à música', async () => {
      await expect(musicasService.addFuncao(MOCK_MUSICAS_BASE[0].id, MOCK_FUNCOES[2].id)).resolves.toBeUndefined();
    });

    it('deve lançar AppError 400 quando funcao_id não é enviado', async () => {
      await expect(musicasService.addFuncao(MOCK_MUSICAS_BASE[0].id, undefined)).rejects.toMatchObject({
        statusCode: 400,
        message: 'ID da função é obrigatório',
      });
    });

    it('deve lançar AppError 404 quando música não existe', async () => {
      await expect(musicasService.addFuncao(NON_EXISTENT_ID, MOCK_FUNCOES[0].id)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Música não encontrada',
      });
    });

    it('deve lançar AppError 404 quando função não existe', async () => {
      await expect(musicasService.addFuncao(MOCK_MUSICAS_BASE[0].id, NON_EXISTENT_ID)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Função não encontrada',
      });
    });

    it('deve lançar AppError 409 quando função duplicada', async () => {
      const existing = MOCK_MUSICAS_FUNCOES[0];
      await expect(musicasService.addFuncao(existing.musica_id, existing.funcao_id)).rejects.toMatchObject({
        statusCode: 409,
        message: 'Registro duplicado',
      });
    });
  });

  // ─── removeFuncao ───────────────────────────────────────
  describe('removeFuncao', () => {
    it('deve remover função vinculada', async () => {
      const existing = MOCK_MUSICAS_FUNCOES[0];
      await expect(musicasService.removeFuncao(existing.musica_id, existing.funcao_id)).resolves.toBeUndefined();
    });

    it('deve lançar AppError 404 quando registro não existe', async () => {
      await expect(musicasService.removeFuncao(MOCK_MUSICAS_BASE[0].id, NON_EXISTENT_ID)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Registro não encontrado',
      });
    });
  });
});
