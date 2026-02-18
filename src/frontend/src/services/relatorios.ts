/**
 * Serviço de relatórios — chamadas à API REST.
 *
 * Função para buscar o resumo completo de relatórios do servidor,
 * validando a resposta com schema Zod.
 */

import { apiFetch } from "@/lib/api";
import { RelatorioResumoSchema, type RelatorioResumo } from "@/schemas/relatorio";

/**
 * Busca o resumo completo de relatórios do servidor.
 *
 * @returns Objeto RelatorioResumo validado com totais, ranking e atividade mensal.
 */
export async function getRelatorioResumo(): Promise<RelatorioResumo> {
  const data = await apiFetch<unknown>("/relatorios/resumo");
  return RelatorioResumoSchema.parse(data);
}
