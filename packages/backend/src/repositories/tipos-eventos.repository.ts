import { getPrisma } from '../../prisma/cliente.js';

class TiposEventosRepository {
    async findAll() {
        return getPrisma().tipos_Eventos.findMany({
            select: { id: true, nome: true }
        });
    }

    async findById(id: string) {
        return getPrisma().tipos_Eventos.findUnique({
            where: { id },
            select: { id: true, nome: true }
        });
    }

    async findByNome(nome: string) {
        return getPrisma().tipos_Eventos.findFirst({ where: { nome } });
    }

    async findByNomeExcludingId(nome: string, excludeId: string) {
        return getPrisma().tipos_Eventos.findFirst({ where: { nome, NOT: { id: excludeId } } });
    }

    /**
     * Cria um novo tipo de evento vinculado ao tenant.
     *
     * @param nome - Nome do tipo de evento.
     * @param tenantId - UUID do tenant ativo.
     * @returns Tipo de evento criado com id e nome.
     */
    async create(nome: string, tenantId: string) {
        return getPrisma().tipos_Eventos.create({
            data: { nome, tenant_id: tenantId },
            select: { id: true, nome: true }
        });
    }

    async update(id: string, nome: string) {
        return getPrisma().tipos_Eventos.update({
            where: { id },
            data: { nome },
            select: { id: true, nome: true }
        });
    }

    async delete(id: string) {
        return getPrisma().tipos_Eventos.delete({ where: { id } });
    }
}

export default new TiposEventosRepository();
