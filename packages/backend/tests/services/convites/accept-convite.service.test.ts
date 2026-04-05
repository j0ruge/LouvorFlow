/**
 * Testes unitários do serviço AcceptInviteService.
 *
 * Valida o fluxo completo de aceitação de convite: criação de conta nova,
 * vinculação de conta existente com verificação de senha, e cenários de erro
 * (token inválido, e-mail duplicado no tenant, senha incorreta).
 */

import fakeConvitesRepository from '../../fakes/fake-convites.repository.js';
import {
    TENANT_A_ID,
    MOCK_INVITE_ACTIVE,
    MOCK_INVITE_EXPIRED,
    MOCK_INVITE_USED,
    MOCK_INVITE_REVOKED,
} from '../../fakes/mock-data.js';

/** Mocks hoisted para uso nas factories de vi.mock. */
const {
    mockFindByEmail,
    mockHash,
    mockCompare,
    mockTenantUsersFindUnique,
    mockTenantUsersCreate,
    mockUsersFindUnique,
    mockUsersCreate,
    mockInviteTokensUpdate,
    mockInviteTokensUpdateMany,
} = vi.hoisted(() => ({
    mockFindByEmail: vi.fn(),
    mockHash: vi.fn().mockResolvedValue('hashed-password'),
    mockCompare: vi.fn(),
    mockTenantUsersFindUnique: vi.fn(),
    mockTenantUsersCreate: vi.fn(),
    mockUsersFindUnique: vi.fn(),
    mockUsersCreate: vi.fn(),
    mockInviteTokensUpdate: vi.fn(),
    mockInviteTokensUpdateMany: vi.fn().mockResolvedValue({ count: 1 }),
}));

vi.mock('../../../src/repositories/convites.repository.js', async () => {
    const fake = await import('../../fakes/fake-convites.repository.js');
    return { default: fake.default };
});

vi.mock('../../../src/repositories/integrantes.repository.js', () => ({
    default: { findByEmail: mockFindByEmail },
}));

vi.mock('bcryptjs', () => ({
    default: {
        hash: (...args: unknown[]) => mockHash(...args),
        compare: (...args: unknown[]) => mockCompare(...args),
    },
}));

vi.mock('../../../prisma/cliente.js', () => ({
    default: {
        tenantUsers: {
            findUnique: (...args: unknown[]) => mockTenantUsersFindUnique(...args),
            create: (...args: unknown[]) => mockTenantUsersCreate(...args),
        },
        users: {
            findUnique: (...args: unknown[]) => mockUsersFindUnique(...args),
            create: (...args: unknown[]) => mockUsersCreate(...args),
        },
        inviteTokens: {
            update: (...args: unknown[]) => mockInviteTokensUpdate(...args),
            findUnique: vi.fn().mockResolvedValue({ used_at: null, revoked_at: null }),
        },
        $transaction: vi.fn().mockImplementation(async (fn: Function) => {
            const tx = {
                tenantUsers: {
                    findUnique: (...args: unknown[]) => mockTenantUsersFindUnique(...args),
                    create: (...args: unknown[]) => mockTenantUsersCreate(...args),
                },
                users: { create: (...args: unknown[]) => mockUsersCreate(...args) },
                inviteTokens: {
                    update: (...args: unknown[]) => mockInviteTokensUpdate(...args),
                    updateMany: (...args: unknown[]) => mockInviteTokensUpdateMany(...args),
                    findUnique: vi.fn().mockResolvedValue({ used_at: null, revoked_at: null }),
                },
            };
            return fn(tx);
        }),
    },
}));

import service from '../../../src/services/convites/accept-convite.service.js';

