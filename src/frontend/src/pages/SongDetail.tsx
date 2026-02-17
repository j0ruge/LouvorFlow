/**
 * Página de detalhes de uma música.
 *
 * Renderizada na rota `/musicas/:id`. Carrega os dados da música
 * via `useMusica(id)`, exibe o componente MusicaDetail com edição,
 * versões, tags e funções. Redireciona para `/musicas` após exclusão.
 */

import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
import { useMusica } from "@/hooks/use-musicas";
import { MusicaDetail } from "@/components/MusicaDetail";
import { ErrorState } from "@/components/ErrorState";

/**
 * Componente da página de detalhes da música.
 *
 * @returns Elemento JSX com a página de detalhes.
 */
const SongDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

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
          onClick={() => navigate("/musicas")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
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
