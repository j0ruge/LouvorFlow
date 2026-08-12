import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createFakeArtistasRepository } from '../fakes/fake-artistas.repository.js';
import { MOCK_ARTISTAS, NON_EXISTENT_ID } from '../fakes/mock-data.js';

const fakeRepo = createFakeArtistasRepository();

vi.mock('../../src/repositories/artistas.repository.js', () => ({
  default: fakeRepo,
}));

const { default: artistasService } = await import('../../src/services/artistas.service.js');

describe('ArtistasService', () => {
  beforeEach(() => {
    fakeRepo.reset();
  });

  // ─── listAll ─────────────────────────────────────────
  describe('listAll', () => {
    it('deve retornar todos os artistas', async () => {
      const result = await artistasService.listAll();
      expect(result).toHaveLength(MOCK_ARTISTAS.length);
      expect(result[0]).toHaveProperty('nome');
    });

    /** Deve ordenar por nome em pt-BR, com acentos junto da letra-base. */
    it('deve retornar artistas em ordem alfabética pt-BR', async () => {
      await artistasService.create('Ávine Vinny', 'tenant-fake-id');
      await artistasService.create('Davi Sacer', 'tenant-fake-id');

      const result = await artistasService.listAll();

      expect(result.map((a) => a.nome)).toEqual([
        'Aline Barros',
        'Ávine Vinny',
        'Davi Sacer',
        'Fernandinho',
        'Gabriela Rocha',
      ]);
    });
  });

  // ─── getById ─────────────────────────────────────────
  describe('getById', () => {
    it('deve retornar um artista com músicas pelo id', async () => {
      const result = await artistasService.getById(MOCK_ARTISTAS[0].id);
      expect(result).toHaveProperty('id', MOCK_ARTISTAS[0].id);
      expect(result).toHaveProperty('nome', MOCK_ARTISTAS[0].nome);
      expect(result).toHaveProperty('Artistas_Musicas');
    });

    it('deve lançar AppError 400 quando id não é enviado', async () => {
      await expect(artistasService.getById('')).rejects.toMatchObject({
        statusCode: 400,
        message: 'ID de artista não enviado',
      });
    });

    it('deve lançar AppError 404 quando artista não existe', async () => {
      await expect(artistasService.getById(NON_EXISTENT_ID)).rejects.toMatchObject({
        statusCode: 404,
        message: 'O artista não foi encontrado ou não existe',
      });
    });
  });

  // ─── create ──────────────────────────────────────────
  describe('create', () => {
    it('deve criar um artista com nome válido retornando {id, nome}', async () => {
      const result = await artistasService.create('Diante do Trono', 'tenant-fake-id');
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('nome', 'Diante do Trono');
      expect(Object.keys(result)).toEqual(['id', 'nome']);
    });

    it('deve lançar AppError 400 quando nome não é enviado', async () => {
      await expect(artistasService.create(undefined, 'tenant-fake-id')).rejects.toMatchObject({
        statusCode: 400,
        message: 'Nome do artista é obrigatório',
      });
    });

    /**
     * Documenta o limite conhecido de `mode: 'insensitive'`: ele normaliza
     * caixa, não diacríticos. "Ávine Vinny" e "Avine Vinny" diferem só no
     * acento e por isso NÃO colidem no backend — a barreira de acento é
     * client-side (fase F5, `normalizeForSearch`). Este não é um bug: é o
     * comportamento real e esperado do Postgres/Prisma documentado aqui.
     */
    it('documenta que nomes que diferem apenas por acento não colidem no backend', async () => {
      await artistasService.create('Ávine Vinny', 'tenant-fake-id');

      const semAcento = await artistasService.create('Avine Vinny', 'tenant-fake-id');

      expect(semAcento).toHaveProperty('id');
      expect(semAcento.nome).toBe('Avine Vinny');
    });

    it('deve lançar AppError 409 quando nome é duplicado', async () => {
      await expect(artistasService.create('Aline Barros', 'tenant-fake-id')).rejects.toMatchObject({
        statusCode: 409,
        message: 'Já existe um artista com esse nome',
      });
    });

    /** Decisão D7: duplicidade de nome ignora caixa (mode: 'insensitive' do Prisma). O índice único do banco é case-sensitive; a barreira é esta checagem no repositório. */
    it('deve lançar AppError 409 quando nome colide apenas na caixa', async () => {
      await expect(artistasService.create('ALINE BARROS', 'tenant-fake-id')).rejects.toMatchObject({
        statusCode: 409,
        message: 'Já existe um artista com esse nome',
      });
    });
  });

  // ─── update ──────────────────────────────────────────
  describe('update', () => {
    it('deve atualizar um artista com dados válidos retornando {id, nome}', async () => {
      const result = await artistasService.update(MOCK_ARTISTAS[0].id, 'Novo Nome');
      expect(result).toEqual({ id: MOCK_ARTISTAS[0].id, nome: 'Novo Nome' });
    });

    it('deve lançar AppError 400 quando id não é enviado', async () => {
      await expect(artistasService.update('', 'Nome')).rejects.toMatchObject({
        statusCode: 400,
        message: 'ID de artista não enviado',
      });
    });

    it('deve lançar AppError 404 quando artista não existe', async () => {
      await expect(artistasService.update(NON_EXISTENT_ID, 'Nome')).rejects.toMatchObject({
        statusCode: 404,
        message: 'Artista com esse ID não existe ou não foi encontrado',
      });
    });

    it('deve lançar AppError 400 quando nome não é enviado', async () => {
      await expect(artistasService.update(MOCK_ARTISTAS[0].id, undefined)).rejects.toMatchObject({
        statusCode: 400,
        message: 'Nome do artista é obrigatório',
      });
    });

    it('deve lançar AppError 409 quando nome pertence a outro artista', async () => {
      await expect(artistasService.update(MOCK_ARTISTAS[0].id, MOCK_ARTISTAS[1].nome)).rejects.toMatchObject({
        statusCode: 409,
        message: 'Nome do artista já existe',
      });
    });

    /** Decisão D7: a checagem de duplicidade no update também ignora caixa. */
    it('deve lançar AppError 409 quando nome pertence a outro artista ignorando caixa', async () => {
      await expect(
        artistasService.update(MOCK_ARTISTAS[0].id, MOCK_ARTISTAS[1].nome.toUpperCase())
      ).rejects.toMatchObject({
        statusCode: 409,
        message: 'Nome do artista já existe',
      });
    });

    it('deve permitir update com o próprio nome atual sem erro', async () => {
      const result = await artistasService.update(MOCK_ARTISTAS[0].id, MOCK_ARTISTAS[0].nome);
      expect(result.nome).toBe(MOCK_ARTISTAS[0].nome);
    });
  });

  // ─── delete ──────────────────────────────────────────
  describe('delete', () => {
    it('deve remover um artista existente', async () => {
      const result = await artistasService.delete(MOCK_ARTISTAS[0].id);
      expect(result).toHaveProperty('id', MOCK_ARTISTAS[0].id);
    });

    it('deve lançar AppError 400 quando id não é enviado', async () => {
      await expect(artistasService.delete('')).rejects.toMatchObject({
        statusCode: 400,
        message: 'ID de artista não enviado',
      });
    });

    it('deve lançar AppError 404 quando artista não existe', async () => {
      await expect(artistasService.delete(NON_EXISTENT_ID)).rejects.toMatchObject({
        statusCode: 404,
        message: 'O artista não foi encontrado ou não existe',
      });
    });
  });
});
