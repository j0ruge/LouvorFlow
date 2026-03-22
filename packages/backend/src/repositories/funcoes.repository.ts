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

    async findByNome(nome: string) {
        return getPrisma().funcoes.findFirst({ where: { nome } });
    }

    async findByNomeExcludingId(nome: string, excludeId: string) {
        return getPrisma().funcoes.findFirst({ where: { nome, NOT: { id: excludeId } } });
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
