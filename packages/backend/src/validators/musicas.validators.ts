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

/** Schema de URL restrito a protocolos seguros (http/https). Previne XSS via javascript:/data:. */
const safeUrlSchema = z.string()
    .url('Link da versão deve ser uma URL válida')
    .refine(
        (url) => /^https?:\/\//i.test(url),
        { message: 'Link da versão deve usar protocolo http ou https' },
    );

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
    artista_id: z.preprocess((val) => (val === "" || val === null ? undefined : val), z.string().uuid('ID do artista deve ser um UUID válido').optional()),
    bpm: z.number().int().positive().optional(),
    cifras: z.string().optional(),
    lyrics: z.string().optional(),
    link_versao: safeUrlSchema.optional(),
    intensidade: z.preprocess((val) => (val === "" || val === null ? undefined : val), z.enum(["calma", "media", "agitada"]).optional()),
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
    link_versao: safeUrlSchema.optional(),
    intensidade: z.preprocess((val) => (val === "" || val === null ? undefined : val), z.enum(["calma", "media", "agitada"]).optional()),
    categoria_ids: z.array(uuidSchema).optional(),
    funcao_ids: z.array(uuidSchema).optional(),
});

/** Schema de validação para adição de versão (POST /api/musicas/:musicaId/versoes). Artista é opcional. */
export const addVersaoBodySchema = z.object({
    artista_id: z.preprocess((val) => (val === "" || val === null ? undefined : val), z.string().uuid('ID do artista deve ser um UUID válido').optional()),
    bpm: z.number().int().positive().optional(),
    cifras: z.string().optional(),
    lyrics: z.string().optional(),
    link_versao: safeUrlSchema.optional(),
    intensidade: z.preprocess((val) => (val === "" || val === null ? undefined : val), z.enum(["calma", "media", "agitada"]).optional()),
});

/** Schema de validação para atualização de versão (PUT /api/musicas/:musicaId/versoes/:versaoId). Aceita artista_id para vincular artista a versões sem artista. */
export const updateVersaoBodySchema = z.object({
    artista_id: z.preprocess((val) => (val === "" || val === null ? undefined : val), z.string().uuid('ID do artista deve ser um UUID válido').optional()),
    bpm: z.number().int().positive().optional(),
    cifras: z.string().optional(),
    lyrics: z.string().optional(),
    link_versao: safeUrlSchema.optional(),
    intensidade: z.preprocess((val) => (val === "" || val === null ? undefined : val), z.enum(["calma", "media", "agitada"]).optional()),
});

/** Schema de validação para adição de categoria (POST /api/musicas/:musicaId/categorias). */
export const addCategoriaBodySchema = z.object({
    categoria_id: z.string({ required_error: 'ID da categoria é obrigatório' }).uuid('ID da categoria deve ser um UUID válido'),
});

/** Schema de validação para adição de função (POST /api/musicas/:musicaId/funcoes). */
export const addFuncaoBodySchema = z.object({
    funcao_id: z.string({ required_error: 'ID da função é obrigatório' }).uuid('ID da função deve ser um UUID válido'),
});

// --- Query params ---

/**
 * Schema de validação para query params de listagem de músicas (GET /api/musicas).
 *
 * - `page`: inteiro >=1 (default 1)
 * - `limit`: inteiro 1..100 (default 20)
 * - `categorias`: CSV de UUIDs (ex.: "id1,id2"). Vazio/ausente = sem filtro.
 * - `q`: substring case-insensitive para busca por nome. Vazio/ausente = sem busca.
 */
export const listMusicasQuerySchema = z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    categorias: z.string().optional().transform((val, ctx) => {
        if (!val) return undefined;
        const ids = val.split(',').map((s) => s.trim()).filter(Boolean);
        for (const id of ids) {
            if (!/^[0-9a-fA-F-]{36}$/.test(id)) {
                ctx.addIssue({ code: z.ZodIssueCode.custom, message: `UUID inválido em categorias: ${id}` });
                return z.NEVER;
            }
        }
        return ids.length > 0 ? ids : undefined;
    }),
    q: z.string().trim().min(1).optional(),
});
