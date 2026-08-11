/**
 * Schemas Zod para validação de requisições do módulo de eventos.
 */

import { z } from 'zod';

/**
 * Schema de validação do body para adição de integrante a um evento.
 *
 * @property fk_integrante_id - UUID do integrante (obrigatório)
 * @property funcao_ids - Array opcional de UUIDs das funções selecionadas
 */
export const addIntegranteBodySchema = z.object({
    fk_integrante_id: z.string().uuid('ID do integrante deve ser um UUID válido'),
    funcao_ids: z.array(z.string().uuid('Cada funcao_id deve ser um UUID válido')).optional(),
});

/**
 * Schema de validação do body para adição de música a um evento.
 *
 * @property musicas_id - UUID da música a vincular (obrigatório)
 * @property artistas_musicas_id - UUID da versão selecionada (opcional, nullable — permite escolher a versão ao adicionar)
 */
export const addMusicaBodySchema = z.object({
    musicas_id: z.string().uuid('ID da música deve ser um UUID válido'),
    artistas_musicas_id: z.string().uuid('artistas_musicas_id deve ser um UUID válido').nullable().optional(),
});

/**
 * Schema de validação do body para atualização da versão selecionada de uma música no evento.
 *
 * @property artistas_musicas_id - UUID da versão desejada, ou `null` para limpar a seleção
 */
export const setMusicaVersaoBodySchema = z.object({
    artistas_musicas_id: z.string().uuid('artistas_musicas_id deve ser um UUID válido').nullable(),
});

/**
 * Schema de validação do body para atualização do tom de uma música no evento.
 *
 * @property fk_tonalidade - UUID da tonalidade desejada para esta escala, ou `null` para voltar ao tom global da música
 */
export const setMusicaTonalidadeBodySchema = z.object({
    fk_tonalidade: z.string().uuid('fk_tonalidade deve ser um UUID válido').nullable(),
});

/**
 * Schema de validação dos params `eventoId` e `musicaId` nas rotas de junção evento-música.
 *
 * @property eventoId - UUID do evento
 * @property musicaId - UUID da música
 */
export const eventoMusicaParamsSchema = z.object({
    eventoId: z.string().uuid('eventoId deve ser um UUID válido'),
    musicaId: z.string().uuid('musicaId deve ser um UUID válido'),
});

/**
 * Schema de validação do param `eventoId` nas rotas de junção evento-música.
 *
 * @property eventoId - UUID do evento
 */
export const eventoIdParamSchema = z.object({
    eventoId: z.string().uuid('eventoId deve ser um UUID válido'),
});

/**
 * Schema de validação do body para reordenação de músicas em um evento.
 *
 * @property musicas_ids - Array de UUIDs das músicas na nova ordem desejada
 */
export const reorderMusicasBodySchema = z.object({
    musicas_ids: z.array(
        z.string().uuid('Cada ID de música deve ser um UUID válido')
    )
    .min(1, 'Lista de músicas não pode estar vazia')
    .refine((ids) => new Set(ids).size === ids.length, {
        message: 'IDs de músicas duplicados não são permitidos',
    }),
});

/**
 * Schema de validação do body para criação de evento (POST /api/eventos).
 *
 * @property data - Data do evento em formato ISO 8601 (obrigatória)
 * @property fk_tipo_evento - UUID do tipo de evento (obrigatório)
 * @property descricao - Descrição opcional (padrão vazio)
 * @property status - Status de publicação opcional; omitido, o banco aplica o DEFAULT `publicada`
 */
export const createEventoBodySchema = z.object({
    data: z.string({ required_error: 'Data do evento é obrigatória' }),
    fk_tipo_evento: z.string({ required_error: 'Tipo de evento é obrigatório' }).uuid('fk_tipo_evento deve ser um UUID válido'),
    descricao: z.string().optional().default(''),
    status: z.enum(['rascunho', 'publicada']).optional(),
});

/**
 * Schema de validação do body para atualização de evento (PUT /api/eventos/:id).
 *
 * Publicar uma escala rascunho é este endpoint com `{ status: 'publicada' }`.
 *
 * @property data - Nova data ISO 8601 (opcional)
 * @property fk_tipo_evento - Novo tipo de evento (opcional)
 * @property descricao - Nova descrição (opcional)
 * @property status - Novo status de publicação (opcional)
 */
export const updateEventoBodySchema = z.object({
    data: z.string().optional(),
    fk_tipo_evento: z.string().uuid('fk_tipo_evento deve ser um UUID válido').optional(),
    descricao: z.string().optional(),
    status: z.enum(['rascunho', 'publicada']).optional(),
});

/**
 * Schema de validação do body para duplicação de escala
 * (POST /api/eventos/:eventoId/duplicar).
 *
 * @property data - Data do novo evento em formato ISO 8601 (obrigatória)
 * @property fk_tipo_evento - UUID do tipo de evento (opcional — omitido herda o da origem)
 * @property descricao - Descrição (opcional — omitida herda a da origem)
 */
export const duplicarEventoBodySchema = z.object({
    data: z.string({ required_error: 'Data do evento é obrigatória' }),
    fk_tipo_evento: z.string().uuid('fk_tipo_evento deve ser um UUID válido').optional(),
    descricao: z.string().optional(),
});
