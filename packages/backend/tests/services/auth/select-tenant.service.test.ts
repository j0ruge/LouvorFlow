/**
 * Testes unitários do serviço de seleção de tenant no fluxo multi-tenant.
 *
 * Valida os cenários de seleção com selection_token válido, token inválido,
 * purpose incorreto, usuário sem vínculo com o tenant, e tenant inativo.
 */

import { AppError } from '../../../src/errors/AppError.js';
import { TENANT_A_ID, TENANT_B_ID, MOCK_TENANTS, MOCK_TENANT_USERS, MOCK_INTEGRANTES } from '../../fakes/mock-data.js';

import fakeTokenProvider from '../../fakes/auth/fake-token.provider.js';
import fakeRefreshTokensRepo from '../../fakes/auth/fake-refresh-tokens.repository.js';
import fakeDateProvider from '../../fakes/auth/fake-date.provider.js';

/** Mock in-memory dos tenants e tenant_users para este teste. */
const mockTenants = MOCK_TENANTS.map(t => ({ ...t, created_at: new Date(), updated_at: new Date() }));
const mockTenantUsers = MOCK_TENANT_USERS.map(tu => ({ ...tu, created_at: new Date(), updated_at: new Date() }));

/**
 * Mock do módulo Prisma para retornar dados in-memory de tenants e users.
 * Simula `prisma.users.findUnique`, `prisma.tenantUsers.findFirst` e `prisma.tenant.findUnique`.
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
        SYSTEM_TENANT_ID: '00000000-0000-0000-0000-000000000000',
        default: {
            users: {
                findUnique: vi.fn().mockResolvedValue(mockUser),
            },
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
        },
    };
});

vi.mock('../../../src/providers/token.provider.js', async () => {
    const fake = await import('../../fakes/auth/fake-token.provider.js');
    return { default: fake.default };
});

vi.mock('../../../src/repositories/auth/refresh-tokens.repository.js', async () => {
    const fake = await import('../../fakes/auth/fake-refresh-tokens.repository.js');
    return { default: fake.default };
});

vi.mock('../../../src/providers/date.provider.js', async () => {
    const fake = await import('../../fakes/auth/fake-date.provider.js');
    return { default: fake.default };
});

/**
 * Mock do AuthenticateUserService para controlar o retorno de _generateSession.
 * Retorna uma resposta de sessão sintética sem dependência de banco real.
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

const { default: selectTenantService } = await import(
    '../../../src/services/auth/select-tenant.service.js'
);

/** @group SelectTenantService */
describe('SelectTenantService', () => {
    /** ID do usuário do João (vinculado a TENANT_A e TENANT_B na mock-data). */
    const userId = MOCK_INTEGRANTES[0].id;

    /** Reinicia fake providers antes de cada teste para isolamento. */
    beforeEach(() => {
        fakeTokenProvider.reset();
        fakeRefreshTokensRepo.reset();
    });

    /** Deve completar o fluxo de seleção com selection_token e tenant_id válidos. */
    it('deve retornar sessão completa para seleção válida de tenant', async () => {
        const selectionToken = fakeTokenProvider.sign(
            { purpose: 'tenant_selection', jti: 'sel-jti-valido' },
            'any-secret',
            { subject: userId, expiresIn: '5m' },
        );

        const result = await selectTenantService.execute({
            selection_token: selectionToken,
            tenant_id: TENANT_A_ID,
        });

        expect(result).toHaveProperty('user');
        expect(result).toHaveProperty('token');
        expect(result).toHaveProperty('refresh_token');
    });

    /** Deve lançar AppError 401 quando o selection_token é inválido (formato errado). */
    it('deve lançar erro 401 para selection_token inválido', async () => {
        await expect(
            selectTenantService.execute({
                selection_token: 'token-invalido',
                tenant_id: TENANT_A_ID,
            }),
        ).rejects.toMatchObject({
            message: 'Token de seleção inválido ou expirado',
            statusCode: 401,
        });
    });

    /** Deve lançar AppError 401 quando o payload do token não tem purpose correto. */
    it('deve lançar erro 401 para token sem purpose tenant_selection', async () => {
        const tokenSemPurpose = fakeTokenProvider.sign(
            { purpose: 'outro_purpose' },
            'any-secret',
            { subject: userId, expiresIn: '5m' },
        );

        await expect(
            selectTenantService.execute({
                selection_token: tokenSemPurpose,
                tenant_id: TENANT_A_ID,
            }),
        ).rejects.toMatchObject({
            message: 'Token de seleção inválido ou expirado',
            statusCode: 401,
        });
    });

    /** Deve lançar AppError 403 quando o usuário não está vinculado ao tenant solicitado. */
    it('deve lançar erro 403 quando usuário não está vinculado ao tenant', async () => {
        // userId do Pedro (MOCK_INTEGRANTES[2]) está em TENANT_B mas não em TENANT_A conforme mock-data
        // Usamos TENANT_B_ID para o segundo usuário que só está vinculado a TENANT_A
        const userId2 = MOCK_INTEGRANTES[1].id; // Maria — vinculada apenas a TENANT_A

        const prismaModule = await import('../../../prisma/cliente.js');
        const prismaMock = prismaModule.default as any;
        // Força retorno de null para simular ausência de vínculo
        prismaMock.tenantUsers.findFirst.mockResolvedValueOnce(null);

        const selectionToken = fakeTokenProvider.sign(
            { purpose: 'tenant_selection' },
            'any-secret',
            { subject: userId, expiresIn: '5m' },
        );

        await expect(
            selectTenantService.execute({
                selection_token: selectionToken,
                tenant_id: TENANT_B_ID,
            }),
        ).rejects.toMatchObject({
            message: 'Usuário não vinculado a esta igreja',
            statusCode: 403,
        });
    });

    /** Deve lançar AppError 400 quando o tenant não está ativo. */
    it('deve lançar erro 400 para tenant inativo', async () => {
        const prismaModule = await import('../../../prisma/cliente.js');
        const prismaMock = prismaModule.default as any;
        // Retorna um vínculo válido mas tenant inativo
        prismaMock.tenantUsers.findFirst.mockResolvedValueOnce({ id: 'any', tenant_id: TENANT_A_ID, user_id: userId });
        prismaMock.tenant.findUnique.mockResolvedValueOnce({ id: TENANT_A_ID, name: 'Igreja A', status: 'inactive' });

        const selectionToken = fakeTokenProvider.sign(
            { purpose: 'tenant_selection' },
            'any-secret',
            { subject: userId, expiresIn: '5m' },
        );

        await expect(
            selectTenantService.execute({
                selection_token: selectionToken,
                tenant_id: TENANT_A_ID,
            }),
        ).rejects.toMatchObject({
            message: 'Igreja não está ativa',
            statusCode: 400,
        });
    });
});
