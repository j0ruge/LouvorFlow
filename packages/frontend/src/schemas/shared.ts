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

/** Validador compartilhado para campos de nome obrigatório. */
const NomeField = z.string().trim().min(1, "Nome é obrigatório");

/** Validador compartilhado para campos de tom obrigatório. */
const TomField = z.string().trim().min(1, "Tom é obrigatório");

/** Schema de validação do formulário de criação de categoria. */
export const CreateCategoriaFormSchema = z.object({ nome: NomeField });

/** Tipo inferido dos dados do formulário de criação de categoria. */
export type CreateCategoriaForm = z.infer<typeof CreateCategoriaFormSchema>;

/** Schema de validação do formulário de edição de categoria. */
export const UpdateCategoriaFormSchema = z.object({ nome: NomeField });

/** Tipo inferido dos dados do formulário de edição de categoria. */
export type UpdateCategoriaForm = z.infer<typeof UpdateCategoriaFormSchema>;

/** Schema de validação do formulário de criação de função. */
export const CreateFuncaoFormSchema = z.object({ nome: NomeField });

/** Tipo inferido dos dados do formulário de criação de função. */
export type CreateFuncaoForm = z.infer<typeof CreateFuncaoFormSchema>;

/** Schema de validação do formulário de edição de função. */
export const UpdateFuncaoFormSchema = z.object({ nome: NomeField });

/** Tipo inferido dos dados do formulário de edição de função. */
export type UpdateFuncaoForm = z.infer<typeof UpdateFuncaoFormSchema>;

/** Schema de validação do formulário de criação de tonalidade. */
export const CreateTonalidadeSchema = z.object({ tom: TomField });

/** Tipo inferido dos dados do formulário de criação de tonalidade. */
export type CreateTonalidade = z.infer<typeof CreateTonalidadeSchema>;

/** Schema de validação do formulário de edição de tonalidade. */
export const UpdateTonalidadeSchema = z.object({ tom: TomField });

/** Tipo inferido dos dados do formulário de edição de tonalidade. */
export type UpdateTonalidade = z.infer<typeof UpdateTonalidadeSchema>;

/** Schema de validação do formulário de criação de tipo de evento. */
export const CreateTipoEventoSchema = z.object({ nome: NomeField });

/** Tipo inferido dos dados do formulário de criação de tipo de evento. */
export type CreateTipoEvento = z.infer<typeof CreateTipoEventoSchema>;

/** Schema de validação do formulário de edição de tipo de evento. */
export const UpdateTipoEventoSchema = z.object({ nome: NomeField });

/** Tipo inferido dos dados do formulário de edição de tipo de evento. */
export type UpdateTipoEvento = z.infer<typeof UpdateTipoEventoSchema>;

/** Schema genérico da resposta de operações CRUD em entidades auxiliares. */
export const CrudResponseSchema = z.object({
  msg: z.string(),
});

/** Tipo inferido da resposta genérica de CRUD. */
export type CrudResponse = z.infer<typeof CrudResponseSchema>;

/** Schema da resposta de criação de tonalidade (inclui a tonalidade criada). */
export const TonalidadeCreateResponseSchema = z.object({
  msg: z.string(),
  tonalidade: TonalidadeSchema,
});

/** Tipo inferido da resposta de criação de tonalidade. */
export type TonalidadeCreateResponse = z.infer<typeof TonalidadeCreateResponseSchema>;

/** Schema da resposta de criação de categoria (inclui a categoria criada). */
export const CategoriaCreateResponseSchema = z.object({
  msg: z.string(),
  categoria: IdNomeSchema,
});

/** Tipo inferido da resposta de criação de categoria. */
export type CategoriaCreateResponse = z.infer<typeof CategoriaCreateResponseSchema>;

/** Schema da resposta de criação de função (inclui a função criada). */
export const FuncaoCreateResponseSchema = z.object({
  msg: z.string(),
  funcao: IdNomeSchema,
});

/** Tipo inferido da resposta de criação de função. */
export type FuncaoCreateResponse = z.infer<typeof FuncaoCreateResponseSchema>;
