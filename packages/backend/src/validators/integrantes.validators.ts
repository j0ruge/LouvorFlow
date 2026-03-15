/**
 * Schemas de validação Zod para os endpoints de integrantes.
 *
 * Valida dados de entrada (body e params) antes que a requisição
 * chegue ao controller. Campos usam naming em português para
 * retrocompatibilidade da API `/api/integrantes`.
 */

import { z } from 'zod';

/** Padrão UUID v4 para validação de identificadores. */
const uuidSchema = z.string().uuid({ message: 'ID deve ser um UUID válido' });

/**
 * Schema de validação para criação de integrante (POST /api/integrantes).
 * Requer nome, email válido e senha com mínimo de 6 caracteres.
 */
export const createIntegranteBodySchema = z.object({
    nome: z.string({ required_error: 'Nome é obrigatório' }).min(1, 'Nome é obrigatório'),
    email: z.string({ required_error: 'Email é obrigatório' }).email('Email deve ter um formato válido'),
    senha: z.string({ required_error: 'Senha é obrigatória' }).min(6, 'Senha deve ter no mínimo 6 caracteres'),
    telefone: z.string().max(20, 'Telefone deve ter no máximo 20 caracteres').optional(),
});

/**
 * Schema de validação para atualização de integrante (PUT /api/integrantes/:id).
 * Todos os campos são opcionais. Senha vazia é ignorada.
 */
export const updateIntegranteBodySchema = z.object({
    nome: z.string().min(1, 'Nome não pode ser vazio').optional(),
    email: z.string().email('Email deve ter um formato válido').optional(),
    senha: z.string().min(6, 'Senha deve ter no mínimo 6 caracteres').optional().or(z.literal('')),
    telefone: z.string().max(20, 'Telefone deve ter no máximo 20 caracteres').optional(),
});

/**
 * Schema de validação para parâmetros com ID (GET/PUT/DELETE /api/integrantes/:id).
 */
export const integranteIdParamsSchema = z.object({
    id: uuidSchema,
});

/**
 * Schema de validação para parâmetros de rotas de funções (/:integranteId/funcoes).
 */
export const integranteFuncaoParamsSchema = z.object({
    integranteId: uuidSchema,
});

/**
 * Schema de validação para parâmetros de remoção de função (/:integranteId/funcoes/:funcaoId).
 */
export const integranteFuncaoRemoveParamsSchema = z.object({
    integranteId: uuidSchema,
    funcaoId: uuidSchema,
});

/**
 * Schema de validação para body de adição de função (POST /:integranteId/funcoes).
 */
export const addFuncaoBodySchema = z.object({
    funcao_id: uuidSchema,
});
