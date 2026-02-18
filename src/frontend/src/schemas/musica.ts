/**
 * Schemas Zod para o módulo de músicas.
 *
 * Define os formatos de resposta da API (listagem paginada, criação)
 * e o schema de validação do formulário de criação.
 */

import { z } from "zod";
import { IdNomeSchema, TonalidadeSchema, PaginationMetaSchema } from "@/schemas/shared";

/** Schema de uma versão de música (por artista). */
export const VersaoSchema = z.object({
  id: z.string().uuid(),
  artista: IdNomeSchema,
  bpm: z.number().nullable(),
  cifras: z.string().nullable(),
  lyrics: z.string().nullable(),
  link_versao: z
    .string()
    .refine(
      (val) => val === "" || /^https?:\/\//i.test(val),
      "URL deve usar protocolo http ou https",
    )
    .nullable(),
});

/** Tipo inferido de uma versão. */
export type Versao = z.infer<typeof VersaoSchema>;

/** Schema de uma música com todos os relacionamentos. */
export const MusicaSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  tonalidade: TonalidadeSchema.nullable(),
  categorias: z.array(IdNomeSchema),
  versoes: z.array(VersaoSchema),
  funcoes: z.array(IdNomeSchema),
});

/** Tipo inferido de uma música. */
export type Musica = z.infer<typeof MusicaSchema>;

/** Schema da resposta paginada da listagem de músicas. */
export const MusicasPaginadasSchema = z.object({
  items: z.array(MusicaSchema),
  meta: PaginationMetaSchema,
});

/** Tipo inferido da resposta paginada de músicas. */
export type MusicasPaginadas = z.infer<typeof MusicasPaginadasSchema>;

/** Schema da resposta de criação/atualização de música. */
export const MusicaCreateResponseSchema = z.object({
  msg: z.string(),
  musica: z.object({
    id: z.string().uuid(),
    nome: z.string(),
    tonalidade: TonalidadeSchema.nullable(),
  }),
});

/** Tipo inferido da resposta de criação de música. */
export type MusicaCreateResponse = z.infer<typeof MusicaCreateResponseSchema>;

/** Schema de validação do formulário de criação de música. */
export const CreateMusicaFormSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  fk_tonalidade: z.string().uuid("Selecione uma tonalidade"),
});

/** Tipo inferido dos dados do formulário de criação de música. */
export type CreateMusicaForm = z.infer<typeof CreateMusicaFormSchema>;

/** Schema de validação do formulário de edição de música. */
export const UpdateMusicaFormSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  fk_tonalidade: z.string().uuid("Selecione uma tonalidade").optional(),
});

/** Tipo inferido dos dados do formulário de edição de música. */
export type UpdateMusicaForm = z.infer<typeof UpdateMusicaFormSchema>;

/** Schema de validação do formulário de criação de versão. */
export const CreateVersaoFormSchema = z.object({
  artista_id: z.string().uuid("Selecione um artista"),
  bpm: z.coerce.number().min(1, "BPM deve ser maior que 0").optional().or(z.literal("")),
  cifras: z.string().optional(),
  lyrics: z.string().optional(),
  link_versao: z
    .string()
    .url("URL inválida")
    .refine((val) => /^https?:\/\//i.test(val), "URL deve usar protocolo http ou https")
    .optional()
    .or(z.literal("")),
});

/** Tipo inferido dos dados do formulário de criação de versão. */
export type CreateVersaoForm = z.infer<typeof CreateVersaoFormSchema>;

/** Schema de validação do formulário de edição de versão. */
export const UpdateVersaoFormSchema = z.object({
  bpm: z.coerce.number().min(1, "BPM deve ser maior que 0").optional().or(z.literal("")),
  cifras: z.string().optional(),
  lyrics: z.string().optional(),
  link_versao: z
    .string()
    .url("URL inválida")
    .refine((val) => /^https?:\/\//i.test(val), "URL deve usar protocolo http ou https")
    .optional()
    .or(z.literal("")),
});

/** Tipo inferido dos dados do formulário de edição de versão. */
export type UpdateVersaoForm = z.infer<typeof UpdateVersaoFormSchema>;
