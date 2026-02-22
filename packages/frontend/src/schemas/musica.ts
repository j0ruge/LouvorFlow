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

/** Schema do campo BPM para formulários de versão. */
const bpmFormField = z.coerce.number().min(1, "BPM deve ser maior que 0").optional().or(z.literal(""));

/** Schema do campo link_versao para formulários de versão. */
const linkVersaoFormField = z
  .string()
  .url("URL inválida")
  .refine((val) => /^https?:\/\//i.test(val), "URL deve usar protocolo http ou https")
  .optional()
  .or(z.literal(""));

/**
 * Verifica se algum campo de versão foi preenchido (não vazio e não undefined).
 *
 * @param data - Dados do formulário com campos de versão opcionais.
 * @returns `true` se ao menos um campo de versão estiver preenchido.
 */
function temCamposVersaoPreenchidos(
  data: { bpm?: number | ""; cifras?: string; lyrics?: string; link_versao?: string },
): boolean {
  return (
    (data.bpm !== undefined && data.bpm !== "") ||
    (data.cifras !== undefined && data.cifras !== "") ||
    (data.lyrics !== undefined && data.lyrics !== "") ||
    (data.link_versao !== undefined && data.link_versao !== "")
  );
}

/** Schema de validação do formulário de criação de versão. */
export const CreateVersaoFormSchema = z.object({
  artista_id: z.string().uuid("Selecione um artista"),
  bpm: bpmFormField,
  cifras: z.string().optional(),
  lyrics: z.string().optional(),
  link_versao: linkVersaoFormField,
});

/** Tipo inferido dos dados do formulário de criação de versão. */
export type CreateVersaoForm = z.infer<typeof CreateVersaoFormSchema>;

/** Schema de validação do formulário de edição de versão. */
export const UpdateVersaoFormSchema = z.object({
  bpm: bpmFormField,
  cifras: z.string().optional(),
  lyrics: z.string().optional(),
  link_versao: linkVersaoFormField,
});

/** Tipo inferido dos dados do formulário de edição de versão. */
export type UpdateVersaoForm = z.infer<typeof UpdateVersaoFormSchema>;

/**
 * Schema de validação do formulário de criação completa de música.
 * Inclui campos da música e da versão opcional, com validação cruzada:
 * artista é obrigatório quando qualquer campo de versão está preenchido.
 */
export const CreateMusicaCompleteFormSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  fk_tonalidade: z.string().uuid().optional().or(z.literal("")),
  artista_id: z.string().uuid().optional().or(z.literal("")),
  bpm: bpmFormField,
  cifras: z.string().optional(),
  lyrics: z.string().optional(),
  link_versao: linkVersaoFormField,
  categoria_ids: z.array(z.string().uuid()).optional().default([]),
  funcao_ids: z.array(z.string().uuid()).optional().default([]),
}).superRefine((data, ctx) => {
  if (temCamposVersaoPreenchidos(data) && (!data.artista_id || data.artista_id === "")) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: "Artista é obrigatório quando campos de versão são preenchidos",
      path: ["artista_id"],
    });
  }
});

/** Tipo inferido dos dados do formulário de criação completa de música. */
export type CreateMusicaCompleteForm = z.infer<typeof CreateMusicaCompleteFormSchema>;

/**
 * Schema de validação do formulário de edição completa de música.
 * Estende a criação completa adicionando `versao_id` para atualizar a versão existente.
 */
export const UpdateMusicaCompleteFormSchema = z.object({
  nome: z.string().min(1, "Nome é obrigatório"),
  fk_tonalidade: z.string().uuid().optional().or(z.literal("")),
  versao_id: z.string().uuid().optional().or(z.literal("")),
  bpm: bpmFormField,
  cifras: z.string().optional(),
  lyrics: z.string().optional(),
  link_versao: linkVersaoFormField,
  categoria_ids: z.array(z.string().uuid()).optional().default([]),
  funcao_ids: z.array(z.string().uuid()).optional().default([]),
});

/** Tipo inferido dos dados do formulário de edição completa de música. */
export type UpdateMusicaCompleteForm = z.infer<typeof UpdateMusicaCompleteFormSchema>;

/** Schema da resposta de criação/atualização completa de música (música completa com relacionamentos). */
export const MusicaCompleteResponseSchema = z.object({
  msg: z.string(),
  musica: MusicaSchema,
});

/** Tipo inferido da resposta de criação/atualização completa de música. */
export type MusicaCompleteResponse = z.infer<typeof MusicaCompleteResponseSchema>;
