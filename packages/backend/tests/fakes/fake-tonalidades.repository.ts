import { randomUUID } from 'node:crypto';
import { MOCK_TONALIDADES } from './mock-data.js';

/** Cria fake repository para Tonalidades com dados em memória. */
export function createFakeTonalidadesRepository() {
  let data = MOCK_TONALIDADES.map(t => ({ ...t }));

  return {
    findAll: async () => data.map(({ id, tom }) => ({ id, tom })),
    findById: async (id: string) => data.find(t => t.id === id) ?? null,
    /** Busca por tom ignorando caixa, espelhando `mode: 'insensitive'` do Prisma real. */
    findByTom: async (tom: string) =>
      data.find(t => t.tom.toLowerCase() === tom.toLowerCase()) ?? null,
    /** Busca por tom ignorando caixa, excluindo um ID — espelha `mode: 'insensitive'` do Prisma real. */
    findByTomExcludingId: async (tom: string, excludeId: string) =>
      data.find(t => t.tom.toLowerCase() === tom.toLowerCase() && t.id !== excludeId) ?? null,
    create: async (tom: string, _tenantId?: string) => {
      const tonalidade = { id: randomUUID(), tom };
      data.push(tonalidade);
      return { id: tonalidade.id, tom: tonalidade.tom };
    },
    update: async (id: string, tom: string) => {
      const tonalidade = data.find(t => t.id === id);
      if (!tonalidade) return null;
      tonalidade.tom = tom;
      return { id: tonalidade.id, tom: tonalidade.tom };
    },
    delete: async (id: string) => {
      const idx = data.findIndex(t => t.id === id);
      if (idx === -1) return null;
      const [removed] = data.splice(idx, 1);
      return removed;
    },
    reset: () => { data = MOCK_TONALIDADES.map(t => ({ ...t })); },
  };
}
