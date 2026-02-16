/**
 * Schemas Zod para o módulo de integrantes.
 *
 * Define os formatos de resposta da API (listagem e criação)
 * e o schema de validação do formulário de criação.
 */

import { z } from "zod";
import { IdNomeSchema } from "@/schemas/shared";

/** Schema de um integrante com suas funções (item da listagem). */
export const IntegranteComFuncoesSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  doc_id: z.string(),
  email: z.string().email(),
  telefone: z.string().nullable(),
  funcoes: z.array(IdNomeSchema),
});

/** Tipo inferido de um integrante com funções. */
export type IntegranteComFuncoes = z.infer<typeof IntegranteComFuncoesSchema>;

/** Schema da resposta de criação/atualização de integrante. */
export const IntegranteResponseSchema = z.object({
  msg: z.string(),
  integrante: z.object({
    id: z.string().uuid(),
    nome: z.string(),
    doc_id: z.string(),
    email: z.string().email(),
    telefone: z.string().nullable(),
  }),
});

/** Tipo inferido da resposta de criação de integrante. */
export type IntegranteResponse = z.infer<typeof IntegranteResponseSchema>;

/** Schema de validação do formulário de criação de integrante. */
export const CreateIntegranteFormSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  doc_id: z.string().min(1, "Documento é obrigatório"),
  email: z.string().email("E-mail inválido"),
  senha: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
  telefone: z.string().optional(),
});

/** Tipo inferido dos dados do formulário de criação de integrante. */
export type CreateIntegranteForm = z.infer<typeof CreateIntegranteFormSchema>;
