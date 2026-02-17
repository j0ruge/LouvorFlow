/**
 * Schemas Zod para o módulo de eventos (escalas).
 *
 * Define os formatos de resposta da API (listagem, detalhe, criação)
 * e o schema de validação do formulário de criação.
 */

import { z } from "zod";
import { IdNomeSchema, TonalidadeSchema } from "@/schemas/shared";

/** Schema de música simplificada no contexto de evento. */
export const MusicaEventoSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  tonalidade: TonalidadeSchema.nullable(),
});

/** Tipo inferido de música no contexto de evento. */
export type MusicaEvento = z.infer<typeof MusicaEventoSchema>;

/** Schema de integrante simplificado no contexto de evento. */
export const IntegranteEventoSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  funcoes: z.array(IdNomeSchema),
});

/** Tipo inferido de integrante no contexto de evento. */
export type IntegranteEvento = z.infer<typeof IntegranteEventoSchema>;

/** Schema de evento na listagem (índice). */
export const EventoIndexSchema = z.object({
  id: z.string().uuid(),
  data: z.string(),
  descricao: z.string(),
  tipoEvento: IdNomeSchema.nullable(),
  musicas: z.array(IdNomeSchema),
  integrantes: z.array(IdNomeSchema),
});

/** Tipo inferido de evento na listagem. */
export type EventoIndex = z.infer<typeof EventoIndexSchema>;

/** Schema de evento no detalhe completo. */
export const EventoShowSchema = z.object({
  id: z.string().uuid(),
  data: z.string(),
  descricao: z.string(),
  tipoEvento: IdNomeSchema.nullable(),
  musicas: z.array(MusicaEventoSchema),
  integrantes: z.array(IntegranteEventoSchema),
});

/** Tipo inferido do detalhe completo de evento. */
export type EventoShow = z.infer<typeof EventoShowSchema>;

/** Schema da resposta de criação de evento. */
export const EventoCreateResponseSchema = z.object({
  msg: z.string(),
  evento: z.object({
    id: z.string().uuid(),
    data: z.string(),
    descricao: z.string(),
    tipoEvento: IdNomeSchema,
  }),
});

/** Tipo inferido da resposta de criação de evento. */
export type EventoCreateResponse = z.infer<typeof EventoCreateResponseSchema>;

/** Schema de validação do formulário de criação de evento. */
export const CreateEventoFormSchema = z.object({
  data: z.string().min(1, "Data é obrigatória"),
  fk_tipo_evento: z.string().uuid("Selecione um tipo de evento"),
  descricao: z.string().min(1, "Descrição é obrigatória"),
});

/** Tipo inferido dos dados do formulário de criação de evento. */
export type CreateEventoForm = z.infer<typeof CreateEventoFormSchema>;

/** Schema de validação do formulário de edição de evento. */
export const UpdateEventoFormSchema = z.object({
  data: z.string().optional(),
  fk_tipo_evento: z.string().uuid("Selecione um tipo de evento").optional(),
  descricao: z.string().optional(),
});

/** Tipo inferido dos dados do formulário de edição de evento. */
export type UpdateEventoForm = z.infer<typeof UpdateEventoFormSchema>;
