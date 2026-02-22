/**
 * Página de histórico de escalas realizadas.
 *
 * Busca eventos reais da API via React Query, filtra apenas os com data
 * anterior ou igual à data atual, e exibe em ordem cronológica decrescente.
 * Inclui estados de carregamento (skeleton), erro e vazio.
 * O botão "Ver Detalhes" navega para `/escalas/:id`.
 */

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { History as HistoryIcon, Calendar, Music, Users } from "lucide-react";
import { useEventos } from "@/hooks/use-eventos";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";

/**
 * Componente de skeleton para o card de evento durante carregamento.
 *
 * Reproduz a estrutura visual do card de histórico com placeholders animados.
 *
 * @returns Elemento React com placeholder animado do card de evento.
 */
function HistorySkeleton() {
  return (
    <div className="p-5 rounded-lg bg-gradient-card border border-border">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Skeleton className="w-14 h-14 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
        <div className="flex items-center gap-6">
          <div className="text-center space-y-1">
            <Skeleton className="h-4 w-16" />
            <Skeleton className="h-7 w-8 mx-auto" />
          </div>
          <div className="text-center space-y-1">
            <Skeleton className="h-4 w-14" />
            <Skeleton className="h-7 w-8 mx-auto" />
          </div>
          <div className="flex flex-col gap-2">
            <Skeleton className="h-6 w-32" />
            <Skeleton className="h-8 w-24" />
          </div>
        </div>
      </div>
    </div>
  );
}

/**
 * Componente da página de histórico de escalas realizadas.
 *
 * Consome dados reais da API via `useEventos()`, filtra eventos com data
 * passada, ordena por data decrescente e renderiza cards com tipo de evento,
 * data formatada, contagem de músicas/integrantes e descrição.
 *
 * @returns Elemento JSX com a página de histórico.
 */
const History = () => {
  const navigate = useNavigate();
  const { data: eventos, isLoading, isError, error, refetch } = useEventos();

  /**
   * Filtra eventos com data anterior ou igual à data atual e ordena
   * por data decrescente (mais recentes primeiro).
   */
  const pastEvents = useMemo(() => {
    if (!eventos) return [];
    const today = new Date();
    today.setHours(23, 59, 59, 999);
    return eventos
      .filter((evento) => new Date(evento.data) <= today)
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
  }, [eventos]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Histórico
        </h1>
        <p className="text-muted-foreground mt-1">
          Consulte escalas e cultos anteriores
        </p>
      </div>

      {isLoading && (
        <Card className="shadow-soft border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HistoryIcon className="h-5 w-5 text-primary" />
              Escalas Realizadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {Array.from({ length: 3 }).map((_, i) => (
                <HistorySkeleton key={i} />
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {isError && (
        <ErrorState
          message={error?.message ?? "Erro ao carregar histórico."}
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && pastEvents.length === 0 && (
        <EmptyState
          title="Nenhum histórico disponível"
          description="Ainda não há escalas realizadas para exibir."
        />
      )}

      {!isLoading && !isError && pastEvents.length > 0 && (
        <Card className="shadow-soft border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <HistoryIcon className="h-5 w-5 text-primary" />
              Escalas Realizadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {pastEvents.map((evento) => (
                <div
                  key={evento.id}
                  className="p-5 rounded-lg bg-gradient-card border border-border hover:shadow-soft transition-all duration-300"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-lg bg-gradient-primary flex items-center justify-center">
                        <Calendar className="h-7 w-7 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground text-lg">
                          {evento.tipoEvento?.nome ?? "Evento"}
                        </h3>
                        <p className="text-sm text-muted-foreground mt-1">
                          {new Date(evento.data).toLocaleDateString("pt-BR", {
                            weekday: "long",
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      <div className="text-center">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <Music className="h-4 w-4" />
                          Músicas
                        </div>
                        <p className="text-2xl font-bold text-primary">
                          {evento.musicas.length}
                        </p>
                      </div>

                      <div className="text-center">
                        <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                          <Users className="h-4 w-4" />
                          Equipe
                        </div>
                        <p className="text-2xl font-bold text-secondary">
                          {evento.integrantes.length}
                        </p>
                      </div>

                      <div className="flex flex-col gap-2">
                        {evento.descricao && (
                          <Badge variant="outline" className="justify-center">
                            {evento.descricao}
                          </Badge>
                        )}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => navigate(`/escalas/${evento.id}`)}
                        >
                          Ver Detalhes
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default History;
