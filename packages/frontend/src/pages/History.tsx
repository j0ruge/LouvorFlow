/**
 * Página de histórico de escalas realizadas.
 *
 * Busca eventos reais da API via React Query, filtra apenas os com data
 * anterior ou igual à data atual, e exibe em ordem cronológica decrescente.
 * Cada evento é renderizado com `EventoRow` (linha inteira clicável, mais o
 * botão "Detalhes" no slot de ações). Inclui estados de carregamento
 * (skeleton), erro e vazio.
 */

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { History as HistoryIcon } from "lucide-react";
import { useEventos } from "@/hooks/use-eventos";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { EventoRow } from "@/components/EventoRow";
import { formatDataExtenso } from "@/lib/utils";

/**
 * Componente de skeleton para a linha de evento durante carregamento.
 *
 * Reproduz a anatomia de `EventoRow` (bloco de data + corpo em 3 linhas +
 * ação) com placeholders animados — um skeleton que mentisse sobre o
 * layout real (ex.: o card de duas colunas antigo) confundiria o usuário
 * no instante em que os dados chegassem e o layout mudasse debaixo dele.
 *
 * @returns Elemento React com placeholder animado da linha de evento.
 */
function HistorySkeleton() {
  return (
    <div className="flex flex-wrap items-start gap-3 p-3 rounded-xl bg-gradient-card border border-border">
      <Skeleton className="w-[52px] h-[52px] flex-shrink-0 rounded-[10px]" />
      <div className="min-w-0 flex-1 space-y-2">
        <Skeleton className="h-4 w-40" />
        <Skeleton className="h-3 w-32" />
        <Skeleton className="h-3 w-24" />
      </div>
      <Skeleton className="h-8 w-full sm:ml-auto sm:w-24" />
    </div>
  );
}

/**
 * Componente da página de histórico de escalas realizadas.
 *
 * Consome dados reais da API via `useEventos()`, filtra eventos com data
 * passada, ordena por data decrescente e renderiza cada evento com
 * `EventoRow` (título por descrição/tipo, data por extenso como legenda,
 * contagem de músicas/integrantes e botão "Detalhes").
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
        <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
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
            <div className="space-y-2.5">
              {pastEvents.map((evento) => (
                <EventoRow
                  key={evento.id}
                  evento={evento}
                  onOpen={(id) => navigate(`/escalas/${id}`)}
                  legenda={formatDataExtenso(evento.data)}
                  acoes={
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() => navigate(`/escalas/${evento.id}`)}
                    >
                      Detalhes
                    </Button>
                  }
                />
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};

export default History;
