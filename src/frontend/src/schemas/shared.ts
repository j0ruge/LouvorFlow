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

/** Schema de validação do formulário de criação de tag. */
export const CreateTagFormSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório"),
});

/** Tipo inferido dos dados do formulário de criação de tag. */
export type CreateTagForm = z.infer<typeof CreateTagFormSchema>;

/** Schema de validação do formulário de edição de tag. */
export const UpdateTagFormSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório"),
});

/** Tipo inferido dos dados do formulário de edição de tag. */
export type UpdateTagForm = z.infer<typeof UpdateTagFormSchema>;

/** Schema de validação do formulário de criação de função. */
export const CreateFuncaoFormSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório"),
});

/** Tipo inferido dos dados do formulário de criação de função. */
export type CreateFuncaoForm = z.infer<typeof CreateFuncaoFormSchema>;

/** Schema de validação do formulário de edição de função. */
export const UpdateFuncaoFormSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório"),
});

/** Tipo inferido dos dados do formulário de edição de função. */
export type UpdateFuncaoForm = z.infer<typeof UpdateFuncaoFormSchema>;

/** Schema de validação do formulário de criação de tonalidade. */
export const CreateTonalidadeSchema = z.object({
  tom: z.string().trim().min(1, "Tom é obrigatório"),
});

/** Tipo inferido dos dados do formulário de criação de tonalidade. */
export type CreateTonalidade = z.infer<typeof CreateTonalidadeSchema>;

/** Schema de validação do formulário de edição de tonalidade. */
export const UpdateTonalidadeSchema = z.object({
  tom: z.string().trim().min(1, "Tom é obrigatório"),
});

/** Tipo inferido dos dados do formulário de edição de tonalidade. */
export type UpdateTonalidade = z.infer<typeof UpdateTonalidadeSchema>;

/** Schema de validação do formulário de criação de tipo de evento. */
export const CreateTipoEventoSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório"),
});

/** Tipo inferido dos dados do formulário de criação de tipo de evento. */
export type CreateTipoEvento = z.infer<typeof CreateTipoEventoSchema>;

/** Schema de validação do formulário de edição de tipo de evento. */
export const UpdateTipoEventoSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório"),
});

/** Tipo inferido dos dados do formulário de edição de tipo de evento. */
export type UpdateTipoEvento = z.infer<typeof UpdateTipoEventoSchema>;

/** Schema genérico da resposta de operações CRUD em entidades auxiliares. */
export const CrudResponseSchema = z.object({
  msg: z.string(),
});

/** Tipo inferido da resposta genérica de CRUD. */
export type CrudResponse = z.infer<typeof CrudResponseSchema>;
