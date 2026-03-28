/**
 * Repositório Prisma para operações de persistência de tokens de convite.
 *
 * Encapsula todas as queries relacionadas ao model `InviteTokens`,
 * gerenciando criação, busca, listagem, uso e revogação de convites.
 */
import prisma from '../../prisma/cliente.js';

class ConvitesRepository {
    /**
     * Cria um novo token de convite para o tenant.
     * O UUID do token é gerado automaticamente pelo `@default(uuid())` do Prisma.
     *
     * @param tenantId - UUID do tenant que receberá o convite
     * @param createdBy - UUID do usuário (líder) que gerou o convite
     * @param expiresAt - Data/hora de expiração do convite
     * @returns Registro de invite token criado
     */
    async create(tenantId: string, createdBy: string, expiresAt: Date) {
        return prisma.inviteTokens.create({
            data: {
                tenant_id: tenantId,
                created_by: createdBy,
                expires_at: expiresAt,
            },
        });
    }

    /**
     * Busca um token de convite pelo valor do token UUID,
     * incluindo relações com tenant e criador.
     *
     * @param token - UUID do token de convite
     * @returns Registro com tenant e creator incluídos ou `null` se não encontrado
     */
    async findByToken(token: string) {
        return prisma.inviteTokens.findFirst({
            where: { token },
            include: {
                tenant: { select: { id: true, name: true } },
                creator: { select: { id: true, name: true } },
                user: { select: { id: true, name: true } },
            },
        });
    }

    /**
     * Lista todos os convites de um tenant, incluindo criador e usuário que aceitou.
     *
     * @param tenantId - UUID do tenant
     * @returns Lista de convites com relações
     */
    async findAllByTenantId(tenantId: string) {
        return prisma.inviteTokens.findMany({
            where: { tenant_id: tenantId },
            include: {
                creator: { select: { id: true, name: true } },
                user: { select: { id: true, name: true } },
            },
            orderBy: { created_at: 'desc' },
        });
    }

    /**
     * Busca um convite pelo ID do registro.
     *
     * @param id - UUID do registro de invite token
     * @returns Registro ou `null` se não encontrado
     */
    async findById(id: string) {
        return prisma.inviteTokens.findUnique({
            where: { id },
        });
    }

    /**
     * Marca um convite como utilizado, registrando quem aceitou e quando.
     *
     * @param id - UUID do registro de invite token
     * @param usedBy - UUID do usuário que aceitou o convite
     * @returns Registro atualizado
     */
    async markAsUsed(id: string, usedBy: string) {
        return prisma.inviteTokens.update({
            where: { id },
            data: {
                used_at: new Date(),
                used_by: usedBy,
            },
        });
    }

    /**
     * Marca um convite como revogado pelo líder.
     *
     * @param id - UUID do registro de invite token
     * @returns Registro atualizado
     */
    async revokeById(id: string) {
        return prisma.inviteTokens.update({
            where: { id },
            data: {
                revoked_at: new Date(),
            },
        });
    }
}

export default new ConvitesRepository();
