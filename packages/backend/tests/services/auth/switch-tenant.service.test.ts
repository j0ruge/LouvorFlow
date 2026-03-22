/**
 * Testes unitários do serviço de troca de tenant sem re-login.
 *
 * Valida os cenários de troca bem-sucedida, usuário não vinculado ao tenant,
 * tenant inexistente e tenant inativo.
 */

import { TENANT_A_ID, TENANT_B_ID, MOCK_TENANTS, MOCK_TENANT_USERS, MOCK_INTEGRANTES } from '../../fakes/mock-data.js';

/** Dados in-memory de tenants e vínculos para controle nos testes. */
const mockTenants = MOCK_TENANTS.map(t => ({ ...t, created_at: new Date(), updated_at: new Date() }));
const mockTenantUsers = MOCK_TENANT_USERS.map(tu => ({ ...tu, created_at: new Date(), updated_at: new Date() }));

/**
 * Mock do módulo Prisma para simular consultas de troca de tenant.
 * `tenantUsers.findFirst` verifica vínculo, `tenant.findUnique` valida status,
 * `users.findUnique` retorna o usuário completo com roles e permissões.
 */
vi.mock('../../../prisma/cliente.js', async () => {
    const mockUser = {
        ...MOCK_INTEGRANTES[0],
        avatar: null,
        created_at: new Date(),
        updated_at: new Date(),
        roles: [],
        permissions: [],
    };

    return {
        default: {
            tenantUsers: {
                findFirst: vi.fn().mockImplementation(({ where }: { where: { user_id: string; tenant_id: string } }) => {
                    const found = mockTenantUsers.find(
                        tu => tu.user_id === where.user_id && tu.tenant_id === where.tenant_id,
                    );
                    return Promise.resolve(found ?? null);
                }),
            },
            tenant: {
                findUnique: vi.fn().mockImplementation(({ where }: { where: { id: string } }) => {
                    const found = mockTenants.find(t => t.id === where.id);
                    return Promise.resolve(found ?? null);
                }),
            },
            users: {
                findUnique: vi.fn().mockResolvedValue(mockUser),
            },
        },
    };
});

/**
 * Mock do AuthenticateUserService para controlar o retorno de `_generateSession`.
 * Retorna uma sessão sintética sem dependência de banco real.
 */
vi.mock('../../../src/services/auth/authenticate-user.service.js', () => ({
    default: {
        _generateSession: vi.fn().mockImplementation(
            (user: { id: string; email: string }, tenant: { id: string; name: string }) =>
                Promise.resolve({
                    user: { id: user.id, email: user.email, tenant: { id: tenant.id, name: tenant.name } },
                    token: `fake-access-token-${user.id}`,
                    refresh_token: `fake-refresh-token-${user.id}`,
                }),
        ),
    },
}));

const { default: switchTenantService } = await import(
    '../../../src/services/auth/switch-tenant.service.js'
);

/** @group SwitchTenantService */
describe('SwitchTenantService', () => {
    /** UUID do João (MOCK_INTEGRANTES[0]) — vinculado a TENANT_A e TENANT_B. */
    const userId = MOCK_INTEGRANTES[0].id;

    /** Reinicia os mocks do Prisma antes de cada teste para isolamento. */
    beforeEach(async () => {
        const prismaModule = await import('../../../prisma/cliente.js');
        const prismaMock = prismaModule.default as any;

        prismaMock.tenantUsers.findFirst.mockImplementation(({ where }: { where: { user_id: string; tenant_id: string } }) => {
            const found = mockTenantUsers.find(
                tu => tu.user_id === where.user_id && tu.tenant_id === where.tenant_id,
            );
            return Promise.resolve(found ?? null);
        });

        prismaMock.tenant.findUnique.mockImplementation(({ where }: { where: { id: string } }) => {
            const found = mockTenants.find(t => t.id === where.id);
            return Promise.resolve(found ?? null);
        });

        prismaMock.users.findUnique.mockResolvedValue({
            ...MOCK_INTEGRANTES[0],
            avatar: null,
            created_at: new Date(),
            updated_at: new Date(),
            roles: [],
            permissions: [],
        });
    });

    /**
     * Deve retornar sessão completa quando o usuário está vinculado ao tenant ativo.
     */
    it('deve retornar sessão completa para troca válida de tenant', async () => {
        const result = await switchTenantService.execute({
            userId,
            tenant_id: TENANT_A_ID,
        });

        expect(result).toHaveProperty('user');
        expect(result).toHaveProperty('token');
        expect(result).toHaveProperty('refresh_token');
    });

    /**
     * Deve lançar AppError 403 quando o usuário não está vinculado ao tenant de destino.
     */
    it('deve lançar erro 403 quando usuário não está vinculado ao tenant', async () => {
        const prismaModule = await import('../../../prisma/cliente.js');
        const prismaMock = prismaModule.default as any;
        prismaMock.tenantUsers.findFirst.mockResolvedValueOnce(null);

        await expect(
            switchTenantService.execute({ userId, tenant_id: TENANT_A_ID }),
        ).rejects.toMatchObject({
            message: 'Usuário não vinculado a esta igreja',
            statusCode: 403,
        });
    });

    /**
     * Deve lançar AppError 404 quando o tenant de destino não existe.
     */
    it('deve lançar erro 404 quando o tenant não existe', async () => {
        const prismaModule = await import('../../../prisma/cliente.js');
        const prismaMock = prismaModule.default as any;
        prismaMock.tenantUsers.findFirst.mockResolvedValueOnce({ id: 'any', tenant_id: TENANT_A_ID, user_id: userId });
        prismaMock.tenant.findUnique.mockResolvedValueOnce(null);

        await expect(
            switchTenantService.execute({ userId, tenant_id: TENANT_A_ID }),
        ).rejects.toMatchObject({
            message: 'Igreja não encontrada',
            statusCode: 404,
        });
    });

    /**
     * Deve lançar AppError 400 quando o tenant existe mas está inativo.
     */
    it('deve lançar erro 400 quando o tenant não está ativo', async () => {
        const prismaModule = await import('../../../prisma/cliente.js');
        const prismaMock = prismaModule.default as any;
        prismaMock.tenantUsers.findFirst.mockResolvedValueOnce({ id: 'any', tenant_id: TENANT_B_ID, user_id: userId });
        prismaMock.tenant.findUnique.mockResolvedValueOnce({ id: TENANT_B_ID, name: 'Igreja Norte', status: 'inactive' });

        await expect(
            switchTenantService.execute({ userId, tenant_id: TENANT_B_ID }),
        ).rejects.toMatchObject({
            message: 'Igreja não está ativa',
            statusCode: 400,
        });
    });
});
