/**
 * Schemas de validação Zod para os endpoints de grupos de funções.
 *
 * Valida dados de entrada (body e params) antes que a requisição
 * chegue ao controller. Garante que inputs inválidos retornem 400
 * ao invés de causarem erros em services ou no Prisma.
 */

import { z } from 'zod';

/** Padrão UUID v4 para validação de identificadores. */
const uuidSchema = z.string().uuid({ message: 'ID deve ser um UUID válido' });

/** Schema de validação para parâmetros com `:id` (PUT/DELETE /api/funcoes-grupos/:id). */
export const grupoIdParamsSchema = z.object({
    id: uuidSchema,
});

/** Schema de validação para criação de grupo (POST /api/funcoes-grupos). */
export const createGrupoBodySchema = z.object({
    nome: z.string({ required_error: 'Nome é obrigatório' }).min(1, 'Nome é obrigatório'),
});

/** Schema de validação para atualização de grupo (PUT /api/funcoes-grupos/:id). */
export const updateGrupoBodySchema = z.object({
    nome: z.string({ required_error: 'Nome é obrigatório' }).min(1, 'Nome é obrigatório'),
});

/**
 * Schema de validação do body para reordenação dos grupos de funções.
 *
 * @property grupos_ids - Array de UUIDs dos grupos na nova ordem desejada
 */
export const reorderGruposBodySchema = z.object({
    grupos_ids: z.array(
        z.string().uuid('Cada ID de grupo deve ser um UUID válido')
    )
    .min(1, 'Lista de grupos não pode estar vazia')
    .refine((ids) => new Set(ids).size === ids.length, {
        message: 'IDs de grupos duplicados não são permitidos',
    }),
});

/**
 * Schema de validação do body para definir as funções de um grupo.
 *
 * Aceita array vazio — esvaziar o grupo é uma operação válida que
 * desvincula todas as suas funções.
 *
 * @property funcoes_ids - Array de UUIDs das funções que passam a pertencer ao grupo
 */
export const setFuncoesBodySchema = z.object({
    funcoes_ids: z.array(
        z.string().uuid('Cada ID de função deve ser um UUID válido')
    )
    .refine((ids) => new Set(ids).size === ids.length, {
        message: 'IDs de funções duplicados não são permitidos',
    }),
});
