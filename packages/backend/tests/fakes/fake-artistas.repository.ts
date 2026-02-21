import { randomUUID } from 'node:crypto';
import { MOCK_ARTISTAS, MOCK_ARTISTAS_MUSICAS, MOCK_MUSICAS_BASE, MOCK_TONALIDADES } from './mock-data.js';

/** Cria fake repository para Artistas com dados em memória. */
export function createFakeArtistasRepository() {
  let data = MOCK_ARTISTAS.map(a => ({ ...a }));

  return {
    findAll: async () => data.map(({ id, nome }) => ({ id, nome })),

    findById: async (id: string) => {
      const artista = data.find(a => a.id === id);
      if (!artista) return null;
      const versoes = MOCK_ARTISTAS_MUSICAS.filter(am => am.artista_id === id);
      return {
        ...artista,
        Artistas_Musicas: versoes.map(v => {
          const musica = MOCK_MUSICAS_BASE.find(m => m.id === v.musica_id);
          const tonalidade = MOCK_TONALIDADES.find(t => t.id === musica?.fk_tonalidade);
          return {
            id: v.id,
            bpm: v.bpm,
            cifras: v.cifras,
            lyrics: v.lyrics,
            link_versao: v.link_versao,
            artistas_musicas_musica_id_fkey: {
              id: musica?.id ?? '',
              nome: musica?.nome ?? '',
              musicas_fk_tonalidade_fkey: tonalidade ? { id: tonalidade.id, tom: tonalidade.tom } : null,
            },
          };
        }),
      };
    },

    findByIdSimple: async (id: string) => data.find(a => a.id === id) ?? null,

    findByNome: async (nome: string) => data.find(a => a.nome === nome) ?? null,

    findByNomeExcludingId: async (nome: string, excludeId: string) =>
      data.find(a => a.nome === nome && a.id !== excludeId) ?? null,

    create: async (nome: string) => {
      const artista = { id: randomUUID(), nome };
      data.push(artista);
      return artista;
    },

    update: async (id: string, nome: string) => {
      const artista = data.find(a => a.id === id);
      if (!artista) return null;
      artista.nome = nome;
      return artista;
    },

    delete: async (id: string) => {
      const idx = data.findIndex(a => a.id === id);
      if (idx === -1) return null;
      const [removed] = data.splice(idx, 1);
      return removed;
    },
    reset: () => { data = MOCK_ARTISTAS.map(a => ({ ...a })); },
  };
}
