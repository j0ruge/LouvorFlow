/**
 * Página principal do Dashboard.
 *
 * Exibe dados reais do servidor: total de músicas, escalas, integrantes,
 * e próximas escalas. Usa hooks do React Query para carregar dados
 * e calcular estatísticas no cliente.
 */

import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Music, Calendar, Users, TrendingUp } from "lucide-react";
import { useMusicas } from "@/hooks/use-musicas";
import { useEventos } from "@/hooks/use-eventos";
import { useIntegrantes } from "@/hooks/use-integrantes";

/**
 * Componente da página de Dashboard com dados reais.
 *
 * @returns Elemento JSX com o Dashboard do ministério.
 */
const Dashboard = () => {
  const { data: musicasData, isLoading: musicasLoading } = useMusicas(1, 1);
  const { data: eventos, isLoading: eventosLoading } = useEventos();
  const { data: integrantes, isLoading: integrantesLoading } = useIntegrantes();

  /** Total de músicas extraído dos metadados de paginação. */
  const totalMusicas = musicasData?.meta.total ?? 0;

  /** Total de integrantes. */
  const totalIntegrantes = integrantes?.length ?? 0;

  /** Total de escalas. */
  const totalEscalas = eventos?.length ?? 0;

  /** Próximas escalas filtradas por data futura e ordenadas. */
  const proximasEscalas = useMemo(() => {
    if (!eventos) return [];
    const agora = new Date();
    return eventos
      .filter((e) => new Date(e.data) >= agora)
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
      .slice(0, 5);
  }, [eventos]);

  const isLoading = musicasLoading || eventosLoading || integrantesLoading;

  const stats = [
    {
      title: "Total de Músicas",
      value: totalMusicas,
      icon: Music,
      description: "Cadastradas no repertório",
      gradient: "from-primary to-primary-light",
    },
    {
      title: "Escalas",
      value: totalEscalas,
      icon: Calendar,
      description: `${proximasEscalas.length} próximas`,
      gradient: "from-secondary to-accent",
    },
    {
      title: "Integrantes",
      value: totalIntegrantes,
      icon: Users,
      description: "Membros do ministério",
      gradient: "from-accent to-primary",
    },
    {
      title: "Próximos Eventos",
      value: proximasEscalas.length,
      icon: TrendingUp,
      description: "Eventos futuros agendados",
      gradient: "from-primary-light to-secondary",
    },
  ];

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Dashboard
        </h1>
        <p className="text-muted-foreground mt-1">
          Visão geral do ministério de louvor
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => (
          <Card
            key={stat.title}
            className="relative overflow-hidden border-0 shadow-medium hover:shadow-glow transition-all duration-300"
          >
            <div className={`absolute inset-0 bg-gradient-to-br ${stat.gradient} opacity-5`} />
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">
                {stat.title}
              </CardTitle>
              <stat.icon className="h-5 w-5 text-primary" />
            </CardHeader>
            <CardContent>
              {isLoading ? (
                <Skeleton className="h-8 w-16" />
              ) : (
                <div className="text-3xl font-bold text-foreground">
                  {stat.value}
                </div>
              )}
              <p className="text-xs text-muted-foreground mt-1">
                {stat.description}
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        <Card className="shadow-soft border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5 text-primary" />
              Próximas Escalas
            </CardTitle>
          </CardHeader>
          <CardContent>
            {eventosLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : proximasEscalas.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma escala futura agendada.
              </p>
            ) : (
              <div className="space-y-4">
                {proximasEscalas.map((scale) => (
                  <div
                    key={scale.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-gradient-card border border-border"
                  >
                    <div className="space-y-1">
                      <p className="font-medium text-foreground">
                        {scale.tipoEvento?.nome ?? "Evento"}
                      </p>
                      <p className="text-sm text-muted-foreground">
                        {new Date(scale.data).toLocaleDateString("pt-BR")} •{" "}
                        {scale.musicas.length} músicas •{" "}
                        {scale.integrantes.length} integrantes
                      </p>
                    </div>
                    {scale.tipoEvento && (
                      <div className="px-3 py-1 rounded-full text-xs font-medium bg-primary/10 text-primary">
                        {scale.tipoEvento.nome}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="shadow-soft border-0">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              Resumo do Ministério
            </CardTitle>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="space-y-4">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-16 w-full rounded-lg" />
                ))}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-card border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center text-white font-bold">
                      <Music className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Repertório</p>
                      <p className="text-sm text-muted-foreground">
                        {totalMusicas} músicas cadastradas
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-card border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center text-white font-bold">
                      <Users className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Equipe</p>
                      <p className="text-sm text-muted-foreground">
                        {totalIntegrantes} integrantes ativos
                      </p>
                    </div>
                  </div>
                </div>
                <div className="flex items-center justify-between p-4 rounded-lg bg-gradient-card border border-border">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-gradient-primary flex items-center justify-center text-white font-bold">
                      <Calendar className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">Agenda</p>
                      <p className="text-sm text-muted-foreground">
                        {totalEscalas} escalas criadas
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
