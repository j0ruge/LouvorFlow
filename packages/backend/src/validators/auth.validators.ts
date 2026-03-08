/**
 * Schemas de validação Zod para todos os endpoints de autenticação e RBAC.
 *
 * Cada schema valida o formato dos dados de entrada (body e/ou params)
 * antes que a requisição chegue ao controller.
 */

import { z } from 'zod';

/** Padrão UUID v4 para validação de identificadores. */
const uuidSchema = z.string().uuid({ message: 'ID deve ser um UUID válido' });

// ─── Sessions ───────────────────────────────────────────────────────────────

/**
 * Schema de validação para login (POST /api/sessions).
 * Requer email em formato válido e senha não vazia.
 */
export const loginBodySchema = z.object({
    email: z.string({ required_error: 'Email é obrigatório' }).email('Email deve ter um formato válido'),
    password: z.string({ required_error: 'Senha é obrigatória' }).min(1, 'Senha é obrigatória'),
});

/**
 * Schema de validação para refresh token (POST /api/sessions/refresh-token).
 * O token pode ser opcional no body pois pode vir via header ou query.
 */
export const refreshTokenBodySchema = z.object({
    token: z.string().optional(),
});

// ─── Users ──────────────────────────────────────────────────────────────────

/**
 * Schema de validação para criação de usuário (POST /api/users).
 * Requer nome, email válido e senha com mínimo de 6 caracteres.
 */
export const createUserBodySchema = z.object({
    name: z.string({ required_error: 'Nome é obrigatório' }).min(1, 'Nome é obrigatório'),
    email: z.string({ required_error: 'Email é obrigatório' }).email('Email deve ter um formato válido'),
    password: z.string({ required_error: 'Senha é obrigatória' }).min(6, 'Senha deve ter no mínimo 6 caracteres'),
});

// ─── Roles ──────────────────────────────────────────────────────────────────

/**
 * Schema de validação para criação de papel (POST /api/roles).
 * Requer nome e descrição não vazios.
 */
export const createRoleBodySchema = z.object({
    name: z.string({ required_error: 'Nome é obrigatório' }).min(1, 'Nome é obrigatório'),
    description: z.string({ required_error: 'Descrição é obrigatória' }).min(1, 'Descrição é obrigatória'),
});

/**
 * Schema de validação de params para rotas com roleId (POST /api/roles/:roleId).
 */
export const roleIdParamsSchema = z.object({
    roleId: uuidSchema,
});

/**
 * Schema de validação para associação de permissões a papel (POST /api/roles/:roleId).
 * Requer um array de IDs de permissões no formato UUID.
 */
export const rolePermissionsBodySchema = z.object({
    permissions: z.array(
        uuidSchema,
        { required_error: 'Permissões são obrigatórias' },
    ).min(1, 'Pelo menos uma permissão deve ser informada'),
});

// ─── Permissions ────────────────────────────────────────────────────────────

/**
 * Schema de validação para criação de permissão (POST /api/permissions).
 * Requer nome e descrição não vazios.
 */
export const createPermissionBodySchema = z.object({
    name: z.string({ required_error: 'Nome é obrigatório' }).min(1, 'Nome é obrigatório'),
    description: z.string({ required_error: 'Descrição é obrigatória' }).min(1, 'Descrição é obrigatória'),
});

// ─── User ACL ───────────────────────────────────────────────────────────────

/**
 * Schema de validação de params para rotas com userId (POST/GET /api/users/acl/:userId).
 */
export const userIdParamsSchema = z.object({
    userId: uuidSchema,
});

/**
 * Schema de validação para associação de ACL a usuário (POST /api/users/acl/:userId).
 * Requer arrays de IDs de papéis e permissões no formato UUID.
 */
export const userAclBodySchema = z.object({
    roles: z.array(
        uuidSchema,
        { required_error: 'Papéis são obrigatórios' },
    ),
    permissions: z.array(
        uuidSchema,
        { required_error: 'Permissões são obrigatórias' },
    ),
});

// ─── Password ───────────────────────────────────────────────────────────────

/**
 * Schema de validação para solicitação de recuperação de senha (POST /api/password/forgot).
 * Requer email em formato válido.
 */
export const forgotPasswordBodySchema = z.object({
    email: z.string({ required_error: 'Email é obrigatório' }).email('Email deve ter um formato válido'),
});

/**
 * Schema de validação para redefinição de senha (POST /api/password/reset).
 * Requer token UUID, senha com mínimo de 6 caracteres e confirmação de senha correspondente.
 */
export const resetPasswordBodySchema = z.object({
    token: z.string({ required_error: 'Token é obrigatório' }).uuid('Token deve ser um UUID válido'),
    password: z.string({ required_error: 'Senha é obrigatória' }).min(6, 'Senha deve ter no mínimo 6 caracteres'),
    password_confirmation: z.string({ required_error: 'Confirmação de senha é obrigatória' }).min(1, 'Confirmação de senha é obrigatória'),
}).refine((data) => data.password === data.password_confirmation, {
    message: 'Confirmação de senha não coincide',
    path: ['password_confirmation'],
});

// ─── Profile ────────────────────────────────────────────────────────────────

/**
 * Schema de validação para atualização de perfil (PUT /api/profile).
 * Todos os campos são opcionais: nome, email, senha antiga e nova senha.
 */
export const updateProfileBodySchema = z.object({
    name: z.string().min(1, 'Nome não pode ser vazio').optional(),
    email: z.string().email('Email deve ter um formato válido').optional(),
    old_password: z.string().optional(),
    password: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').optional(),
});
