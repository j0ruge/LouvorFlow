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

    /**
     * Busca um tipo de evento pelo nome, ignorando caixa (maiúsculas/minúsculas).
     *
     * Usa `mode: 'insensitive'` do Prisma (decisão D7) como barreira de
     * duplicidade na aplicação — o índice único do banco
     * (`@@unique([tenant_id, nome])`) é case-sensitive no Postgres. Acentos
     * continuam distintos: `mode: 'insensitive'` normaliza caixa, não
     * diacríticos (ex.: "Vigília" ≠ "Vigilia").
     *
     * @param nome - Nome do tipo de evento.
     * @returns Tipo de evento encontrado (case-insensitive) ou null.
     */
    async findByNome(nome: string) {
        return getPrisma().tipos_Eventos.findFirst({ where: { nome: { equals: nome, mode: 'insensitive' } } });
    }

    /**
     * Busca um tipo de evento pelo nome (case-insensitive), excluindo um ID
     * específico — usado para validar duplicidade em updates.
     *
     * @param nome - Nome a ser buscado.
     * @param excludeId - ID do tipo de evento a ser excluído da busca.
     * @returns Tipo de evento encontrado ou null.
     */
    async findByNomeExcludingId(nome: string, excludeId: string) {
        return getPrisma().tipos_Eventos.findFirst({
            where: { nome: { equals: nome, mode: 'insensitive' }, NOT: { id: excludeId } },
        });
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
