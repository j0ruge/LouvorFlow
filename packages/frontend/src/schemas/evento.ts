/**
 * Schemas Zod para o módulo de eventos (escalas).
 *
 * Define os formatos de resposta da API (listagem, detalhe, criação)
 * e o schema de validação do formulário de criação.
 */

import { z } from "zod";
import { IdNomeSchema, TonalidadeSchema } from "@/schemas/shared";
import { CIFRACLUB_LIST_URL_REGEX } from "@/lib/cifraclub-list-url";

/**
 * Refine de URL para RESPOSTAS da API: aceita vazio ("") ou protocolo http/https.
 * Camada de defesa em profundidade contra protocolos perigosos (`javascript:`,
 * `data:`); a renderização ainda deve usar `isSafeUrl()` antes de aplicar a URL
 * em `href`. É intencionalmente lenient (não usa `.url()`) para não quebrar o
 * parse de toda a resposta caso o backend retorne uma URL ligeiramente fora do
 * padrão — apenas protocolos inseguros são rejeitados aqui.
 */
const httpUrlOrEmpty = (val: string) => val === "" || /^https?:\/\//i.test(val);

/**
 * Campo de URL de lista CifraClub para FORMULÁRIOS (entrada do usuário).
 * Estrito: exige o formato exato de lista CifraClub via `CIFRACLUB_LIST_URL_REGEX`
 * (mesmo contrato do backend — falha cedo no cliente para links fora do padrão,
 * como YouTube, em vez de só rejeitar após a submissão). O regex já exige `https://`
 * com host, então cobre os casos de protocolo inseguro e URL sem host. Aceita "",
 * null ou ausente como "não informado".
 */
const cifraclubListUrlFormField = z
  .string()
  .regex(
    CIFRACLUB_LIST_URL_REGEX,
    "URL deve seguir o padrão https://www.cifraclub.com.br/musico/{userId}/repertorio/{listId}/",
  )
  .or(z.literal(""))
  .nullable()
  .optional();

/** Schema de versão de música (artista + link) no contexto de evento. */
export const VersaoMusicaSchema = z.object({
  id: z.string().uuid(),
  artista_nome: z.string().nullable(),
  link_versao: z.string().nullable(),
  /** URL da cifra no CifraClub. Nulo quando não informado. */
  cifraclub_url: z.string().refine(
    httpUrlOrEmpty,
    "URL deve usar protocolo http ou https",
  ).nullable().default(null),
});

/** Tipo inferido de versão de música. */
export type VersaoMusica = z.infer<typeof VersaoMusicaSchema>;

/** Schema de música simplificada no contexto de evento, incluindo posição na escala e versões. */
export const MusicaEventoSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  tonalidade: TonalidadeSchema.nullable(),
  ordem: z.number().int(),
  versao_selecionada: VersaoMusicaSchema.nullable(),
  versoes_disponiveis: z.array(VersaoMusicaSchema),
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
  /** URL da lista do repertório no CifraClub. Nula quando não configurada. */
  cifraclub_list_url: z
    .string()
    .refine(httpUrlOrEmpty, "URL deve usar protocolo http ou https")
    .nullable()
    .default(null),
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
  /** URL da lista do repertório no CifraClub. Nula quando não configurada. */
  cifraclub_list_url: z
    .string()
    .refine(httpUrlOrEmpty, "URL deve usar protocolo http ou https")
    .nullable()
    .default(null),
  /** Data/hora (ISO) da última sincronização da lista CifraClub. */
  cifraclub_list_url_updated_at: z.string().nullable().default(null),
  /** Heurística best-effort: true quando a lista pode estar desatualizada em relação às músicas. */
  cifraclub_list_url_stale: z.boolean().default(false),
  tipoEvento: IdNomeSchema.nullable(),
  musicas: z.array(MusicaEventoSchema),
  integrantes: z.array(IntegranteEventoSchema),
});

/** Tipo inferido do detalhe completo de evento. */
export type EventoShow = z.infer<typeof EventoShowSchema>;

/** Schema base do evento retornado em respostas de criação/atualização. */
const EventoResponseBaseSchema = z.object({
  id: z.string().uuid(),
  data: z.string(),
  descricao: z.string(),
  /** URL da lista do repertório no CifraClub. Nula quando não configurada. */
  cifraclub_list_url: z
    .string()
    .refine(httpUrlOrEmpty, "URL deve usar protocolo http ou https")
    .nullable()
    .default(null),
  /** Data/hora (ISO) da última sincronização da lista CifraClub. */
  cifraclub_list_url_updated_at: z.string().nullable().default(null),
  tipoEvento: IdNomeSchema.nullable(),
});

/** Schema da resposta de criação de evento. */
export const EventoCreateResponseSchema = z.object({
  msg: z.string(),
  evento: EventoResponseBaseSchema,
});

/** Tipo inferido da resposta de criação de evento. */
export type EventoCreateResponse = z.infer<typeof EventoCreateResponseSchema>;

/** Schema da resposta de atualização de evento. */
export const EventoUpdateResponseSchema = z.object({
  msg: z.string(),
  evento: EventoResponseBaseSchema,
});

/** Tipo inferido da resposta de atualização de evento. */
export type EventoUpdateResponse = z.infer<typeof EventoUpdateResponseSchema>;

/** Schema de validação do formulário de criação de evento. */
export const CreateEventoFormSchema = z.object({
  data: z.string().min(1, "Data é obrigatória").refine(
    (val) => {
      const d = new Date(val);
      return !isNaN(d.getTime()) && d.getFullYear() >= 1900 && d.getFullYear() <= 9999;
    },
    "Data inválida ou ano fora do intervalo permitido",
  ),
  fk_tipo_evento: z.string().uuid("Selecione um tipo de evento"),
  descricao: z.string().optional().default(""),
  cifraclub_list_url: cifraclubListUrlFormField.default(null),
});

/** Tipo inferido dos dados do formulário de criação de evento. */
export type CreateEventoForm = z.infer<typeof CreateEventoFormSchema>;

/** Schema de validação do formulário de edição de evento. */
export const UpdateEventoFormSchema = z.object({
  data: z.string().optional().refine(
    (val) => {
      if (val === undefined || val === "") return true;
      const d = new Date(val);
      return !isNaN(d.getTime()) && d.getFullYear() >= 1900 && d.getFullYear() <= 9999;
    },
    "Data inválida ou ano fora do intervalo permitido",
  ),
  fk_tipo_evento: z.string().uuid("Selecione um tipo de evento").optional(),
  descricao: z.string().optional(),
  cifraclub_list_url: cifraclubListUrlFormField,
});

/** Tipo inferido dos dados do formulário de edição de evento. */
export type UpdateEventoForm = z.infer<typeof UpdateEventoFormSchema>;
