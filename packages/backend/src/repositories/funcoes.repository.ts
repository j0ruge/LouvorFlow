import { getPrisma } from '../../prisma/cliente.js';

class FuncoesRepository {
    async findAll() {
        return getPrisma().funcoes.findMany({
            select: { id: true, nome: true }
        });
    }

    async findById(id: string) {
        return getPrisma().funcoes.findUnique({
            where: { id },
            select: { id: true, nome: true }
        });
    }

    /**
     * Busca uma função pelo nome, ignorando caixa (maiúsculas/minúsculas).
     *
     * Usa `mode: 'insensitive'` do Prisma (decisão D7) como barreira de
     * duplicidade na aplicação — o índice único do banco
     * (`@@unique([tenant_id, nome])`) é case-sensitive no Postgres. Acentos
     * continuam distintos: `mode: 'insensitive'` normaliza caixa, não
     * diacríticos (ex.: "Violão" ≠ "Violao").
     *
     * @param nome - Nome da função.
     * @returns Função encontrada (case-insensitive) ou null.
     */
    async findByNome(nome: string) {
        return getPrisma().funcoes.findFirst({ where: { nome: { equals: nome, mode: 'insensitive' } } });
    }

    /**
     * Busca uma função pelo nome (case-insensitive), excluindo um ID
     * específico — usado para validar duplicidade em updates.
     *
     * @param nome - Nome a ser buscado.
     * @param excludeId - ID da função a ser excluída da busca.
     * @returns Função encontrada ou null.
     */
    async findByNomeExcludingId(nome: string, excludeId: string) {
        return getPrisma().funcoes.findFirst({
            where: { nome: { equals: nome, mode: 'insensitive' }, NOT: { id: excludeId } },
        });
    }

    /**
     * Cria uma nova função vinculada ao tenant.
     *
     * @param nome - Nome da função.
     * @param tenantId - UUID do tenant ativo.
     * @returns Função criada com id e nome.
     */
    async create(nome: string, tenantId: string) {
        return getPrisma().funcoes.create({
            data: { nome, tenant_id: tenantId },
            select: { id: true, nome: true }
        });
    }

    async update(id: string, nome: string) {
        return getPrisma().funcoes.update({
            where: { id },
            data: { nome },
            select: { id: true, nome: true }
        });
    }

    async delete(id: string) {
        return getPrisma().funcoes.delete({ where: { id } });
    }
}

export default new FuncoesRepository();
