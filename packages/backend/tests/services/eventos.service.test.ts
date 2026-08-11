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
  MOCK_TONALIDADES,
  NON_EXISTENT_ID,
  TENANT_A_ID,
  TENANT_B_ID,
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

    /** Cada evento listado expõe o status de publicação da escala (decisão D5). */
    it('deve expor o campo status nos eventos listados', async () => {
      const result = await eventosService.listAll();
      expect(result[0].status).toBe('publicada');
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

    /** O detalhe do evento expõe o status de publicação da escala (decisão D5). */
    it('deve expor o campo status no detalhe do evento', async () => {
      const result = await eventosService.getById(MOCK_EVENTOS[0].id);
      expect(result.status).toBe('publicada');
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

    /** `tonalidade` deve carregar o tom efetivo (override da escala) e `tonalidade_musica` o tom global. */
    it('deve retornar tonalidade efetiva (override) e tonalidade_musica global quando a escala tem tom próprio', async () => {
      const result = await eventosService.getById(MOCK_EVENTOS[0].id);
      const comOverride = result.musicas.find(m => m.id === 'ggg00001-0000-0000-0000-000000000001');
      expect(comOverride!.tonalidade).toEqual({ id: 'bbb00001-0000-0000-0000-000000000004', tom: 'A' });
      expect(comOverride!.tonalidade_musica).toEqual({ id: 'bbb00001-0000-0000-0000-000000000001', tom: 'G' });
    });

    /** Sem override, `tonalidade` deve cair no tom global da música (efetivo = global). */
    it('deve retornar tonalidade igual ao tom global quando a escala não tem override', async () => {
      const result = await eventosService.getById(MOCK_EVENTOS[0].id);
      const semOverride = result.musicas.find(m => m.id === 'ggg00001-0000-0000-0000-000000000002');
      expect(semOverride!.tonalidade).toEqual({ id: 'bbb00001-0000-0000-0000-000000000002', tom: 'D' });
      expect(semOverride!.tonalidade_musica).toEqual({ id: 'bbb00001-0000-0000-0000-000000000002', tom: 'D' });
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

    /** D5: sem `status` no body, o evento nasce `publicada` (DEFAULT do banco, espelhado no fake). */
    it('deve criar evento com status publicada por padrão', async () => {
      const resultado = await eventosService.create({
        data: '2026-05-01T10:00:00Z',
        fk_tipo_evento: MOCK_TIPOS_EVENTOS[0].id,
      }, 'tenant-fake-id');
      expect(resultado.status).toBe('publicada');
    });

    /** F13 cria escalas em preparação: `status: 'rascunho'` opcional aceito no create. */
    it('deve criar evento com status rascunho quando enviado', async () => {
      const resultado = await eventosService.create({
        data: '2026-05-01T10:00:00Z',
        fk_tipo_evento: MOCK_TIPOS_EVENTOS[0].id,
        status: 'rascunho',
      }, 'tenant-fake-id');
      expect(resultado.status).toBe('rascunho');
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

    /** Publicar = PUT com `{ status: 'publicada' }` (D5) — transição rascunho → publicada sem endpoint dedicado. */
    it('deve transicionar status de rascunho para publicada via update', async () => {
      const rascunho = await eventosService.create({
        data: '2026-05-01T10:00:00Z',
        fk_tipo_evento: MOCK_TIPOS_EVENTOS[0].id,
        status: 'rascunho',
      }, 'tenant-fake-id');
      expect(rascunho.status).toBe('rascunho');

      const publicada = await eventosService.update(rascunho.id, { status: 'publicada' });
      expect(publicada.status).toBe('publicada');
    });
  });

  // ─── duplicar ───────────────────────────────────────────
  describe('duplicar', () => {
    /** Data da cópia usada em todos os cenários de duplicação. */
    const NOVA_DATA = '2026-06-07T10:00:00Z';

    /** Origem inexistente deve retornar 404 antes de qualquer escrita. */
    it('deve lançar AppError 404 quando o evento de origem não existe', async () => {
      await expect(
        eventosService.duplicar(NON_EXISTENT_ID, { data: NOVA_DATA }, TENANT_A_ID)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Evento não encontrado',
      });
    });

    /** Data ausente é rejeitada com 400 sem tocar o banco. */
    it('deve lançar AppError 400 quando data não é enviada', async () => {
      await expect(
        eventosService.duplicar(MOCK_EVENTOS[0].id, {}, TENANT_A_ID)
      ).rejects.toMatchObject({
        statusCode: 400,
        message: 'Data do evento é obrigatória',
      });
    });

    /** `parseDataEvento` compartilhado: ano fora de 1900–9999 é rejeitado também na duplicação. */
    it('deve lançar AppError 400 quando o ano da data está fora de 1900–9999', async () => {
      await expect(
        eventosService.duplicar(MOCK_EVENTOS[0].id, { data: '1899-12-31T00:00:00Z' }, TENANT_A_ID)
      ).rejects.toMatchObject({
        statusCode: 400,
        message: 'Ano da data do evento deve estar entre 1900 e 9999',
      });
    });

    /** O repertório copiado preserva ordem, tom próprio da escala (override) e versão selecionada. */
    it('deve copiar o repertório preservando ordem, tom próprio e versão selecionada', async () => {
      const copia = await eventosService.duplicar(MOCK_EVENTOS[0].id, { data: NOVA_DATA }, TENANT_A_ID);
      const detalhe = await eventosService.getById(copia!.id);

      expect(detalhe.musicas).toHaveLength(2);

      const primeira = detalhe.musicas.find(m => m.id === 'ggg00001-0000-0000-0000-000000000001')!;
      expect(primeira.ordem).toBe(1);
      expect(primeira.tonalidade).toEqual({ id: 'bbb00001-0000-0000-0000-000000000004', tom: 'A' });
      expect(primeira.versao_selecionada).toMatchObject({ id: 'jjj00002-0000-0000-0000-000000000001' });

      const segunda = detalhe.musicas.find(m => m.id === 'ggg00001-0000-0000-0000-000000000002')!;
      expect(segunda.ordem).toBe(2);
      expect(segunda.versao_selecionada).toBeNull();
      expect(segunda.tonalidade).toEqual({ id: 'bbb00001-0000-0000-0000-000000000002', tom: 'D' });
    });

    /** As funções copiadas são as escolhidas para o evento de origem, não as funções globais atuais do integrante. */
    it('deve copiar integrantes com as funções do evento, não as funções globais', async () => {
      /** Vincula o user 1 (duas funções globais) ao evento 3 com apenas UMA função selecionada. */
      const funcaoEscolhida = MOCK_INTEGRANTES_FUNCOES[0].funcao_id;
      await eventosService.addIntegrante(MOCK_EVENTOS[2].id, MOCK_INTEGRANTES[0].id, [funcaoEscolhida], TENANT_A_ID);

      const copia = await eventosService.duplicar(MOCK_EVENTOS[2].id, { data: NOVA_DATA }, TENANT_A_ID);
      const integrantes = await eventosService.listIntegrantes(copia!.id);

      const copiado = integrantes.find(i => i.id === MOCK_INTEGRANTES[0].id);
      expect(copiado).toBeDefined();
      expect(copiado!.funcoes).toHaveLength(1);
      expect(copiado!.funcoes[0].id).toBe(funcaoEscolhida);
    });

    /** `fk_tipo_evento` e `descricao` omitidos herdam os valores da origem; o status da cópia nasce `publicada`. */
    it('deve herdar fk_tipo_evento e descricao da origem quando omitidos', async () => {
      const copia = await eventosService.duplicar(MOCK_EVENTOS[0].id, { data: NOVA_DATA }, TENANT_A_ID);

      expect(copia!.tipoEvento).toEqual({ id: MOCK_EVENTOS[0].fk_tipo_evento, nome: MOCK_TIPOS_EVENTOS[0].nome });
      expect(copia!.descricao).toBe(MOCK_EVENTOS[0].descricao);
      expect(copia!.status).toBe('publicada');
      expect(new Date(copia!.data).toISOString()).toBe(new Date(NOVA_DATA).toISOString());
    });

    /** `fk_tipo_evento` e `descricao` enviados sobrescrevem os herdados da origem. */
    it('deve sobrescrever fk_tipo_evento e descricao quando enviados', async () => {
      const copia = await eventosService.duplicar(MOCK_EVENTOS[0].id, {
        data: NOVA_DATA,
        fk_tipo_evento: MOCK_TIPOS_EVENTOS[1].id,
        descricao: 'Cópia ajustada',
      }, TENANT_A_ID);

      expect(copia!.tipoEvento).toEqual({ id: MOCK_TIPOS_EVENTOS[1].id, nome: MOCK_TIPOS_EVENTOS[1].nome });
      expect(copia!.descricao).toBe('Cópia ajustada');
    });

    /** Origem sem músicas nem integrantes: a duplicação cria apenas o evento. */
    it('deve criar apenas o evento quando a origem não tem músicas nem integrantes', async () => {
      const copia = await eventosService.duplicar(MOCK_EVENTOS[1].id, { data: NOVA_DATA }, TENANT_A_ID);
      const detalhe = await eventosService.getById(copia!.id);

      expect(detalhe.musicas).toEqual([]);
      expect(detalhe.integrantes).toEqual([]);
    });

    /** Deve traduzir P2002 (unique constraint) em AppError 409 para corridas de escrita concorrente. */
    it('deve traduzir erro Prisma P2002 para AppError 409 "Registro duplicado"', async () => {
      const p2002Error = Object.assign(new Error('Unique constraint failed'), {
        code: 'P2002',
        meta: { target: ['tenant_id', 'evento_id', 'musicas_id'] },
      });
      vi.spyOn(fakeRepo, 'duplicarEvento').mockRejectedValueOnce(p2002Error);

      await expect(
        eventosService.duplicar(MOCK_EVENTOS[0].id, { data: NOVA_DATA }, TENANT_A_ID)
      ).rejects.toMatchObject({
        statusCode: 409,
        message: 'Registro duplicado',
      });
    });

    /**
     * Deve traduzir P2003 na FK de tipo de evento (sobrescrita com UUID inexistente)
     * para AppError 404. O mock replica o formato real do Prisma 6 no Postgres:
     * `meta.constraint` com o nome da constraint do banco.
     */
    it('deve traduzir erro Prisma P2003 em fk_tipo_evento para AppError 404 "Tipo de evento não encontrado"', async () => {
      const p2003Error = Object.assign(new Error('Foreign key constraint failed'), {
        code: 'P2003',
        meta: { modelName: 'Eventos', constraint: 'eventos_fk_tipo_evento_fkey' },
      });
      vi.spyOn(fakeRepo, 'duplicarEvento').mockRejectedValueOnce(p2003Error);

      await expect(
        eventosService.duplicar(MOCK_EVENTOS[0].id, { data: NOVA_DATA, fk_tipo_evento: NON_EXISTENT_ID }, TENANT_A_ID)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Tipo de evento não encontrado',
      });
    });

    /** Deve traduzir P2003 na FK de user (integrante removido durante a cópia) para AppError 404. */
    it('deve traduzir erro Prisma P2003 em fk_user_id para AppError 404 "Integrante não encontrado"', async () => {
      const p2003Error = Object.assign(new Error('Foreign key constraint failed'), {
        code: 'P2003',
        meta: { modelName: 'Eventos_Users', constraint: 'eventos_users_fk_user_id_fkey' },
      });
      vi.spyOn(fakeRepo, 'duplicarEvento').mockRejectedValueOnce(p2003Error);

      await expect(
        eventosService.duplicar(MOCK_EVENTOS[0].id, { data: NOVA_DATA }, TENANT_A_ID)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Integrante não encontrado',
      });
    });

    /** Constraint não mapeada (ex.: tenant_id) cai no 404 genérico, sem vazar detalhe interno. */
    it('deve traduzir P2003 de constraint desconhecida para AppError 404 "Recurso referenciado não encontrado"', async () => {
      const p2003Error = Object.assign(new Error('Foreign key constraint failed'), {
        code: 'P2003',
        meta: { modelName: 'Eventos', constraint: 'eventos_tenant_id_fkey' },
      });
      vi.spyOn(fakeRepo, 'duplicarEvento').mockRejectedValueOnce(p2003Error);

      await expect(
        eventosService.duplicar(MOCK_EVENTOS[0].id, { data: NOVA_DATA }, TENANT_A_ID)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Recurso referenciado não encontrado',
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

    /**
     * Regressão do `#key=N`: a transposição deve usar o tom do evento (override)
     * e não o tom global da música. A música 1 tem tom global G (índice 10) mas
     * tom próprio A na escala (índice cromático 0) — a URL deve terminar em #key=0.
     */
    it('deve aplicar #key com o tom do evento quando a escala tem tom próprio', async () => {
      const result = await eventosService.getCifraclubPlaylist(MOCK_EVENTOS[0].id);
      const comOverride = result.playlist.find(p => p.musica_id === 'ggg00001-0000-0000-0000-000000000001');
      expect(comOverride).toBeDefined();
      expect(comOverride!.tom).toBe('A');
      expect(comOverride!.tom_final).toBe('A');
      expect(comOverride!.tom_ajustado).toBe(true);
      expect(comOverride!.cifraclub_url).toMatch(/#key=0$/);
    });

    /** Sem override, a transposição continua usando o tom global da música. */
    it('deve aplicar o tom global no #key quando a escala não tem tom próprio', async () => {
      const result = await eventosService.getCifraclubPlaylist(MOCK_EVENTOS[0].id);
      const semOverride = result.playlist.find(p => p.musica_id === 'ggg00001-0000-0000-0000-000000000002');
      expect(semOverride).toBeDefined();
      expect(semOverride!.tom).toBe('D');
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
      expect(result[0]).toHaveProperty('tonalidade_musica');
    });

    /** `tonalidade` deve carregar o tom efetivo (override) e `tonalidade_musica` o tom global. */
    it('deve retornar tonalidade efetiva e tonalidade_musica global na listagem', async () => {
      const result = await eventosService.listMusicas(MOCK_EVENTOS[0].id);
      const comOverride = result.find(m => m.id === 'ggg00001-0000-0000-0000-000000000001');
      const semOverride = result.find(m => m.id === 'ggg00001-0000-0000-0000-000000000002');
      expect(comOverride!.tonalidade).toEqual({ id: 'bbb00001-0000-0000-0000-000000000004', tom: 'A' });
      expect(comOverride!.tonalidade_musica).toEqual({ id: 'bbb00001-0000-0000-0000-000000000001', tom: 'G' });
      expect(semOverride!.tonalidade).toEqual(semOverride!.tonalidade_musica);
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

    /**
     * Deve traduzir P2003 na FK de versão para AppError 404 "Versão não encontrada".
     * O mock replica o formato real do Prisma 6 no Postgres: `meta.constraint`
     * com o nome da constraint do banco (não existe `meta.field_name`).
     */
    it('deve traduzir erro Prisma P2003 em fk_artistas_musicas para AppError 404 "Versão não encontrada"', async () => {
      const eventoId = MOCK_EVENTOS[1].id;
      const musicaId = MOCK_MUSICAS_BASE[0].id;
      const p2003Error = Object.assign(new Error('Foreign key constraint failed'), {
        code: 'P2003',
        meta: { modelName: 'Eventos_Musicas', constraint: 'eventos_musicas_fk_artistas_musicas_fkey' },
      });
      vi.spyOn(fakeRepo, 'createMusica').mockRejectedValueOnce(p2003Error);

      await expect(
        eventosService.addMusica(eventoId, musicaId, 'tenant-fake-id', 'versao-fake')
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Versão não encontrada',
      });
    });

    /** Deve traduzir P2003 na FK de evento (formato real `meta.constraint`) para AppError 404 "Evento não encontrado". */
    it('deve traduzir erro Prisma P2003 em evento_id para AppError 404 "Evento não encontrado"', async () => {
      const eventoId = MOCK_EVENTOS[1].id;
      const musicaId = MOCK_MUSICAS_BASE[0].id;
      const p2003Error = Object.assign(new Error('Foreign key constraint failed'), {
        code: 'P2003',
        meta: { modelName: 'Eventos_Musicas', constraint: 'eventos_musicas_evento_id_fkey' },
      });
      vi.spyOn(fakeRepo, 'createMusica').mockRejectedValueOnce(p2003Error);

      await expect(
        eventosService.addMusica(eventoId, musicaId, 'tenant-fake-id')
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Evento não encontrado',
      });
    });

    /** Deve traduzir P2003 na FK de música (formato real `meta.constraint`) para AppError 404 "Música não encontrada". */
    it('deve traduzir erro Prisma P2003 em musicas_id para AppError 404 "Música não encontrada"', async () => {
      const eventoId = MOCK_EVENTOS[1].id;
      const musicaId = MOCK_MUSICAS_BASE[0].id;
      const p2003Error = Object.assign(new Error('Foreign key constraint failed'), {
        code: 'P2003',
        meta: { modelName: 'Eventos_Musicas', constraint: 'eventos_musicas_musicas_id_fkey' },
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
     * Fallback defensivo: versões do Prisma que reportem `meta.field_name`
     * (em vez de `meta.constraint`) também devem ser traduzidas corretamente.
     */
    it('deve traduzir P2003 via fallback meta.field_name para AppError 404 "Versão não encontrada"', async () => {
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

  // ─── setMusicaTonalidade ────────────────────────────────
  describe('setMusicaTonalidade', () => {
    /** Deve definir o tom próprio da escala e retornar tonalidade efetiva ≠ tom global. */
    it('deve definir o tom da escala e retornar tonalidade efetiva com tonalidade_musica global', async () => {
      const eventoId = MOCK_EVENTOS[0].id;
      const musicaId = MOCK_MUSICAS_BASE[1].id; // tom global D, sem override
      const tonalidadeE = MOCK_TONALIDADES[4]; // E

      const result = await eventosService.setMusicaTonalidade(eventoId, musicaId, tonalidadeE.id);
      expect(result.id).toBe(musicaId);
      expect(result.tonalidade).toEqual({ id: tonalidadeE.id, tom: 'E' });
      expect(result.tonalidade_musica).toEqual({ id: 'bbb00001-0000-0000-0000-000000000002', tom: 'D' });
    });

    /** Enviar `null` deve remover o override e a música volta ao tom global. */
    it('deve voltar ao tom global quando fk_tonalidade é null', async () => {
      const eventoId = MOCK_EVENTOS[0].id;
      const musicaId = MOCK_MUSICAS_BASE[0].id; // tem override A no mock

      const result = await eventosService.setMusicaTonalidade(eventoId, musicaId, null);
      expect(result.tonalidade).toEqual({ id: 'bbb00001-0000-0000-0000-000000000001', tom: 'G' });
      expect(result.tonalidade_musica).toEqual({ id: 'bbb00001-0000-0000-0000-000000000001', tom: 'G' });
    });

    /** Deve lançar AppError 404 quando o evento não existe no tenant ativo. */
    it('deve lançar AppError 404 quando evento não existe', async () => {
      await expect(
        eventosService.setMusicaTonalidade(NON_EXISTENT_ID, MOCK_MUSICAS_BASE[0].id, null)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Evento não encontrado',
      });
    });

    /** Deve lançar AppError 404 quando o vínculo evento-música não existe. */
    it('deve lançar AppError 404 quando eventos_musicas não existe para o par', async () => {
      await expect(
        eventosService.setMusicaTonalidade(MOCK_EVENTOS[0].id, NON_EXISTENT_ID, null)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Música não encontrada no evento',
      });
    });

    /** Deve lançar AppError 404 quando a tonalidade não existe no tenant ativo. */
    it('deve lançar AppError 404 quando tonalidade não existe', async () => {
      await expect(
        eventosService.setMusicaTonalidade(MOCK_EVENTOS[0].id, MOCK_MUSICAS_BASE[0].id, NON_EXISTENT_ID)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Tonalidade não encontrada',
      });
    });

    /**
     * Deve traduzir P2003 em fk_tonalidade (corrida com deleção da tonalidade) para 404.
     * O mock replica o formato real do Prisma 6 no Postgres (`meta.constraint`).
     */
    it('deve traduzir erro Prisma P2003 em fk_tonalidade para AppError 404 "Tonalidade não encontrada"', async () => {
      const p2003Error = Object.assign(new Error('Foreign key constraint failed'), {
        code: 'P2003',
        meta: { modelName: 'Eventos_Musicas', constraint: 'eventos_musicas_fk_tonalidade_fkey' },
      });
      vi.spyOn(fakeRepo, 'setMusicaTonalidadeAtomic').mockRejectedValueOnce(p2003Error);

      await expect(
        eventosService.setMusicaTonalidade(MOCK_EVENTOS[0].id, MOCK_MUSICAS_BASE[0].id, MOCK_TONALIDADES[0].id)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Tonalidade não encontrada',
      });
    });

    /**
     * Cobre a guard contra race condition: se o vínculo evento-música some entre
     * `setMusicaTonalidadeAtomic` e `findEventoMusicaDetail`, o serviço lança
     * AppError 500 em vez de quebrar com `detail!`.
     */
    it('deve lançar AppError 500 quando findEventoMusicaDetail retorna null após setMusicaTonalidadeAtomic', async () => {
      vi.spyOn(fakeRepo, 'findEventoMusicaDetail').mockResolvedValueOnce(null);

      await expect(
        eventosService.setMusicaTonalidade(MOCK_EVENTOS[0].id, MOCK_MUSICAS_BASE[0].id, null)
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
        eventosService.addIntegrante(MOCK_EVENTOS[0].id, MOCK_INTEGRANTES[2].id, undefined, TENANT_B_ID)
      ).resolves.toBeUndefined();
    });

    /** Deve vincular integrante ao evento com funcao_ids específicas. */
    it('deve vincular integrante ao evento com funcao_ids específicas', async () => {
      const funcaoId = MOCK_INTEGRANTES_FUNCOES
        .filter(iif => iif.fk_user_id === MOCK_INTEGRANTES[0].id)
        .map(iif => iif.funcao_id);
      await expect(
        eventosService.addIntegrante(MOCK_EVENTOS[2].id, MOCK_INTEGRANTES[0].id, [funcaoId[0]], TENANT_A_ID)
      ).resolves.toBeUndefined();

      const integrantes = await eventosService.listIntegrantes(MOCK_EVENTOS[2].id);
      const added = integrantes.find(i => i.id === MOCK_INTEGRANTES[0].id);
      expect(added).toBeDefined();
      expect(added!.funcoes).toHaveLength(1);
      expect(added!.funcoes[0].id).toBe(funcaoId[0]);
    });

    /**
     * Isolamento entre igrejas: um integrante que pertence apenas ao tenant B
     * não pode ser vinculado a uma escala operada no contexto do tenant A,
     * mesmo que seu UUID seja conhecido.
     */
    it('deve lançar AppError 404 quando o integrante não pertence ao tenant ativo', async () => {
      await expect(
        eventosService.addIntegrante(MOCK_EVENTOS[2].id, MOCK_INTEGRANTES[2].id, undefined, TENANT_A_ID)
      ).rejects.toMatchObject({
        statusCode: 404,
        message: 'Integrante não encontrado',
      });
    });

    /** Deve lançar AppError 400 quando funcao_ids contém ID que não pertence ao integrante. */
    it('deve lançar AppError 400 quando funcao_ids contém ID inválido', async () => {
      await expect(
        eventosService.addIntegrante(MOCK_EVENTOS[2].id, MOCK_INTEGRANTES[0].id, [NON_EXISTENT_ID], TENANT_A_ID)
      ).rejects.toMatchObject({
        statusCode: 400,
        message: 'Função inválida: não pertence ao integrante',
      });
    });

    it('deve lançar AppError 400 quando fk_integrante_id não é enviado', async () => {
      await expect(eventosService.addIntegrante(MOCK_EVENTOS[0].id, undefined, undefined, TENANT_A_ID)).rejects.toMatchObject({
        statusCode: 400,
        message: 'ID do integrante é obrigatório',
      });
    });

    it('deve lançar AppError 404 quando evento não existe', async () => {
      await expect(eventosService.addIntegrante(NON_EXISTENT_ID, MOCK_INTEGRANTES[0].id, undefined, TENANT_A_ID)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Evento não encontrado',
      });
    });

    it('deve lançar AppError 404 quando integrante não existe', async () => {
      await expect(eventosService.addIntegrante(MOCK_EVENTOS[0].id, NON_EXISTENT_ID, undefined, TENANT_A_ID)).rejects.toMatchObject({
        statusCode: 404,
        message: 'Integrante não encontrado',
      });
    });

    it('deve lançar AppError 409 quando registro duplicado', async () => {
      const existing = MOCK_EVENTOS_INTEGRANTES[0];
      await expect(eventosService.addIntegrante(existing.evento_id, existing.fk_user_id, undefined, TENANT_A_ID)).rejects.toMatchObject({
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
