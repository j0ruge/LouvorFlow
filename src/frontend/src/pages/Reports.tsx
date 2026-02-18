/**
 * Página de relatórios com dados reais do sistema.
 *
 * Exibe estatísticas agregadas do ministério: total de músicas,
 * cultos realizados, média por culto, ranking de músicas mais
 * tocadas e atividade mensal. Consome endpoint de agregação backend.
 */

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { ErrorState } from "@/components/ErrorState";
import { BarChart3, TrendingUp, Music, Calendar } from "lucide-react";
import { useRelatorioResumo } from "@/hooks/use-relatorios";

/**
 * Componente principal da página de relatórios.
 *
 * @returns Elemento React com cards de resumo, ranking e atividade mensal.
 */
const Reports = () => {
  const { data, isLoading, isError, error, refetch } = useRelatorioResumo();

  if (isError) {
    return (
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Relatórios
          </h1>
          <p className="text-muted-foreground mt-1">
            Análise e estatísticas do ministério
          </p>
        </div>
        <ErrorState
          message={error?.message ?? "Erro ao carregar relatórios."}
          onRetry={() => refetch()}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Relatórios
        </h1>
        <p className="text-muted-foreground mt-1">
          Análise e estatísticas do ministério
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Ranking de Músicas Mais Tocadas */}
        <Card className="shadow-soft border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Músicas Mais Tocadas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Skeleton className="w-8 h-8 rounded-lg" />
                        <Skeleton className="h-4 w-32" />
                      </div>
                      <Skeleton className="h-4 w-16" />
                    </div>
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                ))}
              </div>
            ) : data && data.topMusicas.length > 0 ? (
              <div className="space-y-4">
                {data.topMusicas.map((musica, index) => (
                  <div key={musica.id} className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-gradient-primary flex items-center justify-center text-white font-bold text-sm">
                          {index + 1}
                        </div>
                        <span className="font-medium text-foreground">{musica.nome}</span>
                      </div>
                      <span className="text-sm font-medium text-muted-foreground">
                        {musica.vezes} vezes
                      </span>
                    </div>
                    <div className="h-2 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-primary transition-all duration-500"
                        style={{
                          width: `${(musica.vezes / data.topMusicas[0].vezes) * 100}%`,
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma música foi tocada em cultos ainda.
              </p>
            )}
          </CardContent>
        </Card>

        {/* Atividade Mensal */}
        <Card className="shadow-soft border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Atividade Mensal
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 5 }).map((_, i) => (
                  <div key={i} className="p-4 rounded-lg border border-border">
                    <div className="flex items-center justify-between mb-2">
                      <Skeleton className="h-4 w-20" />
                      <div className="flex gap-4">
                        <Skeleton className="h-4 w-16" />
                        <Skeleton className="h-4 w-16" />
                      </div>
                    </div>
                    <Skeleton className="h-2 w-full rounded-full" />
                  </div>
                ))}
              </div>
            ) : data && data.atividadeMensal.length > 0 ? (
              <div className="space-y-4">
                {data.atividadeMensal.map((item) => {
                  const maxMusicas = Math.max(...data.atividadeMensal.map((m) => m.musicas));
                  return (
                    <div key={item.mes} className="p-4 rounded-lg bg-gradient-card border border-border">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-semibold text-foreground">{item.mes}</span>
                        <div className="flex gap-4 text-sm">
                          <span className="text-muted-foreground">
                            {item.eventos} cultos
                          </span>
                          <span className="text-primary font-medium">
                            {item.musicas} músicas
                          </span>
                        </div>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className="h-full bg-gradient-primary transition-all duration-500"
                          style={{
                            width: `${maxMusicas > 0 ? (item.musicas / maxMusicas) * 100 : 0}%`,
                          }}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma atividade registrada nos últimos meses.
              </p>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Cards de Resumo */}
      <div className="grid gap-6 md:grid-cols-3">
        <Card className="shadow-soft border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Music className="h-5 w-5 text-primary" />
              Total de Músicas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="h-10 w-16" />
                <Skeleton className="h-4 w-32 mt-2" />
              </>
            ) : (
              <>
                <div className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  {data?.totalMusicas ?? 0}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {data?.totalMusicas === 0
                    ? "Nenhuma música cadastrada"
                    : "Músicas cadastradas no sistema"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-soft border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <Calendar className="h-5 w-5 text-primary" />
              Cultos Realizados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="h-10 w-16" />
                <Skeleton className="h-4 w-32 mt-2" />
              </>
            ) : (
              <>
                <div className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  {data?.totalEventos ?? 0}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {data?.totalEventos === 0
                    ? "Nenhum culto realizado"
                    : "Cultos já realizados"}
                </p>
              </>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-soft border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-base">
              <BarChart3 className="h-5 w-5 text-primary" />
              Média por Culto
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <>
                <Skeleton className="h-10 w-16" />
                <Skeleton className="h-4 w-32 mt-2" />
              </>
            ) : (
              <>
                <div className="text-4xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                  {data?.mediaPorEvento.toFixed(1) ?? "0.0"}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {data?.totalEventos === 0
                    ? "Sem dados para calcular"
                    : "Músicas por culto"}
                </p>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Reports;
