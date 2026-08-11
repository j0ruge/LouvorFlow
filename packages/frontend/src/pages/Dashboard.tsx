/**
 * Página principal do Dashboard.
 *
 * Exibe dados reais do servidor: total de músicas, escalas, integrantes,
 * e próximas escalas. Layout fiel ao handoff de design (Sora + tiles
 * âmbar + bloco de data nas próximas escalas).
 */

import { useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Music,
  Calendar,
  Users,
  TrendingUp,
  Plus,
  ChevronRight,
} from "lucide-react";
import { useMusicas } from "@/hooks/use-musicas";
import { useEventos } from "@/hooks/use-eventos";
import { useIntegrantes } from "@/hooks/use-integrantes";
import { getInitials } from "@/lib/utils";
import { EventoRow } from "@/components/EventoRow";

/**
 * Componente da página de Dashboard com dados reais.
 *
 * @returns Elemento JSX com o Dashboard do ministério.
 */
const Dashboard = () => {
  const navigate = useNavigate();
  const { data: musicasData, isLoading: musicasLoading } = useMusicas({
    page: 1,
    limit: 1,
  });
  const { data: eventos, isLoading: eventosLoading } = useEventos();
  const { data: integrantes, isLoading: integrantesLoading } = useIntegrantes();

  /** Total de músicas extraído dos metadados de paginação. */
  const totalMusicas = musicasData?.meta.total ?? 0;

  /** Total de integrantes (membros) vinculados ao tenant ativo. */
  const totalIntegrantes = integrantes?.length ?? 0;

  /**
   * Integrantes que exercem ao menos uma função — os únicos exibidos no card
   * "Equipe do Ministério". Derivar a lista uma vez mantém o estado vazio
   * alinhado ao que é de fato renderizado: checar apenas `integrantes.length`
   * deixaria o card em branco quando existem integrantes, porém nenhum com função.
   */
  const equipeAtiva = useMemo(
    () => integrantes?.filter((i) => i.funcoes.length > 0) ?? [],
    [integrantes],
  );

  /** Total de escalas. */
  const totalEscalas = eventos?.length ?? 0;

  /** Próximas escalas filtradas por data futura e ordenadas. */
  const proximasEscalas = useMemo(() => {
    if (!eventos) return [];
    const agora = new Date();
    return eventos
      .filter((e) => new Date(e.data) >= agora)
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime())
      .slice(0, 4);
  }, [eventos]);

  const isLoading = musicasLoading || eventosLoading || integrantesLoading;

  const stats = [
    {
      title: "Músicas",
      value: totalMusicas,
      icon: Music,
      description: "No repertório",
      tintGradient: "from-primary to-primary-light",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      title: "Escalas",
      value: totalEscalas,
      icon: Calendar,
      description: `${proximasEscalas.length} próximas`,
      tintGradient: "from-secondary to-accent",
      iconBg: "bg-accent/10",
      iconColor: "text-accent",
    },
    {
      title: "Integrantes",
      value: totalIntegrantes,
      icon: Users,
      description: "Membros ativos",
      tintGradient: "from-accent to-primary",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
    {
      title: "Eventos",
      value: proximasEscalas.length,
      icon: TrendingUp,
      description: "Futuros agendados",
      tintGradient: "from-primary-light to-secondary",
      iconBg: "bg-primary/10",
      iconColor: "text-primary",
    },
  ];

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Page head — título com gradient + botão Nova Escala */}
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl sm:text-3xl md:text-[34px] font-bold leading-[1.05] tracking-tight bg-gradient-primary bg-clip-text text-transparent">
            Dashboard
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            Visão geral do ministério de louvor
          </p>
        </div>
        <Button
          size="sm"
          className="bg-gradient-primary hover:opacity-90 text-white shadow-soft font-semibold"
          onClick={() => navigate("/escalas?nova=1")}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Escala
        </Button>
      </div>

      {/* Stat grid */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        {stats.map((stat) => (
          <div
            key={stat.title}
            className="relative overflow-hidden bg-card border border-border rounded-2xl shadow-soft hover:shadow-glow transition-all duration-300 p-4 sm:p-[18px]"
          >
            <div
              className={`absolute inset-0 bg-gradient-to-br ${stat.tintGradient} opacity-[0.06] pointer-events-none`}
            />
            <div
              className={`absolute top-3 right-3 h-8 w-8 rounded-lg ${stat.iconBg} ${stat.iconColor} flex items-center justify-center`}
            >
              <stat.icon className="h-4 w-4" />
            </div>
            <h3 className="text-[11px] font-semibold uppercase tracking-[0.04em] text-muted-foreground pr-10">
              {stat.title}
            </h3>
            {isLoading ? (
              <Skeleton className="h-8 w-16 mt-1.5" />
            ) : (
              <div className="font-display text-3xl font-bold leading-none text-foreground tabular-nums mt-1">
                {stat.value}
              </div>
            )}
            <p className="text-xs text-muted-foreground mt-1">
              {stat.description}
            </p>
          </div>
        ))}
      </div>

      {/* Two-up grid: Próximas Escalas + Equipe */}
      <div className="grid gap-4 sm:gap-[18px] md:grid-cols-2">
        {/* ── Próximas Escalas ───────────────────────────── */}
        <Card className="shadow-soft border border-border">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
            <CardTitle className="font-display text-base sm:text-lg font-semibold flex items-center gap-2 text-foreground min-w-0">
              <Calendar className="h-[18px] w-[18px] text-primary flex-shrink-0" />
              <span className="truncate">Próximas Escalas</span>
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs flex-shrink-0"
              onClick={() => navigate("/escalas")}
              aria-label="Ver todas as escalas"
            >
              <span className="hidden sm:inline">Ver todas</span>
              <ChevronRight className="sm:ml-1 h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent>
            {eventosLoading ? (
              <div className="space-y-2.5">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-[68px] w-full rounded-xl" />
                ))}
              </div>
            ) : proximasEscalas.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                Nenhuma escala futura agendada.
              </p>
            ) : (
              <div className="flex flex-col gap-2.5">
                {proximasEscalas.map((scale) => (
                  <EventoRow
                    key={scale.id}
                    evento={scale}
                    onOpen={(id) => navigate(`/escalas/${id}`)}
                  />
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        {/* ── Equipe do Ministério ──────────────────────── */}
        <Card className="shadow-soft border border-border">
          <CardHeader className="flex flex-row items-center justify-between gap-2 space-y-0 pb-3">
            <CardTitle className="font-display text-base sm:text-lg font-semibold flex items-center gap-2 text-foreground min-w-0">
              <Users className="h-[18px] w-[18px] text-primary flex-shrink-0" />
              <span className="truncate">Equipe do Ministério</span>
            </CardTitle>
            <Button
              variant="outline"
              size="sm"
              className="h-8 text-xs flex-shrink-0"
              onClick={() => navigate("/integrantes")}
              aria-label="Ver todos os integrantes"
            >
              <span className="hidden sm:inline">Ver integrantes</span>
              <ChevronRight className="sm:ml-1 h-3.5 w-3.5" />
            </Button>
          </CardHeader>
          <CardContent>
            {integrantesLoading ? (
              <div className="space-y-2">
                {Array.from({ length: 3 }).map((_, i) => (
                  <Skeleton key={i} className="h-14 w-full rounded-[10px]" />
                ))}
              </div>
            ) : equipeAtiva.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">
                {!integrantes || integrantes.length === 0
                  ? "Nenhum integrante vinculado a esta igreja."
                  : "Nenhum integrante com função atribuída."}
              </p>
            ) : (
              <div className="flex flex-col gap-2">
                {equipeAtiva
                  .slice(0, 5)
                  .map((integrante) => (
                    <div
                      key={integrante.id}
                      className="flex items-center gap-2.5 px-3 py-2.5 rounded-[10px] border border-border bg-card"
                    >
                      <div className="w-9 h-9 rounded-full bg-gradient-primary flex items-center justify-center text-white text-xs font-bold shrink-0">
                        {getInitials(integrante.nome)}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="text-sm font-semibold text-foreground leading-tight truncate">
                          {integrante.nome}
                        </div>
                        <div className="text-xs text-muted-foreground mt-0.5 truncate">
                          {integrante.funcoes.map((f) => f.nome).join(" · ")}
                        </div>
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default Dashboard;
