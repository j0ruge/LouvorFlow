import { randomUUID } from 'node:crypto';
import { MOCK_TIPOS_EVENTOS } from './mock-data.js';

/** Cria fake repository para TiposEventos com dados em memória. */
export function createFakeTiposEventosRepository() {
  let data = MOCK_TIPOS_EVENTOS.map(t => ({ ...t }));

  return {
    findAll: async () => data.map(({ id, nome }) => ({ id, nome })),
    findById: async (id: string) => data.find(t => t.id === id) ?? null,
    findByNome: async (nome: string) => data.find(t => t.nome === nome) ?? null,
    findByNomeExcludingId: async (nome: string, excludeId: string) =>
      data.find(t => t.nome === nome && t.id !== excludeId) ?? null,
    create: async (nome: string) => {
      const tipo = { id: randomUUID(), nome };
      data.push(tipo);
      return { id: tipo.id, nome: tipo.nome };
    },
    update: async (id: string, nome: string) => {
      const tipo = data.find(t => t.id === id);
      if (!tipo) return null;
      tipo.nome = nome;
      return { id: tipo.id, nome: tipo.nome };
    },
    delete: async (id: string) => {
      const idx = data.findIndex(t => t.id === id);
      if (idx === -1) return null;
      const [removed] = data.splice(idx, 1);
      return removed;
    },
    reset: () => { data = MOCK_TIPOS_EVENTOS.map(t => ({ ...t })); },
  };
}