describe('AcceptInviteService', () => {
    /** Reinicia repositório e mocks antes de cada teste. */
    beforeEach(() => {
        fakeConvitesRepository.reset();
        vi.clearAllMocks();
        mockFindByEmail.mockResolvedValue(null);
        mockUsersCreate.mockResolvedValue({ id: 'new-user-id', name: 'Maria', email: 'maria@test.com' });
        mockTenantUsersCreate.mockResolvedValue({});
        mockInviteTokensUpdate.mockResolvedValue({});
    });

    const validInput = {
        nome: 'Maria Silva',
        email: 'maria@test.com',
        senha: 'senha123',
        senha_confirmacao: 'senha123',
    };

    /** Verifica que novo usuário é criado e vinculado ao tenant (201). */
    it('deve criar conta nova e retornar 201', async () => {
        fakeConvitesRepository.seed([MOCK_INVITE_ACTIVE]);

        const result = await service.execute(MOCK_INVITE_ACTIVE.token, validInput);

        expect(result.statusCode).toBe(201);
        expect(result.msg).toContain('Conta criada');
        expect(mockHash).toHaveBeenCalledWith('senha123', 12);
        expect(mockUsersCreate).toHaveBeenCalled();
        expect(mockTenantUsersCreate).toHaveBeenCalled();
    });

    /** Verifica que usuário existente com senha correta é vinculado (200). */
    it('deve vincular conta existente com senha correta e retornar 200', async () => {
        fakeConvitesRepository.seed([MOCK_INVITE_ACTIVE]);
        mockFindByEmail.mockResolvedValue({ id: 'existing-user-id' });
        mockTenantUsersFindUnique.mockResolvedValue(null);
        mockUsersFindUnique.mockResolvedValue({ password: 'hashed-existing' });
        mockCompare.mockResolvedValue(true);

        const result = await service.execute(MOCK_INVITE_ACTIVE.token, validInput);

        expect(result.statusCode).toBe(200);
        expect(result.msg).toContain('adicionado');
        expect(mockCompare).toHaveBeenCalledWith('senha123', 'hashed-existing');
    });

    /** Verifica que senha incorreta para conta existente lança 401. */
    it('deve lançar erro 401 para senha incorreta de conta existente', async () => {
        fakeConvitesRepository.seed([MOCK_INVITE_ACTIVE]);
        mockFindByEmail.mockResolvedValue({ id: 'existing-user-id' });
        mockTenantUsersFindUnique.mockResolvedValue(null);
        mockUsersFindUnique.mockResolvedValue({ password: 'hashed-existing' });
        mockCompare.mockResolvedValue(false);

        await expect(
            service.execute(MOCK_INVITE_ACTIVE.token, validInput),
        ).rejects.toMatchObject({
            statusCode: 401,
            message: expect.stringContaining('incorreta'),
        });
    });

    /** Verifica que usuário já vinculado ao tenant lança 409. */
    it('deve lançar erro 409 se usuário já pertence ao tenant', async () => {
        fakeConvitesRepository.seed([MOCK_INVITE_ACTIVE]);
        mockFindByEmail.mockResolvedValue({ id: 'existing-user-id' });
        mockUsersFindUnique.mockResolvedValue({ password: 'hashed-existing' });
        mockCompare.mockResolvedValue(true);
        mockTenantUsersFindUnique.mockResolvedValue({ id: 'link-id' });

        await expect(
            service.execute(MOCK_INVITE_ACTIVE.token, validInput),
        ).rejects.toMatchObject({
            statusCode: 409,
            message: expect.stringContaining('pertence'),
        });
    });

    /** Verifica que token expirado lança 400. */
    it('deve lançar erro 400 para token expirado', async () => {
        fakeConvitesRepository.seed([MOCK_INVITE_EXPIRED]);

        await expect(
            service.execute(MOCK_INVITE_EXPIRED.token, validInput),
        ).rejects.toMatchObject({
            statusCode: 400,
            message: expect.stringContaining('expirou'),
        });
    });

    /** Verifica que token já utilizado lança 400. */
    it('deve lançar erro 400 para token já utilizado', async () => {
        fakeConvitesRepository.seed([MOCK_INVITE_USED]);

        await expect(
            service.execute(MOCK_INVITE_USED.token, validInput),
        ).rejects.toMatchObject({
            statusCode: 400,
            message: expect.stringContaining('utilizado'),
        });
    });

    /** Verifica que token revogado lança 400. */
    it('deve lançar erro 400 para token revogado', async () => {
        fakeConvitesRepository.seed([MOCK_INVITE_REVOKED]);

        await expect(
            service.execute(MOCK_INVITE_REVOKED.token, validInput),
        ).rejects.toMatchObject({
            statusCode: 400,
            message: expect.stringContaining('cancelado'),
        });
    });

    /** Verifica que token inexistente lança 404. */
    it('deve lançar erro 404 para token inexistente', async () => {
        await expect(
            service.execute('nonexistent-token', validInput),
        ).rejects.toMatchObject({
            statusCode: 404,
            message: expect.stringContaining('não encontrado'),
        });
    });
});
