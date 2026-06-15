import { describe, it, expect, beforeEach, vi } from 'vitest';
import { createFakeEventosRepository } from '../fakes/fake-eventos.repository.js';
import {
  MOCK_EVENTOS,
  MOCK_TIPOS_EVENTOS,
  MOCK_MUSICAS_BASE,
  MOCK_INTEGRANTES,
  MOCK_INTEGRANTES_FUNCOES,
  MOCK_EVENTOS_MUSICAS,
  MOCK_EVENTOS_INTEGRANTES,
  MOCK_ARTISTAS_MUSICAS,
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

    /** Garante que a versão escolhida é achatada para `{ id, artista_nome, link_versao }` quando o FK está populado. */
    it('deve achatar versao_selecionada quando fk_artistas_musicas está populado', async () => {
      const result = await eventosService.getById(MOCK_EVENTOS[0].id);
      const musicaComVersao = result.musicas.find(m => m.id === 'ggg00001-0000-0000-0000-000000000001');
      expect(musicaComVersao).toBeDefined();
      expect(musicaComVersao!.versao_selecionada).toEqual({
        id: 'jjj00002-0000-0000-0000-000000000001',
        artista_nome: 'Aline Barros',
        link_versao: 'https://exemplo.com/rendido-aline',
        cifraclub_url: 'https://www.cifraclub.com.br/aline-barros/rendido-estou/',
      });
    });

    /** Quando o FK é nulo, versao_selecionada deve vir como null mesmo se houver versoes_disponiveis. */
    it('deve retornar versao_selecionada nula quando fk_artistas_musicas é null', async () => {
      const result = await eventosService.getById(MOCK_EVENTOS[0].id);
      const musicaSemEscolha = result.musicas.find(m => m.id === 'ggg00001-0000-0000-0000-000000000002');
      expect(musicaSemEscolha).toBeDefined();
      expect(musicaSemEscolha!.versao_selecionada).toBeNull();
    });

    /** versoes_disponiveis deve listar todas as versões cadastradas para a música, projetando id+artista+link. */
    it('deve listar todas as versoes_disponiveis projetadas a partir de Artistas_Musicas', async () => {
      const result = await eventosService.getById(MOCK_EVENTOS[0].id);
      const musicaComVersao = result.musicas.find(m => m.id === 'ggg00001-0000-0000-0000-000000000001');
      expect(musicaComVersao!.versoes_disponiveis).toHaveLength(2);
      expect(musicaComVersao!.versoes_disponiveis).toEqual(
        expect.arrayContaining([
          expect.objectContaining({ artista_nome: 'Aline Barros', link_versao: 'https://exemplo.com/rendido-aline' }),
          expect.objectContaining({ artista_nome: 'Fernandinho', link_versao: 'https://exemplo.com/rendido-fernandinho' }),
        ])
      );
    });

    /** Música sem nenhuma versão cadastrada deve produzir versoes_disponiveis = []. */
    it('deve retornar versoes_disponiveis vazio quando a música não tem Artistas_Musicas', async () => {
      const result = await eventosService.getById(MOCK_EVENTOS[2].id);
      const musicaSemVersoes = result.musicas.find(m => m.id === 'ggg00001-0000-0000-0000-000000000099');
      expect(musicaSemVersoes).toBeDefined();
      expect(musicaSemVersoes!.versoes_disponiveis).toEqual([]);
      expect(musicaSemVersoes!.versao_selecionada).toBeNull();
    });

    /** Versão genérica (artista_id null) deve aparecer com artista_nome = null. */
    it('deve achatar artista_nome como null para versão genérica (artista_id null)', async () => {
      const result = await eventosService.getById(MOCK_EVENTOS[2].id);
      const musicaGenerica = result.musicas.find(m => m.id === 'ggg00001-0000-0000-0000-000000000003');
      expect(musicaGenerica).toBeDefined();
      expect(musicaGenerica!.versao_selecionada).toEqual({
        id: 'jjj00002-0000-0000-0000-000000000004',
        artista_nome: null,
        link_versao: null,
        cifraclub_url: null,
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
      }, 'tenant-fake-id');
      expect(result).toHaveProperty('id');
      expect(result).toHaveProperty('data');
      expect(result).toHaveProperty('descricao', 'Novo evento de teste');
      expect(result).toHaveProperty('tipoEvento');
    });

    it('deve lançar AppError 400 quando data não é enviada', async () => {
      await expect(eventosService.create({
        fk_tipo_evento: MOCK_TIPOS_EVENTOS[0].id,
        descricao: 'Teste',
      }, 'tenant-fake-id')).rejects.toMatchObject({
        statusCode: 400,
        message: 'Data do evento é obrigatória',
      });
    });

    it('deve lançar AppError 400 quando fk_tipo_evento não é enviado', async () => {
      await expect(eventosService.create({
        data: '2026-05-01T10:00:00Z',
        descricao: 'Teste',
      }, 'tenant-fake-id')).rejects.toMatchObject({
        statusCode: 400,
        message: 'Tipo de evento é obrigatório',
      });
    });

    /** Verifica que descrição é opcional e assume valor vazio como padrão. */
    it('deve criar evento sem descricao (campo opcional)', async () => {
      const resultado = await eventosService.create({
        data: '2026-05-01T10:00:00Z',
        fk_tipo_evento: MOCK_TIPOS_EVENTOS[0].id,
      }, 'tenant-fake-id');

      expect(resultado).toHaveProperty('id');
      expect(resultado.descricao).toBe('');
    });

    it('deve lançar AppError 400 quando data é inválida', async () => {
      await expect(eventosService.create({
        data: 'not-a-date',
        fk_tipo_evento: MOCK_TIPOS_EVENTOS[0].id,
        descricao: 'Teste',
      }, 'tenant-fake-id')).rejects.toMatchObject({
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

  // ─── getCifraclubPlaylist ───────────────────────────────
  describe('getCifraclubPlaylist', () => {
    /** Deve montar a playlist com stats coerentes (total = com_link + sem_link). */
    it('deve montar a playlist com stats coerentes', async () => {
      const result = await eventosService.getCifraclubPlaylist(MOCK_EVENTOS[0].id);
      expect(result).toHaveProperty('evento');
      expect(result).toHaveProperty('playlist');
      expect(result).toHaveProperty('stats');
      expect(result.stats.total).toBe(result.playlist.length);
      expect(result.stats.com_link + result.stats.sem_link).toBe(result.stats.total);
      expect(typeof result.evento.data).toBe('string');
    });

    /** Deve enriquecer com cifraclub_url a música cuja versão selecionada possui link. */
    it('inclui cifraclub_url nas músicas com versão com link', async () => {
      const result = await eventosService.getCifraclubPlaylist(MOCK_EVENTOS[0].id);
      const comLink = result.playlist.filter(p => p.cifraclub_url !== null);
      expect(comLink.length).toBe(result.stats.com_link);
      expect(comLink.length).toBeGreaterThan(0);
      expect(comLink[0].cifraclub_url).toContain('cifraclub.com.br');
    });

    it('deve lançar AppError 400 quando id não é enviado', async () => {
      await expect(eventosService.getCifraclubPlaylist('')).rejects.toMatchObject({
        statusCode: 400,
        message: 'ID de evento não enviado',
      });
    });

    it('deve lançar AppError 404 quando evento não existe', async () => {
      await expect(eventosService.getCifraclubPlaylist(NON_EXISTENT_ID)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Evento não encontrado',
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
    /** Deve vincular música ao evento com ordem automática (próxima posição). */
    it('deve vincular música ao evento com ordem automática', async () => {
      const eventoId = MOCK_EVENTOS[0].id;
      await eventosService.addMusica(eventoId, MOCK_MUSICAS_BASE[2].id, 'tenant-fake-id');
      const musicas = await eventosService.listMusicas(eventoId);
      const added = musicas.find(m => m.id === MOCK_MUSICAS_BASE[2].id);
      expect(added).toBeDefined();
    });

    /** Deve vincular música ao evento e retornar MusicaEvento formatada. */
    it('deve vincular música ao evento e retornar MusicaEvento', async () => {
      const result = await eventosService.addMusica(MOCK_EVENTOS[1].id, MOCK_MUSICAS_BASE[0].id, 'tenant-fake-id');
      expect(result).toHaveProperty('id', MOCK_MUSICAS_BASE[0].id);
      expect(result).toHaveProperty('nome');
      expect(result).toHaveProperty('versao_selecionada');
      expect(result).toHaveProperty('versoes_disponiveis');
    });

    it('deve lançar AppError 400 quando musicas_id não é enviado', async () => {
      await expect(eventosService.addMusica(MOCK_EVENTOS[0].id, undefined, 'tenant-fake-id')).rejects.toMatchObject({
        statusCode: 400,
        message: 'ID da música é obrigatório',
      });
    });

    it('deve lançar AppError 404 quando evento não existe', async () => {
      await expect(eventosService.addMusica(NON_EXISTENT_ID, MOCK_MUSICAS_BASE[0].id, 'tenant-fake-id')).rejects.toMatchObject({
        statusCode: 404,
        message: 'Evento não encontrado',
      });
    });

    it('deve lançar AppError 404 quando música não existe', async () => {
      await expect(eventosService.addMusica(MOCK_EVENTOS[0].id, NON_EXISTENT_ID, 'tenant-fake-id')).rejects.toMatchObject({
        statusCode: 404,
        message: 'Música não encontrada',
      });
    });

    it('deve lançar AppError 409 quando registro duplicado', async () => {
      const existing = MOCK_EVENTOS_MUSICAS[0];
      await expect(eventosService.addMusica(existing.evento_id, existing.musicas_id, 'tenant-fake-id')).rejects.toMatchObject({
        statusCode: 409,
        message: 'Registro duplicado',
      });
    });

    /** Deve persistir artistas_musicas_id válido na criação e retornar versao_selecionada preenchida. */
    it('deve persistir artistas_musicas_id válido ao adicionar música', async () => {
      const eventoId = MOCK_EVENTOS[1].id;
      const musicaId = MOCK_MUSICAS_BASE[0].id;
      const versaoId = MOCK_ARTISTAS_MUSICAS[0].id;

      const result = await eventosService.addMusica(eventoId, musicaId, 'tenant-fake-id', versaoId);
      expect(result.versao_selecionada).toEqual({
        id: versaoId,
        artista_nome: 'Aline Barros',
        link_versao: 'https://exemplo.com/rendido-aline',
        cifraclub_url: 'https://www.cifraclub.com.br/aline-barros/rendido-estou/',
      });
    });

    /** Quando artistas_musicas_id não é informado, versao_selecionada deve ser null (regressão). */
    it('deve manter versao_selecionada null quando artistas_musicas_id não é informado', async () => {
      const eventoId = MOCK_EVENTOS[1].id;
      const musicaId = MOCK_MUSICAS_BASE[0].id;

      const result = await eventosService.addMusica(eventoId, musicaId, 'tenant-fake-id');
      expect(result.versao_selecionada).toBeNull();
    });

    /** Deve rejeitar artistas_musicas_id que pertence a outra música com AppError 400. */
    it('deve rejeitar artistas_musicas_id que pertence a outra música', async () => {
      const eventoId = MOCK_EVENTOS[1].id;
      const musicaId = MOCK_MUSICAS_BASE[1].id;
      const versaoDeOutraMusica = MOCK_ARTISTAS_MUSICAS[0].id;

      await expect(
        eventosService.addMusica(eventoId, musicaId, 'tenant-fake-id', versaoDeOutraMusica)
      ).rejects.toMatchObject({
        statusCode: 400,
        message: 'A versão informada não pertence a esta música',
      });
    });

    /** Deve traduzir P2002 (unique constraint) em AppError 409 para corridas de duplicação concorrente. */
    it('deve traduzir erro Prisma P2002 para AppError 409 "Registro duplicado"', async () => {
      const eventoId = MOCK_EVENTOS[1].id;
      const musicaId = MOCK_MUSICAS_BASE[0].id;
      const p2002Error = Object.assign(new Error('Unique constraint failed'), {
        code: 'P2002',
        meta: { target: ['tenant_id', 'evento_id', 'musicas_id'] },
      });
      vi.spyOn(fakeRepo, 'createMusica').mockRejectedValueOnce(p2002Error);

      await expect(
        eventosService.addMusica(eventoId, musicaId, 'tenant-fake-id')
      ).rejects.toMatchObject({
        statusCode: 409,
        message: 'Registro duplicado',
      });
    });

    /** Deve traduzir P2003 em fk_artistas_musicas para AppError 404 "Versão não encontrada". */
    it('deve traduzir erro Prisma P2003 em fk_artistas_musicas para AppError 404 "Versão não encontrada"', async () => {
      const eventoId = MOCK_EVENTOS[1].id;
      const musicaId = MOCK_MUSICAS_BASE[0].id;
      const p2003Error = Object.assign(new Error('Foreign key constraint failed'), {
        code: 'P2003',
        meta: { field_name: 'fk_artistas_musicas' },
      });
      vi.spyOn(fakeRepo, 'createMusica').mockRejectedValueOnce(p2003Error);

      await expect(
        eventosService.addMusica(eventoId, musicaId, 'tenant-fake-id', 'versao-fake')
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Versão não encontrada',
      });
    });

    /** Deve traduzir P2003 em evento_id para AppError 404 "Evento não encontrado". */
    it('deve traduzir erro Prisma P2003 em evento_id para AppError 404 "Evento não encontrado"', async () => {
      const eventoId = MOCK_EVENTOS[1].id;
      const musicaId = MOCK_MUSICAS_BASE[0].id;
      const p2003Error = Object.assign(new Error('Foreign key constraint failed'), {
        code: 'P2003',
        meta: { field_name: 'evento_id' },
      });
      vi.spyOn(fakeRepo, 'createMusica').mockRejectedValueOnce(p2003Error);

      await expect(
        eventosService.addMusica(eventoId, musicaId, 'tenant-fake-id')
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Evento não encontrado',
      });
    });

    /** Deve traduzir P2003 em musicas_id para AppError 404 "Música não encontrada". */
    it('deve traduzir erro Prisma P2003 em musicas_id para AppError 404 "Música não encontrada"', async () => {
      const eventoId = MOCK_EVENTOS[1].id;
      const musicaId = MOCK_MUSICAS_BASE[0].id;
      const p2003Error = Object.assign(new Error('Foreign key constraint failed'), {
        code: 'P2003',
        meta: { field_name: 'musicas_id' },
      });
      vi.spyOn(fakeRepo, 'createMusica').mockRejectedValueOnce(p2003Error);

      await expect(
        eventosService.addMusica(eventoId, musicaId, 'tenant-fake-id')
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Música não encontrada',
      });
    });

    /**
     * Cobre a guard contra race condition: se o registro recém-criado some entre
     * `createMusica` e `findEventoMusicaDetail`, o serviço lança AppError 500
     * em vez de quebrar com `detail!`.
     */
    it('deve lançar AppError 500 quando findEventoMusicaDetail retorna null após createMusica', async () => {
      const eventoId = MOCK_EVENTOS[1].id;
      const musicaId = MOCK_MUSICAS_BASE[0].id;
      vi.spyOn(fakeRepo, 'findEventoMusicaDetail').mockResolvedValueOnce(null);

      await expect(
        eventosService.addMusica(eventoId, musicaId, 'tenant-fake-id')
      ).rejects.toMatchObject({
        statusCode: 500,
        message: 'Falha ao recuperar música criada',
      });
    });
  });

  // ─── setMusicaVersao ────────────────────────────────────
  describe('setMusicaVersao', () => {
    /** Deve atualizar a versão selecionada e retornar MusicaEvento formatada. */
    it('deve definir versão e retornar MusicaEvento com versao_selecionada preenchida', async () => {
      const eventoId = MOCK_EVENTOS[0].id;
      const musicaId = MOCK_MUSICAS_BASE[1].id;
      const versaoId = MOCK_ARTISTAS_MUSICAS[2].id;

      const result = await eventosService.setMusicaVersao(eventoId, musicaId, versaoId);
      expect(result.id).toBe(musicaId);
      expect(result.versao_selecionada).toEqual({
        id: versaoId,
        artista_nome: 'Gabriela Rocha',
        link_versao: null,
        cifraclub_url: null,
      });
    });

    /** Deve aceitar artistas_musicas_id null e limpar a versão selecionada. */
    it('deve aceitar null e limpar versao_selecionada', async () => {
      const eventoId = MOCK_EVENTOS[0].id;
      const musicaId = MOCK_MUSICAS_BASE[0].id;

      const result = await eventosService.setMusicaVersao(eventoId, musicaId, null);
      expect(result.id).toBe(musicaId);
      expect(result.versao_selecionada).toBeNull();
    });

    /** Deve lançar AppError 404 quando o evento não existe no tenant ativo. */
    it('deve lançar AppError 404 quando evento não existe', async () => {
      await expect(
        eventosService.setMusicaVersao(NON_EXISTENT_ID, MOCK_MUSICAS_BASE[0].id, null)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Evento não encontrado',
      });
    });

    /** Deve lançar AppError 404 quando o vínculo evento-música não existe. */
    it('deve lançar AppError 404 quando eventos_musicas não existe para o par', async () => {
      const eventoId = MOCK_EVENTOS[0].id;
      await expect(
        eventosService.setMusicaVersao(eventoId, NON_EXISTENT_ID, null)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Música não encontrada no evento',
      });
    });

    /** Deve lançar AppError 400 quando a versão pertence a outra música. */
    it('deve lançar AppError 400 quando versão pertence a outra música', async () => {
      const eventoId = MOCK_EVENTOS[0].id;
      const musicaId = MOCK_MUSICAS_BASE[1].id;
      const versaoDeOutraMusica = MOCK_ARTISTAS_MUSICAS[0].id;

      await expect(
        eventosService.setMusicaVersao(eventoId, musicaId, versaoDeOutraMusica)
      ).rejects.toMatchObject({
        statusCode: 400,
        message: 'A versão informada não pertence a esta música',
      });
    });

    /** Deve lançar AppError 404 quando a versão não existe (convenção REST: missing resource = 404). */
    it('deve lançar AppError 404 quando versão não existe no tenant ativo', async () => {
      const eventoId = MOCK_EVENTOS[0].id;
      const musicaId = MOCK_MUSICAS_BASE[0].id;

      await expect(
        eventosService.setMusicaVersao(eventoId, musicaId, NON_EXISTENT_ID)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Versão não encontrada',
      });
    });

    /** Verifica que o service retorna MusicaEvento formatada corretamente. */
    it('deve retornar MusicaEvento formatada com versão selecionada', async () => {
      const eventoId = MOCK_EVENTOS[0].id;
      const musicaId = MOCK_MUSICAS_BASE[0].id;
      const versaoId = MOCK_ARTISTAS_MUSICAS[1].id;

      const musica = await eventosService.setMusicaVersao(eventoId, musicaId, versaoId);

      expect(musica).toEqual(expect.objectContaining({
        id: musicaId,
        nome: expect.any(String),
        tonalidade: expect.any(Object),
        ordem: expect.any(Number),
        versao_selecionada: {
          id: versaoId,
          artista_nome: 'Fernandinho',
          link_versao: 'https://exemplo.com/rendido-fernandinho',
          cifraclub_url: null,
        },
        versoes_disponiveis: expect.any(Array),
      }));
    });

    /**
     * Cobre a guard contra race condition em `setMusicaVersao`: se o vínculo
     * evento-música some entre `setMusicaVersaoAtomic` e `findEventoMusicaDetail`,
     * o serviço lança AppError 500 em vez de quebrar com `detail!`.
     */
    it('deve lançar AppError 500 quando findEventoMusicaDetail retorna null após setMusicaVersaoAtomic', async () => {
      const eventoId = MOCK_EVENTOS[0].id;
      const musicaId = MOCK_MUSICAS_BASE[0].id;
      vi.spyOn(fakeRepo, 'findEventoMusicaDetail').mockResolvedValueOnce(null);

      await expect(
        eventosService.setMusicaVersao(eventoId, musicaId, null)
      ).rejects.toMatchObject({
        statusCode: 500,
        message: 'Falha ao recuperar música atualizada',
      });
    });

  });

  // ─── removeMusica ───────────────────────────────────────
  describe('removeMusica', () => {
    /** Deve remover música vinculada e recalcular ordem das restantes. */
    it('deve remover música vinculada', async () => {
      const existing = MOCK_EVENTOS_MUSICAS[0];
      await expect(eventosService.removeMusica(existing.evento_id, existing.musicas_id)).resolves.toBeUndefined();
    });

    /** Deve recalcular a ordem das músicas restantes para sequência contínua (1..N) após remoção. */
    it('deve recalcular ordem das restantes após remoção', async () => {
      const eventoId = MOCK_EVENTOS[0].id;
      const musicas = await eventosService.listMusicas(eventoId);
      expect(musicas.length).toBeGreaterThan(0);
      musicas.forEach((m, idx) => {
        expect(m.ordem).toBe(idx + 1);
      });
    });

    it('deve lançar AppError 404 quando registro não existe', async () => {
      await expect(eventosService.removeMusica(MOCK_EVENTOS[0].id, NON_EXISTENT_ID)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Registro não encontrado',
      });
    });
  });

  // ─── reorderMusicas ────────────────────────────────────
  describe('reorderMusicas', () => {
    /** Deve reordenar músicas do evento com IDs na nova ordem. */
    it('deve reordenar músicas de um evento existente', async () => {
      const eventoId = MOCK_EVENTOS[0].id;
      const musicaIds = MOCK_EVENTOS_MUSICAS
        .filter(em => em.evento_id === eventoId)
        .map(em => em.musicas_id)
        .reverse();

      await expect(eventosService.reorderMusicas(eventoId, musicaIds)).resolves.toBeUndefined();
    });

    /** Deve lançar AppError 404 quando evento não existe. */
    it('deve lançar AppError 404 quando evento não existe', async () => {
      await expect(eventosService.reorderMusicas(NON_EXISTENT_ID, ['any-id'])).rejects.toMatchObject({
        statusCode: 404,
        message: 'Evento não encontrado',
      });
    });

    /** Deve lançar AppError 400 quando IDs não correspondem às músicas do evento. */
    it('deve lançar AppError 400 quando IDs não correspondem às músicas do evento', async () => {
      const eventoId = MOCK_EVENTOS[0].id;
      await expect(eventosService.reorderMusicas(eventoId, [NON_EXISTENT_ID])).rejects.toMatchObject({
        statusCode: 400,
        message: 'A lista de músicas não corresponde às músicas do evento',
      });
    });

    /** Deve lançar AppError 400 quando lista de IDs tem tamanho diferente das músicas do evento. */
    it('deve lançar AppError 400 quando lista tem tamanho diferente', async () => {
      const eventoId = MOCK_EVENTOS[0].id;
      const musicaIds = MOCK_EVENTOS_MUSICAS
        .filter(em => em.evento_id === eventoId)
        .map(em => em.musicas_id);

      await expect(eventosService.reorderMusicas(eventoId, [...musicaIds, 'extra-id'])).rejects.toMatchObject({
        statusCode: 400,
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
    /** Deve vincular integrante ao evento usando todas as funções globais quando funcao_ids não é fornecido. */
    it('deve vincular integrante ao evento com todas as funções quando funcao_ids não fornecido', async () => {
      await expect(
        eventosService.addIntegrante(MOCK_EVENTOS[0].id, MOCK_INTEGRANTES[2].id, undefined, 'tenant-fake-id')
      ).resolves.toBeUndefined();
    });

    /** Deve vincular integrante ao evento com funcao_ids específicas. */
    it('deve vincular integrante ao evento com funcao_ids específicas', async () => {
      const funcaoId = MOCK_INTEGRANTES_FUNCOES
        .filter(iif => iif.fk_user_id === MOCK_INTEGRANTES[0].id)
        .map(iif => iif.funcao_id);
      await expect(
        eventosService.addIntegrante(MOCK_EVENTOS[2].id, MOCK_INTEGRANTES[0].id, [funcaoId[0]], 'tenant-fake-id')
      ).resolves.toBeUndefined();

      const integrantes = await eventosService.listIntegrantes(MOCK_EVENTOS[2].id);
      const added = integrantes.find(i => i.id === MOCK_INTEGRANTES[0].id);
      expect(added).toBeDefined();
      expect(added!.funcoes).toHaveLength(1);
      expect(added!.funcoes[0].id).toBe(funcaoId[0]);
    });

    /** Deve lançar AppError 400 quando funcao_ids contém ID que não pertence ao integrante. */
    it('deve lançar AppError 400 quando funcao_ids contém ID inválido', async () => {
      await expect(
        eventosService.addIntegrante(MOCK_EVENTOS[2].id, MOCK_INTEGRANTES[0].id, [NON_EXISTENT_ID], 'tenant-fake-id')
      ).rejects.toMatchObject({
        statusCode: 400,
        message: 'Função inválida: não pertence ao integrante',
      });
    });

    it('deve lançar AppError 400 quando fk_integrante_id não é enviado', async () => {
      await expect(eventosService.addIntegrante(MOCK_EVENTOS[0].id, undefined, undefined, 'tenant-fake-id')).rejects.toMatchObject({
        statusCode: 400,
        message: 'ID do integrante é obrigatório',
      });
    });

    it('deve lançar AppError 404 quando evento não existe', async () => {
      await expect(eventosService.addIntegrante(NON_EXISTENT_ID, MOCK_INTEGRANTES[0].id, undefined, 'tenant-fake-id')).rejects.toMatchObject({
        statusCode: 404,
        message: 'Evento não encontrado',
      });
    });

    it('deve lançar AppError 404 quando integrante não existe', async () => {
      await expect(eventosService.addIntegrante(MOCK_EVENTOS[0].id, NON_EXISTENT_ID, undefined, 'tenant-fake-id')).rejects.toMatchObject({
        statusCode: 404,
        message: 'Integrante não encontrado',
      });
    });

    it('deve lançar AppError 409 quando registro duplicado', async () => {
      const existing = MOCK_EVENTOS_INTEGRANTES[0];
      await expect(eventosService.addIntegrante(existing.evento_id, existing.fk_user_id, undefined, 'tenant-fake-id')).rejects.toMatchObject({
        statusCode: 409,
        message: 'Registro duplicado',
      });
    });
  });

  // ─── removeIntegrante ───────────────────────────────────
  describe('removeIntegrante', () => {
    it('deve remover integrante vinculado', async () => {
      const existing = MOCK_EVENTOS_INTEGRANTES[0];
      await expect(eventosService.removeIntegrante(existing.evento_id, existing.fk_user_id)).resolves.toBeUndefined();
    });

    it('deve lançar AppError 404 quando registro não existe', async () => {
      await expect(eventosService.removeIntegrante(MOCK_EVENTOS[0].id, NON_EXISTENT_ID)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Registro não encontrado',
      });
    });
  });
});
