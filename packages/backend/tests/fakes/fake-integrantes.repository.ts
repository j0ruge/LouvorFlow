import { randomUUID } from 'node:crypto';
import { MOCK_INTEGRANTES, MOCK_INTEGRANTES_FUNCOES, MOCK_FUNCOES } from './mock-data.js';

/** Cria fake repository para Integrantes com dados em memória. */
export function createFakeIntegrantesRepository() {
  let data = MOCK_INTEGRANTES.map(i => ({ ...i }));
  let funcoes = MOCK_INTEGRANTES_FUNCOES.map(f => ({ ...f }));

  /** Constrói representação de integrante com funções associadas (simula select com join). */
  const buildWithFuncoes = (integrante: typeof data[0]) => ({
    id: integrante.id,
    nome: integrante.nome,
    email: integrante.email,
    telefone: integrante.telefone,
    Integrantes_Funcoes: funcoes
      .filter(f => f.fk_integrante_id === integrante.id)
      .map(f => {
        const funcao = MOCK_FUNCOES.find(fn => fn.id === f.funcao_id)!;
        return {
          integrantes_funcoes_funcao_id_fkey: { id: funcao.id, nome: funcao.nome },
        };
      }),
  });

  /** Constrói representação pública de integrante (sem senha). */
  const buildPublic = (integrante: typeof data[0]) => ({
    id: integrante.id,
    nome: integrante.nome,
    email: integrante.email,
    telefone: integrante.telefone,
  });

  return {
    findAll: async () => data.map(buildWithFuncoes),

    findById: async (id: string) => {
      const integrante = data.find(i => i.id === id);
      return integrante ? buildWithFuncoes(integrante) : null;
    },

    findByIdSimple: async (id: string) => data.find(i => i.id === id) ?? null,

    findByIdPublic: async (id: string) => {
      const integrante = data.find(i => i.id === id);
      return integrante ? buildPublic(integrante) : null;
    },

    /**
     * Busca um integrante pelo email no array em memória.
     *
     * @param email - Email a buscar
     * @returns Integrante encontrado ou `null`
     */
    findByEmail: async (email: string) => data.find(i => i.email === email) ?? null,

    /**
     * Busca um integrante pelo email, excluindo um ID específico.
     *
     * @param email - Email a verificar
     * @param excludeId - ID do integrante a excluir da busca
     * @returns Integrante encontrado ou `null`
     */
    findByEmailExcludingId: async (email: string, excludeId: string) =>
      data.find(i => i.email === email && i.id !== excludeId) ?? null,

    create: async (input: { nome: string; email: string; senha: string; telefone: string | null }) => {
      const integrante = { id: randomUUID(), ...input };
      data.push(integrante);
      return buildPublic(integrante);
    },

    update: async (id: string, updateData: Record<string, unknown>) => {
      const integrante = data.find(i => i.id === id);
      if (!integrante) return null;
      Object.assign(integrante, updateData);
      return buildPublic(integrante);
    },

    delete: async (id: string) => {
      const idx = data.findIndex(i => i.id === id);
      if (idx === -1) return undefined;
      const [removed] = data.splice(idx, 1);
      return removed;
    },
    findFuncoesByIntegranteId: async (integranteId: string) =>
      funcoes
        .filter(f => f.fk_integrante_id === integranteId)
        .map(f => {
          const funcao = MOCK_FUNCOES.find(fn => fn.id === f.funcao_id)!;
          return {
            integrantes_funcoes_funcao_id_fkey: { id: funcao.id, nome: funcao.nome },
          };
        }),

    /**
     * Busca uma associação integrante-função pelo par de IDs.
     *
     * @param fk_integrante_id - UUID do integrante.
     * @param funcao_id - UUID da função.
     * @returns Registro da associação ou `null` se não encontrado.
     */
    findIntegranteFuncao: async (fk_integrante_id: string, funcao_id: string) =>
      funcoes.find(f => f.fk_integrante_id === fk_integrante_id && f.funcao_id === funcao_id) ?? null,

    /**
     * Cria uma associação entre integrante e função no array em memória.
     *
     * @param fk_integrante_id - UUID do integrante.
     * @param funcao_id - UUID da função a associar.
     * @returns Registro criado com id gerado.
     */
    createIntegranteFuncao: async (fk_integrante_id: string, funcao_id: string) => {
      const record = { id: randomUUID(), fk_integrante_id, funcao_id };
      funcoes.push(record);
      return record;
    },

    deleteIntegranteFuncao: async (id: string) => {
      const idx = funcoes.findIndex(f => f.id === id);
      if (idx === -1) return undefined;
      const [removed] = funcoes.splice(idx, 1);
      return removed;
    },
    findFuncaoById: async (funcao_id: string) =>
      MOCK_FUNCOES.find(f => f.id === funcao_id) ?? null,

    reset: () => {
      data = MOCK_INTEGRANTES.map(i => ({ ...i }));
      funcoes = MOCK_INTEGRANTES_FUNCOES.map(f => ({ ...f }));
    },
  };
}
