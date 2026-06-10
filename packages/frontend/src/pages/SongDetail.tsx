/**
 * Página de detalhes de uma música.
 *
 * Renderizada na rota `/musicas/:id`. Carrega os dados da música
 * via `useMusica(id)`, exibe o componente MusicaDetail com edição,
 * versões, categorias e funções.
 *
 * Navegação:
 * - **Voltar** respeita `location.state.from` (preserva filtros/página).
 * - **Excluir** sempre redireciona para `/musicas` (sem filtros) para
 *   evitar empty-state quando a música deletada era a única visível na
 *   página filtrada de origem.
 */

import { useParams, useNavigate, useLocation } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { useMusica } from "@/hooks/use-musicas";
import { MusicaDetail } from "@/components/MusicaDetail";
import { ErrorState } from "@/components/ErrorState";
import { useScrollToTopOnMount } from "@/hooks/use-scroll-restoration";

/**
 * Componente da página de detalhes da música.
 *
 * @returns Elemento JSX com a página de detalhes.
 */
const SongDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const location = useLocation();

  // O container de rolagem é compartilhado entre páginas: garante abrir no topo.
  useScrollToTopOnMount();

  /**
   * Extrai com narrowing explícito o campo `from` de `location.state` sem
   * usar `as` para casting cego. Apenas aceita um objeto literal com
   * propriedade string — qualquer outro formato cai no fallback.
   */
  const state = location.state;
  const rawFrom =
    state !== null &&
    typeof state === "object" &&
    "from" in state &&
    typeof (state as Record<string, unknown>).from === "string"
      ? (state as { from: string }).from
      : undefined;
  /**
   * URL para a qual o botão "Voltar" deve retornar (estado preservado vindo da lista).
   *
   * Aceita apenas paths internos (`/...`) e descarta `//host` (protocol-relative URLs) —
   * defesa em profundidade contra navegação manipulada via `location.state`.
   */
  const backTo =
    rawFrom && rawFrom.startsWith("/") && !rawFrom.startsWith("//")
      ? rawFrom
      : "/musicas";

  const {
    data: musica,
    isLoading,
    isError,
    error,
    refetch,
  } = useMusica(id ?? null);

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-32 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
        <Skeleton className="h-32 w-full rounded-lg" />
      </div>
    );
  }

  if (isError || !musica) {
    return (
      <ErrorState
        message={error?.message ?? "Erro ao carregar detalhes da música."}
        onRetry={() => refetch()}
      />
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate(backTo)}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar
        </Button>
        <div>
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Detalhes da Música
          </h1>
        </div>
      </div>

      <MusicaDetail
        musica={musica}
        onDeleted={() => navigate("/musicas")}
      />
    </div>
  );
};

export default SongDetail;
