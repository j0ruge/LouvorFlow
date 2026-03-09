/**
 * Testes unitários dos schemas de validação de autenticação e RBAC.
 *
 * Verifica que os schemas Zod aceitam dados válidos e rejeitam
 * identificadores inválidos (não-UUID) em campos de IDs.
 */

import { userAclBodySchema } from '../../src/validators/auth.validators.js';

describe('userAclBodySchema', () => {
    const validUuid1 = 'a1b2c3d4-e5f6-7890-abcd-ef1234567890';
    const validUuid2 = 'b2c3d4e5-f6a7-8901-bcde-f12345678901';

    /** Aceita arrays de UUIDs válidos para roles e permissions. */
    it('deve aceitar UUIDs válidos em roles e permissions', () => {
        const result = userAclBodySchema.safeParse({
            roles: [validUuid1],
            permissions: [validUuid2],
        });

        expect(result.success).toBe(true);
    });

    /** Aceita arrays vazios para roles e permissions. */
    it('deve aceitar arrays vazios para roles e permissions', () => {
        const result = userAclBodySchema.safeParse({
            roles: [],
            permissions: [],
        });

        expect(result.success).toBe(true);
    });

    /** Rejeita strings arbitrárias (não-UUID) em roles. */
    it('deve rejeitar strings não-UUID em roles', () => {
        const result = userAclBodySchema.safeParse({
            roles: ['not-a-uuid', 'also-invalid'],
            permissions: [],
        });

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.errors[0].message).toBe('ID deve ser um UUID válido');
        }
    });

    /** Rejeita strings arbitrárias (não-UUID) em permissions. */
    it('deve rejeitar strings não-UUID em permissions', () => {
        const result = userAclBodySchema.safeParse({
            roles: [],
            permissions: ['invalid-permission-id'],
        });

        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.errors[0].message).toBe('ID deve ser um UUID válido');
        }
    });

    /** Rejeita quando roles ou permissions não são arrays. */
    it('deve rejeitar quando roles não é um array', () => {
        const result = userAclBodySchema.safeParse({
            roles: 'not-an-array',
            permissions: [],
        });

        expect(result.success).toBe(false);
    });
});
