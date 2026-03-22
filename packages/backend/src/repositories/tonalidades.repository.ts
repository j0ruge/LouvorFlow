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

    async findByTom(tom: string) {
        return getPrisma().tonalidades.findFirst({ where: { tom } });
    }

    async findByTomExcludingId(tom: string, excludeId: string) {
        return getPrisma().tonalidades.findFirst({ where: { tom, NOT: { id: excludeId } } });
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
