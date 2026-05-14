/**
 * Hook React Query para listar categorias do tenant.
 */

import { useQuery } from "@tanstack/react-query";
import { listCategorias } from "@/services/categorias";

/**
 * Hook que retorna todas as categorias do tenant ativo.
 *
 * Cache mantido por 5 minutos (lista raramente muda).
 *
 * @returns Resultado do `useQuery` com array de categorias.
 */
export function useCategorias() {
  return useQuery({
    queryKey: ["categorias"],
    queryFn: listCategorias,
    staleTime: 5 * 60 * 1000,
  });
}
