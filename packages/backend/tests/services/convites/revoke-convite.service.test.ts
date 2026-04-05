/**
 * Testes unitários do serviço RevokeInviteService.
 *
 * Valida a revogação atômica de convites ativos e os cenários de erro:
 * convite não encontrado, de outro tenant, já usado e já revogado.
 */

import {
    TENANT_A_ID,
    TENANT_B_ID,
    MOCK_INVITE_ACTIVE,
    MOCK_INVITE_USED,
    MOCK_INVITE_REVOKED,
} from '../../fakes/mock-data.js';

/** Mocks hoisted para uso nas factories de vi.mock. */
const {
    mockUpdateMany,
    mockFindFirst,
} = vi.hoisted(() => ({
    mockUpdateMany: vi.fn(),
    mockFindFirst: vi.fn(),
}));

vi.mock('../../../prisma/cliente.js', () => ({
    default: {
        inviteTokens: {
            updateMany: (...args: unknown[]) => mockUpdateMany(...args),
            findFirst: (...args: unknown[]) => mockFindFirst(...args),
        },
    },
}));

import service from '../../../src/services/convites/revoke-convite.service.js';

describe('RevokeInviteService', () => {
    /** Reinicia mocks antes de cada teste. */
    beforeEach(() => {
        vi.clearAllMocks();
    });

    /** Verifica que um convite ativo é revogado com sucesso (updateMany retorna count=1). */
    it('deve revogar convite ativo com sucesso', async () => {
        mockUpdateMany.mockResolvedValue({ count: 1 });

        await expect(
            service.execute(MOCK_INVITE_ACTIVE.id, TENANT_A_ID),
        ).resolves.toBeUndefined();

        expect(mockUpdateMany).toHaveBeenCalledWith({
            where: {
                id: MOCK_INVITE_ACTIVE.id,
                tenant_id: TENANT_A_ID,
                used_at: null,
                revoked_at: null,
            },
            data: { revoked_at: expect.any(Date) },
        });
    });

    /** Verifica que convite inexistente lança AppError 404. */
    it('deve lançar erro 404 para convite inexistente', async () => {
        mockUpdateMany.mockResolvedValue({ count: 0 });
        mockFindFirst.mockResolvedValue(null);

        await expect(
            service.execute('nonexistent-id', TENANT_A_ID),
        ).rejects.toMatchObject({
            statusCode: 404,
            message: expect.stringContaining('não encontrado'),
        });
    });

    /** Verifica que convite de outro tenant lança AppError 404. */
    it('deve lançar erro 404 para convite de outro tenant', async () => {
        mockUpdateMany.mockResolvedValue({ count: 0 });
        mockFindFirst.mockResolvedValue(null);

        await expect(
            service.execute(MOCK_INVITE_ACTIVE.id, TENANT_B_ID),
        ).rejects.toMatchObject({
            statusCode: 404,
        });
    });

    /** Verifica que convite já utilizado não pode ser revogado. */
    it('deve lançar erro 400 para convite já utilizado', async () => {
        mockUpdateMany.mockResolvedValue({ count: 0 });
        mockFindFirst.mockResolvedValue({
            id: MOCK_INVITE_USED.id,
            tenant_id: TENANT_A_ID,
            used_at: new Date(),
            revoked_at: null,
        });

        await expect(
            service.execute(MOCK_INVITE_USED.id, TENANT_A_ID),
        ).rejects.toMatchObject({
            statusCode: 400,
            message: expect.stringContaining('utilizado'),
        });
    });

    /** Verifica que convite já revogado não pode ser revogado novamente. */
    it('deve lançar erro 400 para convite já revogado', async () => {
        mockUpdateMany.mockResolvedValue({ count: 0 });
        mockFindFirst.mockResolvedValue({
            id: MOCK_INVITE_REVOKED.id,
            tenant_id: TENANT_A_ID,
            used_at: null,
            revoked_at: new Date(),
        });

        await expect(
            service.execute(MOCK_INVITE_REVOKED.id, TENANT_A_ID),
        ).rejects.toMatchObject({
            statusCode: 400,
            message: expect.stringContaining('revogado'),
        });
    });
});
