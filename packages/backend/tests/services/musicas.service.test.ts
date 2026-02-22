import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createFakeMusicasRepository } from '../fakes/fake-musicas.repository.js';
import {
  MOCK_MUSICAS_BASE,
  MOCK_TONALIDADES,
  MOCK_ARTISTAS,
  MOCK_ARTISTAS_MUSICAS,
  MOCK_MUSICAS_CATEGORIAS,
  MOCK_MUSICAS_FUNCOES,
  MOCK_CATEGORIAS,
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
      expect(musica).toHaveProperty('categorias');
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
      expect(result).toHaveProperty('categorias');
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

  // ─── createComplete ───────────────────────────────────────
  describe('createComplete', () => {
    it('deve criar música sem versão quando apenas nome é enviado', async () => {
      const result = await musicasService.createComplete({ nome: 'Música Simples' });
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('nome', 'Música Simples');
      expect(result).toHaveProperty('versoes');
      expect(result.versoes).toHaveLength(0);
    });

    it('deve criar música com tonalidade e versão completa', async () => {
      const result = await musicasService.createComplete({
        nome: 'Música Completa',
        fk_tonalidade: MOCK_TONALIDADES[0].id,
        artista_id: MOCK_ARTISTAS[0].id,
        bpm: 120,
        cifras: 'G D Em C',
        lyrics: 'Letra da música...',
        link_versao: 'https://exemplo.com/versao',
      });
      expect(result).toHaveProperty('id');
      expect(result.nome).toBe('Música Completa');
      expect(result.tonalidade).toMatchObject({ id: MOCK_TONALIDADES[0].id, tom: 'G' });
      expect(result.versoes).toHaveLength(1);
      expect(result.versoes[0].bpm).toBe(120);
      expect(result.versoes[0].artista).toMatchObject({ id: MOCK_ARTISTAS[0].id });
    });

    it('deve lançar AppError 400 quando nome não é enviado', async () => {
      await expect(musicasService.createComplete({})).rejects.toMatchObject({
        statusCode: 400,
        message: 'Nome da música é obrigatório',
      });
    });

    it('deve lançar AppError 404 quando tonalidade não existe', async () => {
      await expect(musicasService.createComplete({
        nome: 'Teste',
        fk_tonalidade: NON_EXISTENT_ID,
      })).rejects.toMatchObject({
        statusCode: 404,
        message: 'Tonalidade não encontrada',
      });
    });

    it('deve lançar AppError 400 quando campos de versão preenchidos sem artista', async () => {
      await expect(musicasService.createComplete({
        nome: 'Teste',
        bpm: 120,
      })).rejects.toMatchObject({
        statusCode: 400,
        message: 'Artista é obrigatório para criar uma versão',
      });
    });

    it('deve lançar AppError 404 quando artista não existe', async () => {
      await expect(musicasService.createComplete({
        nome: 'Teste',
        artista_id: NON_EXISTENT_ID,
      })).rejects.toMatchObject({
        statusCode: 404,
        message: 'Artista não encontrado',
      });
    });

    it('deve permitir artista sem campos de versão (cria versão vazia)', async () => {
      const result = await musicasService.createComplete({
        nome: 'Só Artista',
        artista_id: MOCK_ARTISTAS[0].id,
      });
      expect(result.versoes).toHaveLength(1);
      expect(result.versoes[0].bpm).toBeNull();
    });

    it('deve aceitar categoria_ids válidos', async () => {
      const result = await musicasService.createComplete({
        nome: 'Com Categorias',
        categoria_ids: [MOCK_CATEGORIAS[0].id, MOCK_CATEGORIAS[1].id],
      });
      expect(result).toHaveProperty('id');
      expect(result.nome).toBe('Com Categorias');
    });

    it('deve lançar AppError 404 quando categoria_ids contém ID inexistente', async () => {
      await expect(musicasService.createComplete({
        nome: 'Teste',
        categoria_ids: [MOCK_CATEGORIAS[0].id, NON_EXISTENT_ID],
      })).rejects.toMatchObject({
        statusCode: 404,
        message: 'Categoria não encontrada',
      });
    });

    it('deve aceitar funcao_ids válidos', async () => {
      const result = await musicasService.createComplete({
        nome: 'Com Funções',
        funcao_ids: [MOCK_FUNCOES[0].id],
      });
      expect(result).toHaveProperty('id');
      expect(result.nome).toBe('Com Funções');
    });

    it('deve lançar AppError 404 quando funcao_ids contém ID inexistente', async () => {
      await expect(musicasService.createComplete({
        nome: 'Teste',
        funcao_ids: [NON_EXISTENT_ID],
      })).rejects.toMatchObject({
        statusCode: 404,
        message: 'Função não encontrada',
      });
    });

    it('deve aceitar arrays vazios de categoria_ids e funcao_ids', async () => {
      const result = await musicasService.createComplete({
        nome: 'Sem Associações',
        categoria_ids: [],
        funcao_ids: [],
      });
      expect(result).toHaveProperty('id');
      expect(result.nome).toBe('Sem Associações');
    });
  });

  // ─── updateComplete ──────────────────────────────────────
  describe('updateComplete', () => {
    it('deve atualizar apenas nome da música', async () => {
      const result = await musicasService.updateComplete(MOCK_MUSICAS_BASE[0].id, {
        nome: 'Nome Atualizado Completo',
      });
      expect(result.nome).toBe('Nome Atualizado Completo');
      expect(result).toHaveProperty('versoes');
      expect(result).toHaveProperty('categorias');
    });

    it('deve atualizar música e versão existente', async () => {
      const result = await musicasService.updateComplete(MOCK_MUSICAS_BASE[0].id, {
        nome: 'Rendido Atualizado',
        fk_tonalidade: MOCK_TONALIDADES[1].id,
        versao_id: MOCK_ARTISTAS_MUSICAS[0].id,
        bpm: 85,
        cifras: 'Am F C G',
      });
      expect(result.nome).toBe('Rendido Atualizado');
      const versaoAtualizada = result.versoes.find(
        (v: { id: string }) => v.id === MOCK_ARTISTAS_MUSICAS[0].id,
      );
      expect(versaoAtualizada).toBeDefined();
      expect(versaoAtualizada.bpm).toBe(85);
      expect(versaoAtualizada.cifras).toBe('Am F C G');
    });

    it('deve lançar AppError 400 quando id não é enviado', async () => {
      await expect(musicasService.updateComplete('', { nome: 'X' })).rejects.toMatchObject({
        statusCode: 400,
        message: 'ID de música não enviado',
      });
    });

    it('deve lançar AppError 400 quando nome não é enviado', async () => {
      await expect(musicasService.updateComplete(MOCK_MUSICAS_BASE[0].id, {})).rejects.toMatchObject({
        statusCode: 400,
        message: 'Nome da música é obrigatório',
      });
    });

    it('deve lançar AppError 404 quando música não existe', async () => {
      await expect(musicasService.updateComplete(NON_EXISTENT_ID, { nome: 'X' })).rejects.toMatchObject({
        statusCode: 404,
        message: 'A música não foi encontrada ou não existe',
      });
    });

    it('deve lançar AppError 404 quando tonalidade não existe', async () => {
      await expect(musicasService.updateComplete(MOCK_MUSICAS_BASE[0].id, {
        nome: 'Teste',
        fk_tonalidade: NON_EXISTENT_ID,
      })).rejects.toMatchObject({
        statusCode: 404,
        message: 'Tonalidade não encontrada',
      });
    });

    it('deve lançar AppError 404 quando versão não existe', async () => {
      await expect(musicasService.updateComplete(MOCK_MUSICAS_BASE[0].id, {
        nome: 'Teste',
        versao_id: NON_EXISTENT_ID,
      })).rejects.toMatchObject({
        statusCode: 404,
        message: 'Versão não encontrada',
      });
    });

    it('deve aceitar categoria_ids válidos na atualização', async () => {
      const result = await musicasService.updateComplete(MOCK_MUSICAS_BASE[0].id, {
        nome: 'Atualizado com Categorias',
        categoria_ids: [MOCK_CATEGORIAS[0].id],
      });
      expect(result.nome).toBe('Atualizado com Categorias');
    });

    it('deve lançar AppError 404 quando categoria_ids contém ID inexistente na atualização', async () => {
      await expect(musicasService.updateComplete(MOCK_MUSICAS_BASE[0].id, {
        nome: 'Teste',
        categoria_ids: [NON_EXISTENT_ID],
      })).rejects.toMatchObject({
        statusCode: 404,
        message: 'Categoria não encontrada',
      });
    });

    it('deve aceitar funcao_ids válidos na atualização', async () => {
      const result = await musicasService.updateComplete(MOCK_MUSICAS_BASE[0].id, {
        nome: 'Atualizado com Funções',
        funcao_ids: [MOCK_FUNCOES[0].id, MOCK_FUNCOES[1].id],
      });
      expect(result.nome).toBe('Atualizado com Funções');
    });

    it('deve lançar AppError 404 quando funcao_ids contém ID inexistente na atualização', async () => {
      await expect(musicasService.updateComplete(MOCK_MUSICAS_BASE[0].id, {
        nome: 'Teste',
        funcao_ids: [MOCK_FUNCOES[0].id, NON_EXISTENT_ID],
      })).rejects.toMatchObject({
        statusCode: 404,
        message: 'Função não encontrada',
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

  // ─── listCategorias ────────────────────────────────────
  describe('listCategorias', () => {
    it('deve retornar categorias da música', async () => {
      const result = await musicasService.listCategorias(MOCK_MUSICAS_BASE[0].id);
      expect(result.length).toBeGreaterThan(0);
      expect(result[0]).toHaveProperty('id');
      expect(result[0]).toHaveProperty('nome');
    });
  });

  // ─── addCategoria ──────────────────────────────────────
  describe('addCategoria', () => {
    it('deve vincular categoria à música', async () => {
      await expect(musicasService.addCategoria(MOCK_MUSICAS_BASE[0].id, MOCK_CATEGORIAS[2].id)).resolves.toBeUndefined();
    });

    it('deve lançar AppError 400 quando categoria_id não é enviado', async () => {
      await expect(musicasService.addCategoria(MOCK_MUSICAS_BASE[0].id, undefined)).rejects.toMatchObject({
        statusCode: 400,
        message: 'ID da categoria é obrigatório',
      });
    });

    it('deve lançar AppError 404 quando música não existe', async () => {
      await expect(musicasService.addCategoria(NON_EXISTENT_ID, MOCK_CATEGORIAS[0].id)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Música não encontrada',
      });
    });

    it('deve lançar AppError 404 quando categoria não existe', async () => {
      await expect(musicasService.addCategoria(MOCK_MUSICAS_BASE[0].id, NON_EXISTENT_ID)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Categoria não encontrada',
      });
    });

    it('deve lançar AppError 409 quando categoria duplicada', async () => {
      const existing = MOCK_MUSICAS_CATEGORIAS[0];
      await expect(musicasService.addCategoria(existing.musica_id, existing.categoria_id)).rejects.toMatchObject({
        statusCode: 409,
        message: 'Registro duplicado',
      });
    });
  });

  // ─── removeCategoria ─────────────────────────────────
  describe('removeCategoria', () => {
    it('deve remover categoria vinculada', async () => {
      const existing = MOCK_MUSICAS_CATEGORIAS[0];
      await expect(musicasService.removeCategoria(existing.musica_id, existing.categoria_id)).resolves.toBeUndefined();
    });

    it('deve lançar AppError 404 quando registro não existe', async () => {
      await expect(musicasService.removeCategoria(MOCK_MUSICAS_BASE[0].id, NON_EXISTENT_ID)).rejects.toMatchObject({
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
