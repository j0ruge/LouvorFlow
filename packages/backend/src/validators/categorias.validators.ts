/**
 * Schemas de validação Zod para os endpoints de categorias.
 *
 * Valida dados de entrada (body e params) antes que a requisição
 * chegue ao controller. Garante que inputs inválidos retornem 400
 * ao invés de causarem erros em services ou no Prisma.
 */

import { z } from 'zod';

/** Padrão UUID v4 para validação de identificadores. */
const uuidSchema = z.string().uuid({ message: 'ID deve ser um UUID válido' });

/** Schema de validação para parâmetros com `:id` (GET/PUT/DELETE /api/categorias/:id). */
export const categoriaIdParamsSchema = z.object({
    id: uuidSchema,
});

/** Schema de validação para criação de categoria (POST /api/categorias). */
export const createCategoriaBodySchema = z.object({
    nome: z.string({ required_error: 'Nome é obrigatório' }).min(1, 'Nome é obrigatório'),
});

/** Schema de validação para atualização de categoria (PUT /api/categorias/:id). */
export const updateCategoriaBodySchema = z.object({
    nome: z.string({ required_error: 'Nome é obrigatório' }).min(1, 'Nome é obrigatório'),
});
