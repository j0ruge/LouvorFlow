/**
 * Schemas de validação Zod para endpoints de gestão de tenants (igrejas).
 *
 * Cada schema valida o formato dos dados de entrada (body e/ou params)
 * antes que a requisição chegue ao controller.
 */

import { z } from 'zod';

/** Padrão UUID v4 para validação de identificadores. */
const uuidSchema = z.string().uuid({ message: 'ID deve ser um UUID válido' });

/**
 * Schema de validação para criação de tenant (POST /api/igrejas).
 * Requer nome não vazio com máximo de 255 caracteres.
 */
export const createTenantBodySchema = z.object({
  name: z.string({ required_error: 'Nome é obrigatório' })
    .trim()
    .min(1, 'Nome é obrigatório')
    .max(255, 'Nome deve ter no máximo 255 caracteres'),
});

/**
 * Schema de validação para atualização de tenant (PUT /api/igrejas/:id).
 * Nome e status são opcionais.
 */
export const updateTenantBodySchema = z.object({
  name: z.string().trim().min(1, 'Nome não pode ser vazio').max(255, 'Nome deve ter no máximo 255 caracteres').optional(),
  status: z.enum(['active', 'inactive'], { message: 'Status deve ser "active" ou "inactive"' }).optional(),
});

/**
 * Schema de validação de params para rotas com tenantId (GET/PUT/DELETE /api/igrejas/:id).
 */
export const tenantIdParamSchema = z.object({
  id: uuidSchema,
});

/**
 * Schema de validação para vincular usuário ao tenant (POST /api/igrejas/:id/users).
 * Requer user_id no formato UUID.
 */
export const addUserToTenantBodySchema = z.object({
  user_id: uuidSchema,
});

/**
 * Schema de validação de params para desvincular usuário (DELETE /api/igrejas/:id/users/:userId).
 */
export const removeUserFromTenantParamsSchema = z.object({
  id: uuidSchema,
  userId: uuidSchema,
});
