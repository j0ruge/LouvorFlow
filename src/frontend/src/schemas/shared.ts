/**
 * Schemas Zod compartilhados entre todos os módulos do frontend.
 *
 * Define os formatos comuns de resposta da API: entidades com id/nome,
 * tonalidades, erros padronizados e metadados de paginação.
 */

import { z } from "zod";

/** Schema para entidades simples com id UUID e nome. */
export const IdNomeSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
});

/** Tipo inferido de uma entidade id/nome. */
export type IdNome = z.infer<typeof IdNomeSchema>;

/** Schema para tonalidade musical (id + tom). */
export const TonalidadeSchema = z.object({
  id: z.string().uuid(),
  tom: z.string(),
});

/** Tipo inferido de uma tonalidade. */
export type Tonalidade = z.infer<typeof TonalidadeSchema>;

/** Schema do formato padrão de erro retornado pela API. */
export const ApiErrorSchema = z.object({
  erro: z.string(),
  codigo: z.number(),
});

/** Tipo inferido do erro da API. */
export type ApiErrorResponse = z.infer<typeof ApiErrorSchema>;

/** Schema dos metadados de paginação retornados pela API. */
export const PaginationMetaSchema = z.object({
  total: z.number(),
  page: z.number(),
  per_page: z.number(),
  total_pages: z.number(),
});

/** Tipo inferido dos metadados de paginação. */
export type PaginationMeta = z.infer<typeof PaginationMetaSchema>;
