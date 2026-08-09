/**
 * Schemas Zod dos grupos de funções.
 *
 * Grupos organizam as funções por papel (Ministração, Vocal, Instrumentos...)
 * e sua `ordem` define a sequência dos blocos de integrantes na mensagem de
 * compartilhamento da escala.
 */

import { z } from "zod";
import { IdNomeSchema } from "@/schemas/shared";

/** Schema de um grupo de funções com as funções que pertencem a ele. */
export const GrupoFuncoesSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  ordem: z.number().int(),
  funcoes: z.array(IdNomeSchema),
});

/** Tipo inferido de um grupo de funções. */
export type GrupoFuncoes = z.infer<typeof GrupoFuncoesSchema>;

/** Schema da resposta das mutations de grupo (inclui o grupo afetado). */
export const GrupoFuncoesMutationResponseSchema = z.object({
  msg: z.string(),
  grupo: GrupoFuncoesSchema,
});

/** Tipo inferido da resposta das mutations de grupo. */
export type GrupoFuncoesMutationResponse = z.infer<typeof GrupoFuncoesMutationResponseSchema>;

/** Validador compartilhado para o nome do grupo. */
const NomeGrupoField = z.string().trim().min(1, "Nome é obrigatório");

/** Schema de validação do formulário de criação de grupo. */
export const CreateGrupoFormSchema = z.object({ nome: NomeGrupoField });

/** Tipo inferido dos dados do formulário de criação de grupo. */
export type CreateGrupoForm = z.infer<typeof CreateGrupoFormSchema>;

/** Schema de validação do formulário de edição de grupo. */
export const UpdateGrupoFormSchema = z.object({ nome: NomeGrupoField });

/** Tipo inferido dos dados do formulário de edição de grupo. */
export type UpdateGrupoForm = z.infer<typeof UpdateGrupoFormSchema>;
