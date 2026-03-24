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
