import { randomUUID } from 'node:crypto';
import { MOCK_INTEGRANTES, MOCK_INTEGRANTES_FUNCOES, MOCK_FUNCOES } from './mock-data.js';

/**
 * Cria fake repository para integrantes (opera sobre Users) com dados em memória.
 * Após a unificação, campos usam naming do model Users (name, password).
 */
export function createFakeIntegrantesRepository() {
  let data = MOCK_INTEGRANTES.map(i => ({ ...i }));
  let funcoes = MOCK_INTEGRANTES_FUNCOES.map(f => ({ ...f }));

  /** Constrói representação de user com funções musicais (simula select com join). */
  const buildWithFuncoes = (user: typeof data[0]) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    telefone: user.telefone,
    Users_Funcoes: funcoes
      .filter(f => f.fk_user_id === user.id)
      .map(f => {
        const funcao = MOCK_FUNCOES.find(fn => fn.id === f.funcao_id)!;
        return {
          users_funcoes_funcao_id_fkey: { id: funcao.id, nome: funcao.nome },
        };
      }),
  });

  /** Constrói representação pública de user (sem password). */
  const buildPublic = (user: typeof data[0]) => ({
    id: user.id,
    name: user.name,
    email: user.email,
    telefone: user.telefone,
  });

  return {
    findAll: async () => data.map(buildWithFuncoes),

    findById: async (id: string) => {
      const user = data.find(i => i.id === id);
      return user ? buildWithFuncoes(user) : null;
    },

    findByIdSimple: async (id: string) => data.find(i => i.id === id) ?? null,

    findByIdPublic: async (id: string) => {
      const user = data.find(i => i.id === id);
      return user ? buildPublic(user) : null;
    },

    /**
     * Busca um user pelo email no array em memória.
     *
     * @param email - Email a buscar
     * @returns User encontrado ou `null`
     */
    findByEmail: async (email: string) => data.find(i => i.email === email) ?? null,

    /**
     * Busca um user pelo email, excluindo um ID específico.
     *
     * @param email - Email a verificar
     * @param excludeId - ID do user a excluir da busca
     * @returns User encontrado ou `null`
     */
    findByEmailExcludingId: async (email: string, excludeId: string) =>
      data.find(i => i.email === email && i.id !== excludeId) ?? null,

    create: async (input: { name: string; email: string; password: string; telefone?: string | null }) => {
      const user = { id: randomUUID(), ...input, telefone: input.telefone ?? null };
      data.push(user);
      return buildPublic(user);
    },

    update: async (id: string, updateData: Record<string, unknown>) => {
      const user = data.find(i => i.id === id);
      if (!user) return null;
      Object.assign(user, updateData);
      return buildPublic(user);
    },

    delete: async (id: string) => {
      const idx = data.findIndex(i => i.id === id);
      if (idx === -1) return undefined;
      const [removed] = data.splice(idx, 1);
      return removed;
    },

    findFuncoesByIntegranteId: async (userId: string) =>
      funcoes
        .filter(f => f.fk_user_id === userId)
        .map(f => {
          const funcao = MOCK_FUNCOES.find(fn => fn.id === f.funcao_id)!;
          return {
            users_funcoes_funcao_id_fkey: { id: funcao.id, nome: funcao.nome },
          };
        }),

    /**
     * Busca uma associação user-função pelo par de IDs.
     *
     * @param fk_user_id - UUID do user.
     * @param funcao_id - UUID da função.
     * @returns Registro da associação ou `null` se não encontrado.
     */
    findIntegranteFuncao: async (fk_user_id: string, funcao_id: string) =>
      funcoes.find(f => f.fk_user_id === fk_user_id && f.funcao_id === funcao_id) ?? null,

    /**
     * Cria uma associação entre user e função no array em memória.
     *
     * @param fk_user_id - UUID do user.
     * @param funcao_id - UUID da função a associar.
     * @returns Registro criado com id gerado.
     */
    createIntegranteFuncao: async (fk_user_id: string, funcao_id: string) => {
      const record = { id: randomUUID(), fk_user_id, funcao_id };
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
