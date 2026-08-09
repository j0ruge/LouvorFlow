/**
 * Repositório fake de Grupos de Funções, com dados em memória baseados em
 * MOCK_FUNCOES_GRUPOS e MOCK_FUNCOES.
 *
 * Reproduz o comportamento relevante do repositório real: ordenação por
 * `ordem`, funções ordenadas por nome e o vínculo 1:N entre função e grupo
 * (atribuir uma função a um grupo a remove do grupo anterior).
 */
import { randomUUID } from 'node:crypto';
import { MOCK_FUNCOES, MOCK_FUNCOES_GRUPOS } from './mock-data.js';

/** Formato de um grupo em memória, espelhando a projeção do Prisma. */
type GrupoFake = {
    id: string;
    nome: string;
    ordem: number;
    Funcoes: { id: string; nome: string }[];
};

/**
 * Clona um grupo em profundidade para que mutações no fake não vazem
 * para os dados mock compartilhados entre suítes.
 *
 * @param grupo - Grupo a clonar.
 * @returns Cópia independente do grupo.
 */
function cloneGrupo(grupo: GrupoFake): GrupoFake {
    return { ...grupo, Funcoes: grupo.Funcoes.map(f => ({ ...f })) };
}

/**
 * Cria fake repository para Funcoes_Grupos com dados em memória.
 *
 * @returns Repositório fake com as operações usadas pelo service
 * (findAll, findById, findByNome, findByNomeExcludingId, maxOrdem, create,
 * update, delete, findFuncoesByIds, reorder, setFuncoes) e helper de reset.
 */
export function createFakeFuncoesGruposRepository() {
    let data: GrupoFake[] = MOCK_FUNCOES_GRUPOS.map(cloneGrupo);
    const funcoes = MOCK_FUNCOES.map(f => ({ ...f }));

    return {
        findAll: async () =>
            [...data].sort((a, b) => a.ordem - b.ordem).map(cloneGrupo),

        findById: async (id: string) => {
            const grupo = data.find(g => g.id === id);
            return grupo ? cloneGrupo(grupo) : null;
        },

        findByNome: async (nome: string) => data.find(g => g.nome === nome) ?? null,

        findByNomeExcludingId: async (nome: string, excludeId: string) =>
            data.find(g => g.nome === nome && g.id !== excludeId) ?? null,

        maxOrdem: async () => data.reduce((max, g) => Math.max(max, g.ordem), 0),

        create: async (nome: string, _tenantId: string, ordem: number) => {
            const grupo: GrupoFake = { id: randomUUID(), nome, ordem, Funcoes: [] };
            data.push(grupo);
            return cloneGrupo(grupo);
        },

        update: async (id: string, nome: string) => {
            const grupo = data.find(g => g.id === id);
            if (!grupo) return null;
            grupo.nome = nome;
            return cloneGrupo(grupo);
        },

        delete: async (id: string) => {
            const idx = data.findIndex(g => g.id === id);
            if (idx === -1) return null;
            const [removido] = data.splice(idx, 1);
            return removido;
        },

        findFuncoesByIds: async (ids: string[]) =>
            funcoes.filter(f => ids.includes(f.id)).map(f => ({ id: f.id })),

        reorder: async (gruposIds: string[]) => {
            gruposIds.forEach((id, index) => {
                const grupo = data.find(g => g.id === id);
                if (grupo) grupo.ordem = index + 1;
            });
        },

        setFuncoes: async (grupoId: string, funcoesIds: string[]) => {
            // Vínculo 1:N — a função sai de qualquer outro grupo ao entrar neste.
            data.forEach(g => {
                g.Funcoes = g.Funcoes.filter(f => !funcoesIds.includes(f.id));
            });
            const grupo = data.find(g => g.id === grupoId);
            if (!grupo) return;
            grupo.Funcoes = funcoesIds
                .map(id => funcoes.find(f => f.id === id))
                .filter((f): f is { id: string; nome: string } => Boolean(f))
                .map(f => ({ ...f }))
                .sort((a, b) => a.nome.localeCompare(b.nome));
        },

        reset: () => { data = MOCK_FUNCOES_GRUPOS.map(cloneGrupo); },
    };
}
