/**
 * Schemas de validação Zod para os endpoints de convites.
 *
 * Define validações para aceitação de convite (body), parâmetros de token
 * (UUID na URL) e parâmetros de ID para revogação.
 */

import { z } from 'zod';

/**
 * Schema de validação para aceitação de convite (POST /api/convites/:token/accept).
 * Requer nome, email válido, senha com mínimo de 6 caracteres e confirmação correspondente.
 */
export const acceptInviteBodySchema = z.object({
    nome: z.string({ required_error: 'Nome é obrigatório' }).min(1, 'Nome é obrigatório'),
    email: z.string({ required_error: 'Email é obrigatório' }).trim().toLowerCase().email('Email deve ter um formato válido'),
    senha: z.string({ required_error: 'Senha é obrigatória' }).min(6, 'Senha deve ter no mínimo 6 caracteres'),
    senha_confirmacao: z.string({ required_error: 'Confirmação de senha é obrigatória' }).min(1, 'Confirmação de senha é obrigatória'),
}).refine((data) => data.senha === data.senha_confirmacao, {
    message: 'Confirmação de senha não coincide',
    path: ['senha_confirmacao'],
});

/**
 * Schema de validação para parâmetro de token na URL (GET/POST /api/convites/:token/*).
 * O token deve ser um UUID v4 válido.
 */
export const tokenParamSchema = z.object({
    token: z.string({ required_error: 'Token é obrigatório' }).uuid('Token deve ser um UUID válido'),
});

/**
 * Schema de validação para parâmetro de ID na URL (DELETE /api/convites/:id).
 * O ID deve ser um UUID v4 válido.
 */
export const inviteIdParamSchema = z.object({
    id: z.string({ required_error: 'ID é obrigatório' }).uuid('ID deve ser um UUID válido'),
});
