import { getPrisma } from '../../prisma/cliente.js';

class TonalidadesRepository {
    async findAll() {
        return getPrisma().tonalidades.findMany({
            select: { id: true, tom: true }
        });
    }

    async findById(id: string) {
        return getPrisma().tonalidades.findUnique({
            where: { id },
            select: { id: true, tom: true }
        });
    }

    /**
     * Busca uma tonalidade pelo tom, ignorando caixa (maiúsculas/minúsculas).
     *
     * Usa `mode: 'insensitive'` do Prisma (decisão D7) como barreira de
     * duplicidade na aplicação — o índice único do banco
     * (`@@unique([tenant_id, tom])`) é case-sensitive no Postgres. Acentos
     * continuam distintos: `mode: 'insensitive'` normaliza caixa, não
     * diacríticos.
     *
     * @param tom - Tom da tonalidade.
     * @returns Tonalidade encontrada (case-insensitive) ou null.
     */
    async findByTom(tom: string) {
        return getPrisma().tonalidades.findFirst({ where: { tom: { equals: tom, mode: 'insensitive' } } });
    }

    /**
     * Busca uma tonalidade pelo tom (case-insensitive), excluindo um ID
     * específico — usado para validar duplicidade em updates.
     *
     * @param tom - Tom a ser buscado.
     * @param excludeId - ID da tonalidade a ser excluída da busca.
     * @returns Tonalidade encontrada ou null.
     */
    async findByTomExcludingId(tom: string, excludeId: string) {
        return getPrisma().tonalidades.findFirst({
            where: { tom: { equals: tom, mode: 'insensitive' }, NOT: { id: excludeId } },
        });
    }

    /**
     * Cria uma nova tonalidade vinculada ao tenant.
     *
     * @param tom - Tom da tonalidade.
     * @param tenantId - UUID do tenant ativo.
     * @returns Tonalidade criada com id e tom.
     */
    async create(tom: string, tenantId: string) {
        return getPrisma().tonalidades.create({
            data: { tom, tenant_id: tenantId },
            select: { id: true, tom: true }
        });
    }

    async update(id: string, tom: string) {
        return getPrisma().tonalidades.update({
            where: { id },
            data: { tom },
            select: { id: true, tom: true }
        });
    }

    async delete(id: string) {
        return getPrisma().tonalidades.delete({ where: { id } });
    }
}

export default new TonalidadesRepository();
