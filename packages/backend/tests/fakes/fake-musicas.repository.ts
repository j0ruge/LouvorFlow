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
        artistas_musicas_artista_id_fkey: MOCK_ARTISTAS.find(a => a.id === v.artista_id)!,
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

  return {
    // --- Base CRUD ---

    findAll: async (skip: number, take: number) =>
      musicasData.slice(skip, skip + take).map(buildMusicaRaw),

    count: async () => musicasData.length,

    findById: async (id: string) => {
      const musica = musicasData.find(m => m.id === id);
      return musica ? buildMusicaRaw(musica) : null;
    },

    findByIdSimple: async (id: string) => musicasData.find(m => m.id === id) ?? null,

    findByIdNameOnly: async (id: string) => {
      const musica = musicasData.find(m => m.id === id);
      return musica ? { id: musica.id, nome: musica.nome } : null;
    },

    create: async (data: { nome: string; fk_tonalidade: string }) => {
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
          artistas_musicas_artista_id_fkey: MOCK_ARTISTAS.find(a => a.id === v.artista_id)!,
        })),

    findVersaoById: async (versaoId: string) =>
      versoesData.find(v => v.id === versaoId) ?? null,

    createVersao: async (data: {
      artista_id: string;
      musica_id: string;
      bpm?: number;
      cifras?: string;
      lyrics?: string;
      link_versao?: string;
    }) => {
      const versao = {
        id: randomUUID(),
        artista_id: data.artista_id,
        musica_id: data.musica_id,
        bpm: data.bpm ?? null,
        cifras: data.cifras ?? null,
        lyrics: data.lyrics ?? null,
        link_versao: data.link_versao ?? null,
      };
      versoesData.push(versao);
      const artista = MOCK_ARTISTAS.find(a => a.id === data.artista_id)!;
      return {
        id: versao.id,
        bpm: versao.bpm,
        cifras: versao.cifras,
        lyrics: versao.lyrics,
        link_versao: versao.link_versao,
        artistas_musicas_artista_id_fkey: { id: artista.id, nome: artista.nome },
      };
    },

    updateVersao: async (versaoId: string, updateData: Record<string, unknown>) => {
      const versao = versoesData.find(v => v.id === versaoId);
      if (!versao) return null;
      Object.assign(versao, updateData);
      const artista = MOCK_ARTISTAS.find(a => a.id === versao.artista_id)!;
      return {
        id: versao.id,
        bpm: versao.bpm,
        cifras: versao.cifras,
        lyrics: versao.lyrics,
        link_versao: versao.link_versao,
        artistas_musicas_artista_id_fkey: { id: artista.id, nome: artista.nome },
      };
    },

    deleteVersao: async (versaoId: string) => {
      const idx = versoesData.findIndex(v => v.id === versaoId);
      if (idx === -1) return;
      versoesData.splice(idx, 1);
    },

    findVersaoDuplicate: async (musicaId: string, artistaId: string) =>
      versoesData.find(v => v.musica_id === musicaId && v.artista_id === artistaId) ?? null,

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
    createCategoria: async (musicaId: string, categoriaId: string) => {
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

    // --- Funcoes (musicas_funcoes) ---

    findFuncoes: async (musicaId: string) =>
      funcoesData
        .filter(f => f.musica_id === musicaId)
        .map(f => ({
          musicas_funcoes_funcao_id_fkey: MOCK_FUNCOES.find(fn => fn.id === f.funcao_id)!,
        })),

    createFuncao: async (musicaId: string, funcaoId: string) => {
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

    reset: () => {
      musicasData = generatePaginationMusicas();
      versoesData = MOCK_ARTISTAS_MUSICAS.map(v => ({ ...v }));
      categoriasData = MOCK_MUSICAS_CATEGORIAS.map(t => ({ ...t }));
      funcoesData = MOCK_MUSICAS_FUNCOES.map(f => ({ ...f }));
    },
  };
}
