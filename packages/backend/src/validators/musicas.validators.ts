/**
 * Schemas de validação Zod para os endpoints de músicas.
 *
 * Valida dados de entrada (body e params) antes que a requisição
 * chegue ao controller. Garante que inputs inválidos retornem 400
 * ao invés de causarem erros em services ou no Prisma.
 */

import { z } from 'zod';

/** Padrão UUID v4 para validação de identificadores. */
const uuidSchema = z.string().uuid({ message: 'ID deve ser um UUID válido' });

// --- Params ---

/** Schema de validação para parâmetros com `:id` (GET/PUT/DELETE /api/musicas/:id). */
export const musicaIdParamsSchema = z.object({
    id: uuidSchema,
});

/** Schema de validação para parâmetros com `:musicaId` (rotas de junction). */
export const musicaIdNestedParamsSchema = z.object({
    musicaId: uuidSchema,
});

/** Schema de validação para parâmetros com `:musicaId` e `:versaoId`. */
export const musicaVersaoParamsSchema = z.object({
    musicaId: uuidSchema,
    versaoId: uuidSchema,
});

/** Schema de validação para parâmetros com `:musicaId` e `:categoriaId`. */
export const musicaCategoriaParamsSchema = z.object({
    musicaId: uuidSchema,
    categoriaId: uuidSchema,
});

/** Schema de validação para parâmetros com `:musicaId` e `:funcaoId`. */
export const musicaFuncaoParamsSchema = z.object({
    musicaId: uuidSchema,
    funcaoId: uuidSchema,
});

// --- Bodies ---

/** Schema de validação para criação simples de música (POST /api/musicas). */
export const createMusicaBodySchema = z.object({
    nome: z.string({ required_error: 'Nome da música é obrigatório' }).min(1, 'Nome da música é obrigatório'),
    fk_tonalidade: uuidSchema,
});

/** Schema de validação para atualização de música (PUT /api/musicas/:id). */
export const updateMusicaBodySchema = z.object({
    nome: z.string().min(1, 'Nome não pode ser vazio').optional(),
    fk_tonalidade: uuidSchema.optional(),
});

/** Schema de validação para criação completa de música (POST /api/musicas/complete). */
export const createMusicaCompleteBodySchema = z.object({
    nome: z.string({ required_error: 'Nome da música é obrigatório' }).min(1, 'Nome da música é obrigatório'),
    fk_tonalidade: uuidSchema.optional(),
    artista_id: uuidSchema.optional(),
    bpm: z.number().int().positive().optional(),
    cifras: z.string().optional(),
    lyrics: z.string().optional(),
    link_versao: z.string().url('Link da versão deve ser uma URL válida').optional(),
    intensidade: z.enum(["calma", "media", "agitada"]).optional(),
    categoria_ids: z.array(uuidSchema).optional(),
    funcao_ids: z.array(uuidSchema).optional(),
});

/** Schema de validação para atualização completa de música (PUT /api/musicas/:id/complete). */
export const updateMusicaCompleteBodySchema = z.object({
    nome: z.string({ required_error: 'Nome da música é obrigatório' }).min(1, 'Nome da música é obrigatório'),
    fk_tonalidade: uuidSchema.nullable().optional(),
    versao_id: uuidSchema.optional(),
    bpm: z.number().int().positive().optional(),
    cifras: z.string().optional(),
    lyrics: z.string().optional(),
    link_versao: z.string().url('Link da versão deve ser uma URL válida').optional(),
    intensidade: z.enum(["calma", "media", "agitada"]).optional(),
    categoria_ids: z.array(uuidSchema).optional(),
    funcao_ids: z.array(uuidSchema).optional(),
});

/** Schema de validação para adição de versão (POST /api/musicas/:musicaId/versoes). */
export const addVersaoBodySchema = z.object({
    artista_id: z.string({ required_error: 'ID do artista é obrigatório' }).uuid('ID do artista deve ser um UUID válido'),
    bpm: z.number().int().positive().optional(),
    cifras: z.string().optional(),
    lyrics: z.string().optional(),
    link_versao: z.string().url('Link da versão deve ser uma URL válida').optional(),
    intensidade: z.enum(["calma", "media", "agitada"]).optional(),
});

/** Schema de validação para atualização de versão (PUT /api/musicas/:musicaId/versoes/:versaoId). */
export const updateVersaoBodySchema = z.object({
    bpm: z.number().int().positive().optional(),
    cifras: z.string().optional(),
    lyrics: z.string().optional(),
    link_versao: z.string().url('Link da versão deve ser uma URL válida').optional(),
    intensidade: z.enum(["calma", "media", "agitada"]).optional(),
});

/** Schema de validação para adição de categoria (POST /api/musicas/:musicaId/categorias). */
export const addCategoriaBodySchema = z.object({
    categoria_id: z.string({ required_error: 'ID da categoria é obrigatório' }).uuid('ID da categoria deve ser um UUID válido'),
});

/** Schema de validação para adição de função (POST /api/musicas/:musicaId/funcoes). */
export const addFuncaoBodySchema = z.object({
    funcao_id: z.string({ required_error: 'ID da função é obrigatório' }).uuid('ID da função deve ser um UUID válido'),
});
