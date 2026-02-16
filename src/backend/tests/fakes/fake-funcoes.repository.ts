import { randomUUID } from 'node:crypto';
import { MOCK_FUNCOES } from './mock-data.js';

/** Cria fake repository para Funcoes com dados em memória. */
export function createFakeFuncoesRepository() {
  let data = MOCK_FUNCOES.map(f => ({ ...f }));

  return {
    findAll: async () => data.map(({ id, nome }) => ({ id, nome })),
    findById: async (id: string) => data.find(f => f.id === id) ?? null,
    findByNome: async (nome: string) => data.find(f => f.nome === nome) ?? null,
    findByNomeExcludingId: async (nome: string, excludeId: string) =>
      data.find(f => f.nome === nome && f.id !== excludeId) ?? null,
    create: async (nome: string) => {
      const funcao = { id: randomUUID(), nome };
      data.push(funcao);
      return { id: funcao.id, nome: funcao.nome };
    },
    update: async (id: string, nome: string) => {
      const funcao = data.find(f => f.id === id);
      if (!funcao) return null;
      funcao.nome = nome;
      return { id: funcao.id, nome: funcao.nome };
    },
    delete: async (id: string) => {
      const idx = data.findIndex(f => f.id === id);
      if (idx === -1) return null;
      const [removed] = data.splice(idx, 1);
      return removed;
    },
    reset: () => { data = MOCK_FUNCOES.map(f => ({ ...f })); },
  };
}
