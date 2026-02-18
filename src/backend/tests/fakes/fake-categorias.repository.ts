import { randomUUID } from 'node:crypto';
import { MOCK_TAGS } from './mock-data.js';

/** Cria fake repository para Tags com dados em memória. */
export function createFakeTagsRepository() {
  let data = MOCK_TAGS.map(t => ({ ...t }));

  return {
    findAll: async () => data.map(({ id, nome }) => ({ id, nome })),
    findById: async (id: string) => data.find(t => t.id === id) ?? null,
    findByNome: async (nome: string) => data.find(t => t.nome === nome) ?? null,
    findByNomeExcludingId: async (nome: string, excludeId: string) =>
      data.find(t => t.nome === nome && t.id !== excludeId) ?? null,
    create: async (nome: string) => {
      const tag = { id: randomUUID(), nome };
      data.push(tag);
      return { id: tag.id, nome: tag.nome };
    },
    update: async (id: string, nome: string) => {
      const tag = data.find(t => t.id === id);
      if (!tag) return null;
      tag.nome = nome;
      return { id: tag.id, nome: tag.nome };
    },
    delete: async (id: string) => {
      const idx = data.findIndex(t => t.id === id);
      if (idx === -1) return null;
      const [removed] = data.splice(idx, 1);
      return removed;
    },    reset: () => { data = MOCK_TAGS.map(t => ({ ...t })); },
  };
}
