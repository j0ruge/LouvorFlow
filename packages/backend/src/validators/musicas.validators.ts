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

/**
 * Schema de URL restrito a protocolos seguros (http/https). Previne XSS via
 * javascript:/data:. Reutilizado por `link_versao` e `cifraclub_url`, portanto as
 * mensagens são agnósticas ao campo (não citam "link da versão").
 */
const safeUrlSchema = z.string()
    .url('URL inválida')
    .refine(
        (url) => /^https?:\/\//i.test(url),
        { message: 'URL deve usar protocolo http ou https' },
    );

/**
 * Valores válidos de intensidade (tempo) de uma versão de música.
 * Fonte única reutilizada tanto nos bodies (criação/edição de música e versão)
 * quanto no filtro de listagem — evita literais duplicados que divergiriam ao
 * adicionar uma nova intensidade.
 */
const INTENSIDADE_VALUES = ['calma', 'media', 'agitada'] as const;

/** União literal das intensidades aceitas, derivada de `INTENSIDADE_VALUES`. */
export type Intensidade = (typeof INTENSIDADE_VALUES)[number];

/**
 * Type guard que estreita uma string para a união `Intensidade`.
 *
 * @param valor - Texto vindo da query string
 * @returns `true` quando o valor é uma intensidade conhecida
 */
function ehIntensidade(valor: string): valor is Intensidade {
    return (INTENSIDADE_VALUES as readonly string[]).includes(valor);
}

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
    bpm: z.preprocess((val) => (val === "" || val === null ? undefined : val), z.number().int().positive().optional()),
    cifras: z.string().optional(),
    lyrics: z.string().optional(),
    link_versao: z.preprocess((val) => (val === "" || val === null ? undefined : val), safeUrlSchema.optional()),
    cifraclub_url: z.preprocess((val) => (val === "" || val === null ? undefined : val), safeUrlSchema.optional()),
    intensidade: z.preprocess((val) => (val === "" || val === null ? undefined : val), z.enum(INTENSIDADE_VALUES).optional()),
    categoria_ids: z.array(uuidSchema).optional(),
    funcao_ids: z.array(uuidSchema).optional(),
});

/** Schema de validação para atualização completa de música (PUT /api/musicas/:id/complete). */
export const updateMusicaCompleteBodySchema = z.object({
    nome: z.string({ required_error: 'Nome da música é obrigatório' }).min(1, 'Nome da música é obrigatório'),
    fk_tonalidade: uuidSchema.nullable().optional(),
    versao_id: uuidSchema.optional(),
    bpm: z.preprocess((val) => (val === "" || val === null ? undefined : val), z.number().int().positive().optional()),
    cifras: z.string().optional(),
    lyrics: z.string().optional(),
    link_versao: z.preprocess((val) => (val === "" || val === null ? undefined : val), safeUrlSchema.optional()),
    cifraclub_url: z.preprocess((val) => (val === "" || val === null ? undefined : val), safeUrlSchema.optional()),
    intensidade: z.preprocess((val) => (val === "" || val === null ? undefined : val), z.enum(INTENSIDADE_VALUES).optional()),
    categoria_ids: z.array(uuidSchema).optional(),
    funcao_ids: z.array(uuidSchema).optional(),
});

/** Schema de validação para adição de versão (POST /api/musicas/:musicaId/versoes). Artista é opcional. */
export const addVersaoBodySchema = z.object({
    artista_id: z.preprocess((val) => (val === "" || val === null ? undefined : val), z.string().uuid('ID do artista deve ser um UUID válido').optional()),
    bpm: z.preprocess((val) => (val === "" || val === null ? undefined : val), z.number().int().positive().optional()),
    cifras: z.string().optional(),
    lyrics: z.string().optional(),
    link_versao: z.preprocess((val) => (val === "" || val === null ? undefined : val), safeUrlSchema.optional()),
    cifraclub_url: z.preprocess((val) => (val === "" || val === null ? undefined : val), safeUrlSchema.optional()),
    intensidade: z.preprocess((val) => (val === "" || val === null ? undefined : val), z.enum(INTENSIDADE_VALUES).optional()),
});

