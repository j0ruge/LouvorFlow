import { getPrisma } from '../../prisma/cliente.js';

/**
 * Projeção padrão de um grupo com as funções que pertencem a ele.
 * As funções vêm ordenadas por nome para exibição estável na configuração.
 */
const GRUPO_SELECT = {
    id: true,
    nome: true,
    ordem: true,
    Funcoes: {
        select: { id: true, nome: true },
        orderBy: { nome: 'asc' as const },
    },
};

/**
 * Repositório de grupos de funções.
 *
 * Todas as operações usam `getPrisma()` — o client tenant-scoped que injeta
 * `tenant_id` automaticamente, garantindo isolamento entre igrejas.
 */
class FuncoesGruposRepository {
    /**
     * Lista todos os grupos do tenant com suas funções.
     *
     * @returns Grupos ordenados por `ordem` crescente.
     */
    async findAll() {
        return getPrisma().funcoes_Grupos.findMany({
            select: GRUPO_SELECT,
            orderBy: { ordem: 'asc' },
        });
    }

    /**
     * Busca um grupo pelo ID.
     *
     * @param id - UUID do grupo.
     * @returns Grupo com suas funções, ou `null` se não existir.
     */
    async findById(id: string) {
        return getPrisma().funcoes_Grupos.findUnique({
            where: { id },
            select: GRUPO_SELECT,
        });
    }

    /**
     * Busca um grupo pelo nome exato dentro do tenant.
     *
     * @param nome - Nome do grupo.
     * @returns Grupo encontrado ou `null`.
     */
    async findByNome(nome: string) {
        return getPrisma().funcoes_Grupos.findFirst({ where: { nome } });
    }

    /**
     * Busca um grupo homônimo ignorando um ID — usado para detectar duplicidade na edição.
     *
     * @param nome - Nome do grupo.
     * @param excludeId - UUID do grupo que está sendo editado.
     * @returns Grupo conflitante ou `null`.
     */
    async findByNomeExcludingId(nome: string, excludeId: string) {
        return getPrisma().funcoes_Grupos.findFirst({
            where: { nome, NOT: { id: excludeId } },
        });
    }

    /**
     * Retorna a maior `ordem` já usada pelos grupos do tenant.
     *
     * @returns Maior ordem existente, ou `0` quando não há grupos.
     */
    async maxOrdem() {
        const resultado = await getPrisma().funcoes_Grupos.aggregate({
            _max: { ordem: true },
        });
        return resultado._max.ordem ?? 0;
    }

    /**
     * Cria um grupo vinculado ao tenant.
     *
     * @param nome - Nome do grupo.
     * @param tenantId - UUID do tenant ativo.
     * @param ordem - Posição do grupo na sequência de exibição.
     * @returns Grupo criado (sem funções vinculadas).
     */
    async create(nome: string, tenantId: string, ordem: number) {
        return getPrisma().funcoes_Grupos.create({
            data: { nome, ordem, tenant_id: tenantId },
            select: GRUPO_SELECT,
        });
    }

    /**
     * Renomeia um grupo.
     *
     * @param id - UUID do grupo.
     * @param nome - Novo nome.
     * @returns Grupo atualizado com suas funções.
     */
    async update(id: string, nome: string) {
        return getPrisma().funcoes_Grupos.update({
            where: { id },
            data: { nome },
            select: GRUPO_SELECT,
        });
    }

    /**
     * Remove um grupo. As funções vinculadas ficam sem grupo
     * (`fk_grupo` vira NULL via ON DELETE SET NULL).
     *
     * @param id - UUID do grupo.
     */
    async delete(id: string) {
        return getPrisma().funcoes_Grupos.delete({ where: { id } });
    }

    /**
     * Busca funções do tenant por uma lista de IDs — usado para validar
     * que todos os IDs recebidos existem antes de vinculá-los a um grupo.
     *
     * @param ids - UUIDs das funções.
     * @returns Apenas os IDs efetivamente encontrados no tenant.
     */
    async findFuncoesByIds(ids: string[]) {
        return getPrisma().funcoes.findMany({
            where: { id: { in: ids } },
            select: { id: true },
        });
    }

    /**
     * Reordena os grupos atribuindo posições sequenciais (1..N) conforme
     * a ordem dos IDs recebidos. Executa em transação para garantir atomicidade.
     *
     * @param gruposIds - UUIDs dos grupos na nova ordem desejada.
     */
    async reorder(gruposIds: string[]) {
        const prismaClient = getPrisma();
        await prismaClient.$transaction(
            gruposIds.map((grupoId, index) =>
                prismaClient.funcoes_Grupos.updateMany({
                    where: { id: grupoId },
                    data: { ordem: index + 1 },
                })
            )
        );
    }

    /**
     * Substitui o conjunto de funções de um grupo.
     *
     * Funções que saíram da lista ficam sem grupo; funções que entraram
     * passam a pertencer a este grupo (saindo de outro, se for o caso, já
     * que o vínculo é 1:N). Executa em transação para não deixar estado parcial.
     *
     * @param grupoId - UUID do grupo.
     * @param funcoesIds - UUIDs das funções que devem pertencer ao grupo.
     */
    async setFuncoes(grupoId: string, funcoesIds: string[]) {
        const prismaClient = getPrisma();
        await prismaClient.$transaction([
            prismaClient.funcoes.updateMany({
                where: { fk_grupo: grupoId, id: { notIn: funcoesIds } },
                data: { fk_grupo: null },
            }),
            prismaClient.funcoes.updateMany({
                where: { id: { in: funcoesIds } },
                data: { fk_grupo: grupoId },
            }),
        ]);
    }
}

export default new FuncoesGruposRepository();
