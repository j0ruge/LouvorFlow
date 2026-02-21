import { randomUUID } from 'node:crypto';
import { MOCK_CATEGORIAS } from './mock-data.js';

/** Cria fake repository para Categorias com dados em memória. */
export function createFakeCategoriasRepository() {
  let data = MOCK_CATEGORIAS.map(t => ({ ...t }));

  return {
    findAll: async () => data.map(({ id, nome }) => ({ id, nome })),
    findById: async (id: string) => data.find(t => t.id === id) ?? null,
    findByNome: async (nome: string) => data.find(t => t.nome === nome) ?? null,
    findByNomeExcludingId: async (nome: string, excludeId: string) =>
      data.find(t => t.nome === nome && t.id !== excludeId) ?? null,
    create: async (nome: string) => {
      const categoria = { id: randomUUID(), nome };
      data.push(categoria);
      return { id: categoria.id, nome: categoria.nome };
    },
    update: async (id: string, nome: string) => {
      const categoria = data.find(t => t.id === id);
      if (!categoria) return null;
      categoria.nome = nome;
      return { id: categoria.id, nome: categoria.nome };
    },
    delete: async (id: string) => {
      const idx = data.findIndex(t => t.id === id);
      if (idx === -1) return null;
      const [removed] = data.splice(idx, 1);
      return removed;
    },    reset: () => { data = MOCK_CATEGORIAS.map(t => ({ ...t })); },
  };
}
