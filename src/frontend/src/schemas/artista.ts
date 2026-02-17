/**
 * Schemas Zod para o módulo de artistas.
 *
 * Define os formatos de resposta da API (listagem, criação/edição)
 * e os schemas de validação dos formulários de criação e atualização.
 */

import { z } from "zod";

/** Schema de um artista (id + nome). */
export const ArtistaSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
});

/** Tipo inferido de um artista. */
export type Artista = z.infer<typeof ArtistaSchema>;

/** Schema da resposta de criação/edição de artista. */
export const ArtistaResponseSchema = z.object({
  msg: z.string(),
  artista: ArtistaSchema,
});

/** Tipo inferido da resposta de criação/edição de artista. */
export type ArtistaResponse = z.infer<typeof ArtistaResponseSchema>;

/** Schema de validação do formulário de criação de artista. */
export const CreateArtistaFormSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório"),
});

/** Tipo inferido dos dados do formulário de criação de artista. */
export type CreateArtistaForm = z.infer<typeof CreateArtistaFormSchema>;

/** Schema de validação do formulário de edição de artista. */
export const UpdateArtistaFormSchema = z.object({
  nome: z.string().trim().min(1, "Nome é obrigatório"),
});

/** Tipo inferido dos dados do formulário de edição de artista. */
export type UpdateArtistaForm = z.infer<typeof UpdateArtistaFormSchema>;
