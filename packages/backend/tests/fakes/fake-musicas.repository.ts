import { randomUUID } from 'node:crypto';
import {
  generatePaginationMusicas,
  MOCK_ARTISTAS_MUSICAS,
  MOCK_MUSICAS_CATEGORIAS,
  MOCK_MUSICAS_FUNCOES,
  MOCK_TONALIDADES,
  MOCK_CATEGORIAS,
  MOCK_FUNCOES,
  MOCK_ARTISTAS,
} from './mock-data.js';
import type { CreateMusicaCompleteInput, UpdateMusicaCompleteInput } from '../../src/types/index.js';

/**
 * Cria fake repository para Músicas com dados em memória (inclui paginação e sub-recursos).
 * `@returns` Repositório fake com CRUD de músicas e sub-recursos (versões, tags e funções).
 */
export function createFakeMusicasRepository() {
  let musicasData = generatePaginationMusicas();
  let versoesData = MOCK_ARTISTAS_MUSICAS.map(v => ({ ...v }));
  let categoriasData = MOCK_MUSICAS_CATEGORIAS.map(t => ({ ...t }));
  let funcoesData = MOCK_MUSICAS_FUNCOES.map(f => ({ ...f }));

  const getTonalidade = (fk_tonalidade: string) => {
    const t = MOCK_TONALIDADES.find(ton => ton.id === fk_tonalidade);
    return t ? { id: t.id, tom: t.tom } : null;
  };

  const buildMusicaRaw = (musica: typeof musicasData[0]) => ({
    id: musica.id,
    nome: musica.nome,
    musicas_fk_tonalidade_fkey: getTonalidade(musica.fk_tonalidade),
    Musicas_Categorias: categoriasData
      .filter(t => t.musica_id === musica.id)
      .map(t => ({
        musicas_categorias_categoria_id_fkey: MOCK_CATEGORIAS.find(cat => cat.id === t.categoria_id)!,
      })),
    Artistas_Musicas: versoesData
      .filter(v => v.musica_id === musica.id)
      .map(v => ({
        id: v.id,
        bpm: v.bpm,
        cifras: v.cifras,
        lyrics: v.lyrics,
        link_versao: v.link_versao,
        cifraclub_url: (v as any).cifraclub_url ?? null,
        artistas_musicas_artista_id_fkey: v.artista_id ? MOCK_ARTISTAS.find(a => a.id === v.artista_id)! : null,
      })),
    Musicas_Funcoes: funcoesData
      .filter(f => f.musica_id === musica.id)
      .map(f => ({
        musicas_funcoes_funcao_id_fkey: MOCK_FUNCOES.find(fn => fn.id === f.funcao_id)!,
      })),
  });

  const buildCreateReturn = (musica: typeof musicasData[0]) => ({
    id: musica.id,
    nome: musica.nome,
    musicas_fk_tonalidade_fkey: getTonalidade(musica.fk_tonalidade),
  });

  /**
   * Aplica filtros parciais (categoria_id `in` e nome `contains`) compatíveis com o
   * subset de `Prisma.MusicasWhereInput` usado por `MusicasService.listAll`.
   *
   * NB: o campo `mode` (insensitive/default) é silenciosamente ignorado — o
   * fake sempre se comporta como case-insensitive via `toLowerCase()`. Testes
   * que dependem do contraste case-sensitive deverão usar o cliente real do
   * Prisma em testes de integração.
   *
   * @param where - Subset suportado: `{ Musicas_Categorias: { some: { categoria_id: { in } } }, nome: { contains, mode } }`.
   * @returns Lista de músicas filtradas.
   */
  const applyWhere = (where?: Record<string, unknown>) => {
    if (!where) return musicasData;
    let result = musicasData;

    const catFilter = (where as { Musicas_Categorias?: { some?: { categoria_id?: { in?: string[] } } } })
      .Musicas_Categorias?.some?.categoria_id?.in;
    if (Array.isArray(catFilter) && catFilter.length > 0) {
      const matchingMusicaIds = new Set(
        categoriasData
          .filter(t => catFilter.includes(t.categoria_id))
          .map(t => t.musica_id),
      );
      result = result.filter(m => matchingMusicaIds.has(m.id));
    }

    const nomeFilter = (where as { nome?: { contains?: string } }).nome?.contains;
    if (typeof nomeFilter === 'string' && nomeFilter.length > 0) {
      /**
       * Inverte o escape de wildcards LIKE feito pelo validator do backend
       * (`\\` → `\`, `\%` → `%`, `\_` → `_`) para que o fake compare
       * literais reais. Sem isso, um `q` contendo `%` ou `_` cairia em
       * falso negativo neste fake, divergindo do comportamento real do
       * Prisma `contains` em PostgreSQL (que trata os escapes via LIKE).
       *
       * O padrão `\\(.)` faz uma única passada da esquerda para a direita
       * consumindo `\` + caractere subsequente, o que evita o problema de
       * passes sucessivas que poderiam confundir `\\%` (literal `\` +
       * literal `%`) com `\%` (literal `%`).
       */
      const needle = nomeFilter.replace(/\\(.)/g, '$1').toLowerCase();
      result = result.filter(m => m.nome.toLowerCase().includes(needle));
    }

    return result;
  };

  return {
    // --- Base CRUD ---

    /** Retorna músicas paginadas aplicando o subset de filtros suportado. */
    findAll: async (skip: number, take: number, where?: Record<string, unknown>) =>
      applyWhere(where).slice(skip, skip + take).map(buildMusicaRaw),

    /** Conta músicas que satisfazem o filtro `where` (subset suportado). */
    count: async (where?: Record<string, unknown>) => applyWhere(where).length,

    findById: async (id: string) => {
      const musica = musicasData.find(m => m.id === id);
      return musica ? buildMusicaRaw(musica) : null;
    },

    findByIdSimple: async (id: string) => musicasData.find(m => m.id === id) ?? null,

    findByIdNameOnly: async (id: string) => {
      const musica = musicasData.find(m => m.id === id);
      return musica ? { id: musica.id, nome: musica.nome } : null;
    },

    create: async (data: { nome: string; fk_tonalidade: string }, _tenantId?: string) => {
      const musica = { id: randomUUID(), nome: data.nome, fk_tonalidade: data.fk_tonalidade };
      musicasData.push(musica);
      return buildCreateReturn(musica);
    },

    update: async (id: string, updateData: Record<string, unknown>) => {
      const musica = musicasData.find(m => m.id === id);
      if (!musica) return null;
      Object.assign(musica, updateData);
      return buildCreateReturn(musica);
    },

    delete: async (id: string) => {
      const idx = musicasData.findIndex(m => m.id === id);
      if (idx === -1) return;
      musicasData.splice(idx, 1);
    },

    // --- Complete (música + versão atômica) ---

    /**
     * Cria uma música e opcionalmente uma versão em transação simulada.
     * Simula criação de junções de categorias e funções quando fornecidas.
     *
     * @param data - Dados de criação completa (música + versão opcional + categorias/funções).
     * @returns Música criada com todos os relacionamentos (formato MUSICA_SELECT).
     */
    createWithVersao: async (data: CreateMusicaCompleteInput, _tenantId?: string) => {
      const musica = { id: randomUUID(), nome: data.nome!, fk_tonalidade: data.fk_tonalidade ?? '' };
      musicasData.push(musica);

      const temCamposVersao = data.artista_id !== undefined || data.bpm !== undefined || data.cifras !== undefined || data.lyrics !== undefined || data.link_versao !== undefined || data.cifraclub_url !== undefined || data.intensidade !== undefined;
      if (temCamposVersao) {
        const versao = {
          id: randomUUID(),
          artista_id: data.artista_id ?? null,
          musica_id: musica.id,
          bpm: data.bpm ?? null,
          cifras: data.cifras ?? null,
          lyrics: data.lyrics ?? null,
          link_versao: data.link_versao ?? null,
          cifraclub_url: data.cifraclub_url ?? null,
          intensidade: data.intensidade ?? null,
        };
        versoesData.push(versao);
      }

      for (const catId of data.categoria_ids ?? []) {
        categoriasData.push({ id: randomUUID(), musica_id: musica.id, categoria_id: catId });
      }
      for (const funId of data.funcao_ids ?? []) {
        funcoesData.push({ id: randomUUID(), musica_id: musica.id, funcao_id: funId });
      }

      return buildMusicaRaw(musica);
    },

    /**
     * Atualiza uma música e opcionalmente sua versão em transação simulada.
     * Sincroniza junções de categorias e funções quando fornecidas.
     *
     * @param id - UUID da música.
     * @param data - Dados de atualização completa (música + versão + categorias/funções).
     * @returns Música atualizada com todos os relacionamentos (formato MUSICA_SELECT).
     */
    updateWithVersao: async (id: string, data: UpdateMusicaCompleteInput, _tenantId?: string) => {
      const musica = musicasData.find(m => m.id === id);
      if (!musica) throw new Error('Música não encontrada no fake');
      if (data.nome !== undefined) musica.nome = data.nome;
      if (data.fk_tonalidade !== undefined) musica.fk_tonalidade = data.fk_tonalidade ?? '';

      if (data.versao_id) {
        const versao = versoesData.find(v => v.id === data.versao_id);
        if (versao) {
          if (data.bpm !== undefined) versao.bpm = data.bpm ?? null;
          if (data.cifras !== undefined) versao.cifras = data.cifras ?? null;
          if (data.lyrics !== undefined) versao.lyrics = data.lyrics ?? null;
          if (data.link_versao !== undefined) versao.link_versao = data.link_versao ?? null;
          if (data.cifraclub_url !== undefined) (versao as any).cifraclub_url = data.cifraclub_url ?? null;
          if (data.intensidade !== undefined) (versao as any).intensidade = data.intensidade ?? null;
        }
      }

      if (data.categoria_ids !== undefined) {
        categoriasData = categoriasData.filter(c => c.musica_id !== id);
        for (const catId of data.categoria_ids) {
          categoriasData.push({ id: randomUUID(), musica_id: id, categoria_id: catId });
        }
      }
      if (data.funcao_ids !== undefined) {
        funcoesData = funcoesData.filter(f => f.musica_id !== id);
        for (const funId of data.funcao_ids) {
          funcoesData.push({ id: randomUUID(), musica_id: id, funcao_id: funId });
        }
      }

      return buildMusicaRaw(musica);
    },

    // --- Versoes (artistas_musicas) ---

    findVersoes: async (musicaId: string) =>
      versoesData
        .filter(v => v.musica_id === musicaId)
        .map(v => ({
          id: v.id,
          bpm: v.bpm,
          cifras: v.cifras,
          lyrics: v.lyrics,
          link_versao: v.link_versao,
          cifraclub_url: (v as any).cifraclub_url ?? null,
          intensidade: (v as any).intensidade ?? null,
          artistas_musicas_artista_id_fkey: v.artista_id ? MOCK_ARTISTAS.find(a => a.id === v.artista_id)! : null,
        })),

    findVersaoById: async (versaoId: string) =>
      versoesData.find(v => v.id === versaoId) ?? null,

    /** Cria uma versão de música. Aceita artista_id null para versões sem artista. */
    createVersao: async (data: {
      artista_id?: string | null;
      musica_id: string;
      bpm?: number;
      cifras?: string;
      lyrics?: string;
      link_versao?: string;
      cifraclub_url?: string;
      intensidade?: string | null;
    }, _tenantId?: string) => {
      const versao = {
        id: randomUUID(),
        artista_id: data.artista_id ?? null,
        musica_id: data.musica_id,
        bpm: data.bpm ?? null,
        cifras: data.cifras ?? null,
        lyrics: data.lyrics ?? null,
        link_versao: data.link_versao ?? null,
        cifraclub_url: data.cifraclub_url ?? null,
        intensidade: data.intensidade ?? null,
      };
      versoesData.push(versao);
      const artista = data.artista_id ? MOCK_ARTISTAS.find(a => a.id === data.artista_id)! : null;
      return {
        id: versao.id,
        bpm: versao.bpm,
        cifras: versao.cifras,
        lyrics: versao.lyrics,
        link_versao: versao.link_versao,
        cifraclub_url: versao.cifraclub_url,
        intensidade: versao.intensidade,
        artistas_musicas_artista_id_fkey: artista ? { id: artista.id, nome: artista.nome } : null,
      };
    },

    updateVersao: async (versaoId: string, updateData: Record<string, unknown>) => {
      const versao = versoesData.find(v => v.id === versaoId);
      if (!versao) return null;
      Object.assign(versao, updateData);
      const artista = versao.artista_id ? MOCK_ARTISTAS.find(a => a.id === versao.artista_id)! : null;
      return {
        id: versao.id,
        bpm: versao.bpm,
        cifras: versao.cifras,
        lyrics: versao.lyrics,
        link_versao: versao.link_versao,
        cifraclub_url: (versao as any).cifraclub_url ?? null,
        intensidade: (versao as any).intensidade ?? null,
        artistas_musicas_artista_id_fkey: artista ? { id: artista.id, nome: artista.nome } : null,
      };
    },

    deleteVersao: async (versaoId: string) => {
      const idx = versoesData.findIndex(v => v.id === versaoId);
      if (idx === -1) return;
      versoesData.splice(idx, 1);
    },

    findVersaoDuplicate: async (musicaId: string, artistaId: string) =>
      versoesData.find(v => v.musica_id === musicaId && v.artista_id === artistaId) ?? null,

    /** Busca versão sem artista para uma música (artista_id = null). */
    findVersaoWithoutArtist: async (musicaId: string) =>
      versoesData.find(v => v.musica_id === musicaId && v.artista_id === null) ?? null,

    findArtistaById: async (artistaId: string) =>
      MOCK_ARTISTAS.find(a => a.id === artistaId) ?? null,

    // --- Categorias (musicas_categorias) ---

    /** Retorna as categorias associadas a uma música pelo ID da música. */
    findCategorias: async (musicaId: string) =>
      categoriasData
        .filter(t => t.musica_id === musicaId)
        .map(t => ({
          musicas_categorias_categoria_id_fkey: MOCK_CATEGORIAS.find(cat => cat.id === t.categoria_id)!,
        })),

    /**
     * Cria uma associação entre música e categoria. Muta categoriasData.
     * @param musicaId - ID da música.
     * @param categoriaId - ID da categoria.
     */
    createCategoria: async (musicaId: string, categoriaId: string, _tenantId?: string) => {
      const record = { id: randomUUID(), musica_id: musicaId, categoria_id: categoriaId };
      categoriasData.push(record);
      return record;
    },

    /** Remove uma associação música-categoria pelo ID do registro. Muta categoriasData. */
    deleteCategoria: async (id: string) => {
      const idx = categoriasData.findIndex(t => t.id === id);
      if (idx === -1) return;
      categoriasData.splice(idx, 1);
    },

    /** Verifica se já existe associação entre a música e a categoria informadas. Retorna o registro ou null. */
    findCategoriaDuplicate: async (musicaId: string, categoriaId: string) =>
      categoriasData.find(t => t.musica_id === musicaId && t.categoria_id === categoriaId) ?? null,

    /** Busca uma categoria pelo ID nos dados mock. Retorna o registro ou null. */
    findCategoriaById: async (categoriaId: string) =>
      MOCK_CATEGORIAS.find(t => t.id === categoriaId) ?? null,

    /** Conta quantas categorias existem dentre os IDs fornecidos. */
    countCategoriasByIds: async (ids: string[]) =>
      MOCK_CATEGORIAS.filter(c => ids.includes(c.id)).length,

    // --- Funcoes (musicas_funcoes) ---

    findFuncoes: async (musicaId: string) =>
      funcoesData
        .filter(f => f.musica_id === musicaId)
        .map(f => ({
          musicas_funcoes_funcao_id_fkey: MOCK_FUNCOES.find(fn => fn.id === f.funcao_id)!,
        })),

    createFuncao: async (musicaId: string, funcaoId: string, _tenantId?: string) => {
      const record = { id: randomUUID(), musica_id: musicaId, funcao_id: funcaoId };
      funcoesData.push(record);
      return record;
    },

    deleteFuncao: async (id: string) => {
      const idx = funcoesData.findIndex(f => f.id === id);
      if (idx === -1) return;
      funcoesData.splice(idx, 1);
    },

    findFuncaoDuplicate: async (musicaId: string, funcaoId: string) =>
      funcoesData.find(f => f.musica_id === musicaId && f.funcao_id === funcaoId) ?? null,

    findFuncaoById: async (funcaoId: string) =>
      MOCK_FUNCOES.find(f => f.id === funcaoId) ?? null,

    /** Conta quantas funções existem dentre os IDs fornecidos. */
    countFuncoesByIds: async (ids: string[]) =>
      MOCK_FUNCOES.filter(f => ids.includes(f.id)).length,

    reset: () => {
      musicasData = generatePaginationMusicas();
      versoesData = MOCK_ARTISTAS_MUSICAS.map(v => ({ ...v }));
      categoriasData = MOCK_MUSICAS_CATEGORIAS.map(t => ({ ...t }));
      funcoesData = MOCK_MUSICAS_FUNCOES.map(f => ({ ...f }));
    },
  };
}
