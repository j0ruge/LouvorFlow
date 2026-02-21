/**
 * Schemas Zod para o módulo de relatórios.
 *
 * Define os formatos de resposta da API de relatórios: ranking de músicas,
 * atividade mensal e resumo completo com métricas agregadas.
 */

import { z } from "zod";

/** Schema para uma música no ranking de relatórios. */
export const MusicaRankingSchema = z.object({
  id: z.string().uuid(),
  nome: z.string(),
  vezes: z.number().int().min(0),
});

/** Tipo inferido de uma música no ranking. */
export type MusicaRanking = z.infer<typeof MusicaRankingSchema>;

/** Schema para atividade mensal de relatórios. */
export const AtividadeMensalSchema = z.object({
  mes: z.string(),
  eventos: z.number().int().min(0),
  musicas: z.number().int().min(0),
});

/** Tipo inferido de atividade mensal. */
export type AtividadeMensal = z.infer<typeof AtividadeMensalSchema>;

/** Schema da resposta completa do endpoint de relatórios. */
export const RelatorioResumoSchema = z.object({
  totalMusicas: z.number().int().min(0),
  totalEventos: z.number().int().min(0),
  mediaPorEvento: z.number().min(0),
  topMusicas: z.array(MusicaRankingSchema),
  atividadeMensal: z.array(AtividadeMensalSchema),
});

/** Tipo inferido do resumo completo de relatórios. */
export type RelatorioResumo = z.infer<typeof RelatorioResumoSchema>;