/** Schema de validação para atualização de versão (PUT /api/musicas/:musicaId/versoes/:versaoId). Aceita artista_id para vincular artista a versões sem artista. */
export const updateVersaoBodySchema = z.object({
    artista_id: z.preprocess((val) => (val === "" || val === null ? undefined : val), z.string().uuid('ID do artista deve ser um UUID válido').optional()),
    bpm: z.preprocess((val) => (val === "" || val === null ? undefined : val), z.number().int().positive().optional()),
    cifras: z.string().optional(),
    lyrics: z.string().optional(),
    link_versao: z.preprocess((val) => (val === "" || val === null ? undefined : val), safeUrlSchema.optional()),
    cifraclub_url: z.preprocess((val) => (val === "" || val === null ? undefined : val), safeUrlSchema.optional()),
    intensidade: z.preprocess((val) => (val === "" || val === null ? undefined : val), z.enum(INTENSIDADE_VALUES).optional()),
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

/** Limite máximo de caracteres aceitos no termo de busca `q`. */
const Q_MAX_LENGTH = 200;
/** Limite máximo de IDs de categorias aceitos por requisição. */
const CATEGORIAS_MAX_COUNT = 50;

/**
 * Escapa metacaracteres LIKE (`%`, `_`) e o próprio caractere de escape `\`
 * num termo de busca para que sejam tratados como literais por Prisma
 * `contains`/`startsWith` (ILIKE no PostgreSQL).
 *
 * Sem escape, `q=%` casaria todas as linhas (full table leak); `q=_`
 * casaria qualquer single-char. Um `\` literal no final do termo (ou
 * antes de outro metacaractere) poderia gerar pattern inválido no
 * PostgreSQL, cujo caractere de escape default em LIKE é exatamente
 * `\`. Prisma não escapa esses metacaracteres automaticamente em
 * `contains`, então é responsabilidade do validator.
 *
 * @param raw - Texto cru do termo de busca, já trimado.
 * @returns Texto com `\`, `%` e `_` precedidos de `\`.
 */
function escapeLikeWildcards(raw: string): string {
    return raw.replace(/[\\%_]/g, (m) => `\\${m}`);
}

/**
 * Schema de validação para query params de listagem de músicas (GET /api/musicas).
 *
 * - `page`: inteiro >=1 (default 1)
 * - `limit`: inteiro 1..100 (default 20)
 * - `categorias`: CSV de UUIDs (ex.: "id1,id2"), no máximo 50. Vazio/ausente = sem filtro.
 * - `intensidades`: CSV de intensidades (`calma`, `media`, `agitada`). Filtra músicas com
 *   ao menos uma versão na(s) intensidade(s) informada(s). Valor inválido = 400.
 *   Vazio/ausente = sem filtro.
 * - `q`: substring case-insensitive (até 200 chars) para busca por nome. Wildcards
 *   LIKE (`%`, `_`) são escapados para impedir varredura total via filtro malicioso.
 *   Vazio/ausente = sem busca.
 */
export const listMusicasQuerySchema = z.object({
    page: z.coerce.number().int().min(1).optional().default(1),
    limit: z.coerce.number().int().min(1).max(100).optional().default(20),
    categorias: z.string().optional().transform((val, ctx) => {
        if (!val) return undefined;
        const ids = val.split(',').map((s) => s.trim()).filter(Boolean);
        if (ids.length === 0) return undefined;
        if (ids.length > CATEGORIAS_MAX_COUNT) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Máximo de ${CATEGORIAS_MAX_COUNT} categorias por filtro`,
            });
            return z.NEVER;
        }
        const parsed = z.array(uuidSchema).safeParse(ids);
        if (!parsed.success) {
            for (const issue of parsed.error.issues) {
                const idx = typeof issue.path[0] === 'number' ? issue.path[0] : -1;
                const offender = idx >= 0 ? ids[idx] : (issue.message ?? 'desconhecido');
                ctx.addIssue({
                    code: z.ZodIssueCode.custom,
                    message: `UUID inválido em categorias: ${offender}`,
                });
            }
            return z.NEVER;
        }
        return parsed.data;
    }),
    intensidades: z.string().optional().transform((val, ctx): Intensidade[] | undefined => {
        if (!val) return undefined;
        const items = val.split(',').map((s) => s.trim()).filter(Boolean);
        if (items.length === 0) return undefined;
        const invalidos = items.filter((i) => !ehIntensidade(i));
        if (invalidos.length > 0) {
            ctx.addIssue({
                code: z.ZodIssueCode.custom,
                message: `Intensidade inválida: ${invalidos.join(', ')}. Valores aceitos: ${INTENSIDADE_VALUES.join(', ')}`,
            });
            return z.NEVER;
        }
        /**
         * `items` já foi validado item a item pelo `ehIntensidade` acima, mas o
         * `.filter()` não estreita o array de origem — daí o filtro explícito com
         * type guard, que faz o tipo exportado (`Intensidade[]`) refletir a
         * garantia que o runtime já dá, em vez de continuar como `string[]`.
         */
        return Array.from(new Set(items.filter(ehIntensidade)));
    }),
    q: z.string().max(Q_MAX_LENGTH, `Busca não pode exceder ${Q_MAX_LENGTH} caracteres`).optional().transform((val) => {
        if (typeof val !== 'string') return undefined;
        const trimmed = val.trim();
        if (trimmed.length === 0) return undefined;
        return escapeLikeWildcards(trimmed);
    }),
});
