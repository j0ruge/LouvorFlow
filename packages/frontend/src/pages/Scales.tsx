/**
 * Página de gerenciamento de escalas (eventos) do ministério.
 *
 * Carrega dados reais da API via React Query, exibe estados de
 * loading (Skeleton), erro (ErrorState) e vazio (EmptyState),
 * e permite criar, editar e excluir eventos via dialogs.
 * Separa escalas em abas "Próximas" e "Passadas" para navegação elegante.
 * O botão "Ver Detalhes" navega para `/escalas/:id`.
 */

import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Calendar, Plus, Users, Music, Search } from "lucide-react";
import { useEventos, useDeleteEvento } from "@/hooks/use-eventos";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { EventoForm } from "@/components/EventoForm";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { useCan } from "@/hooks/use-can";
import type { EventoIndex } from "@/schemas/evento";

/**
 * Componente de skeleton para o card de evento durante carregamento.
 *
 * @returns Elemento React com placeholder animado.
 */
function ScaleSkeleton() {
  return (
    <Card className="border-0">
      <CardHeader>
        <div className="flex items-center gap-3">
          <Skeleton className="w-12 h-12 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-5 w-40" />
            <Skeleton className="h-4 w-56" />
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-3 w-24" />
            <Skeleton className="h-3 w-28" />
          </div>
          <div className="space-y-2">
            <Skeleton className="h-4 w-28" />
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-3 w-24" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Componente da página de escalas do ministério.
 *
 * Exibe a lista de eventos (escalas) separada em abas "Próximas" e "Passadas",
 * permite criar, editar e excluir eventos via dialogs e navegar para detalhes.
 * Utiliza React Query para busca de dados e gerenciamento de estado.
 *
 * @returns Elemento JSX com a página de escalas.
 */
const Scales = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingEvento, setEditingEvento] = useState<EventoIndex | null>(null);
  const [deletingEvento, setDeletingEvento] = useState<EventoIndex | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const { data: scales, isLoading, isError, error, refetch } = useEventos();
  const deleteEvento = useDeleteEvento();
  const { can: canWrite } = useCan("escalas.write");

  /**
   * Separa as escalas em próximas (data >= início do dia) e passadas,
   * aplicando o filtro de busca. Próximas ordenadas por data ASC.
   * Passadas ordenadas por data DESC.
   */
  const { upcoming, past } = useMemo(() => {
    if (!scales) return { upcoming: [], past: [] };
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const q = searchQuery.trim().toLowerCase();

    /** Filtra um array de escalas pelo termo de busca. */
    function applySearch(items: EventoIndex[]): EventoIndex[] {
      if (!q) return items;
      return items.filter((s) => {
        const dateStr = new Date(s.data).toLocaleDateString("pt-BR", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        });
        return (
          dateStr.toLowerCase().includes(q) ||
          s.descricao?.toLowerCase().includes(q) ||
          s.tipoEvento?.nome.toLowerCase().includes(q) ||
          s.integrantes.some((i) => i.nome.toLowerCase().includes(q)) ||
          s.musicas.some((m) => m.nome.toLowerCase().includes(q))
        );
      });
    }

    const upcomingList = scales
      .filter((s) => new Date(s.data) >= today)
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    const pastList = scales
      .filter((s) => new Date(s.data) < today)
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    return {
      upcoming: applySearch(upcomingList),
      past: applySearch(pastList),
    };
  }, [scales, searchQuery]);

  /** Abre o formulário em modo edição para o evento informado. */
  function handleEdit(evento: EventoIndex) {
    setEditingEvento(evento);
    setFormOpen(true);
  }

  /** Controla a visibilidade do dialog do formulário. */
  function handleFormOpenChange(open: boolean) {
    setFormOpen(open);
    if (!open) setEditingEvento(null);
  }

  /** Confirma e executa a exclusão do evento selecionado. */
  function handleConfirmDelete() {
    if (!deletingEvento) return;
    deleteEvento.mutate(deletingEvento.id, {
      onSuccess: () => setDeletingEvento(null),
    });
  }

  /**
   * Renderiza a lista de cards de escalas.
   *
   * @param items - Array de eventos a renderizar.
   * @returns Elemento React com os cards ou null se vazio.
   */
  function renderScaleCards(items: EventoIndex[]) {
    return (
      <div className="space-y-4">
        {items.map((scale) => (
          <Card
            key={scale.id}
            className="shadow-soft border-0 hover:shadow-medium transition-all duration-300"
          >
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center shrink-0">
                    <Calendar className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <CardTitle className="text-lg sm:text-xl">
                      {new Date(scale.data)
                        .toLocaleDateString("pt-BR", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })
                        .replace(/^./, (c) => c.toUpperCase())}
                    </CardTitle>
                    {scale.descricao && (
                      <p className="text-sm text-muted-foreground mt-1">
                        {scale.descricao}
                      </p>
                    )}
                  </div>
                </div>
                {scale.tipoEvento && (
                  <Badge
                    variant="default"
                    className="bg-primary text-primary-foreground self-start sm:self-auto"
                  >
                    {scale.tipoEvento.nome}
                  </Badge>
                )}
              </div>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2">
                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Users className="h-4 w-4" />
                    Integrantes ({scale.integrantes.length})
                  </div>
                  <div className="pl-6 space-y-1">
                    {scale.integrantes.map((integrante) => (
                      <p
                        key={integrante.id}
                        className="text-sm text-foreground"
                      >
                        {integrante.nome}
                      </p>
                    ))}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
                    <Music className="h-4 w-4" />
                    Músicas ({scale.musicas.length})
                  </div>
                  <div className="pl-6 space-y-1">
                    {scale.musicas.map((musica) => (
                      <p key={musica.id} className="text-sm text-foreground">
                        {musica.nome}
                      </p>
                    ))}
                  </div>
                </div>
              </div>

              <div className="flex flex-col sm:flex-row sm:items-center justify-end gap-3 mt-4 pt-4 border-t border-border">
                <div className="flex flex-wrap gap-2">
                  {canWrite && (
                    <>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleEdit(scale)}
                      >
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="text-destructive hover:text-destructive"
                        onClick={() => setDeletingEvento(scale)}
                      >
                        Excluir
                      </Button>
                    </>
                  )}
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => navigate(`/escalas/${scale.id}`)}
                  >
                    Detalhes
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Escalas
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as escalas de culto
          </p>
        </div>
        {canWrite && (
          <Button
            className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-soft flex-shrink-0"
            onClick={() => {
              setEditingEvento(null);
              setFormOpen(true);
            }}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova Escala
          </Button>
        )}
      </div>

      <div className="relative">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Buscar por data, tipo, integrante ou música..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="pl-10"
        />
      </div>

      {isLoading && (
        <div className="space-y-4">
          {Array.from({ length: 3 }).map((_, i) => (
            <ScaleSkeleton key={i} />
          ))}
        </div>
      )}

      {isError && (
        <ErrorState
          message={error?.message ?? "Erro ao carregar escalas."}
          onRetry={() => refetch()}
        />
      )}

      {!isLoading && !isError && scales?.length === 0 && (
        <EmptyState
          title="Nenhuma escala cadastrada"
          description="Comece criando uma nova escala para organizar os cultos do ministério."
          actionLabel="Nova Escala"
          onAction={() => setFormOpen(true)}
        />
      )}

      {!isLoading && !isError && scales && scales.length > 0 && (
        <Tabs defaultValue="upcoming" className="w-full">
          <TabsList className="w-full">
            <TabsTrigger value="upcoming" className="flex-1">
              Próximas ({upcoming.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="flex-1">
              Passadas ({past.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming" className="mt-4">
            {upcoming.length === 0 ? (
              <EmptyState
                title="Nenhuma escala futura agendada"
                description="Crie uma nova escala para organizar os próximos cultos."
                actionLabel="Nova Escala"
                onAction={() => setFormOpen(true)}
              />
            ) : (
              renderScaleCards(upcoming)
            )}
          </TabsContent>
          <TabsContent value="past" className="mt-4">
            {past.length === 0 ? (
              <EmptyState
                title="Nenhuma escala passada"
                description="As escalas anteriores aparecerão aqui após suas datas."
              />
            ) : (
              renderScaleCards(past)
            )}
          </TabsContent>
        </Tabs>
      )}

      <EventoForm
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        evento={editingEvento}
      />

      <DeleteConfirmDialog
        open={!!deletingEvento}
        onOpenChange={(open) => {
          if (!open) setDeletingEvento(null);
        }}
        title="Excluir Escala"
        description="Os vínculos com músicas e integrantes desta escala serão removidos. Deseja continuar?"
        onConfirm={handleConfirmDelete}
        isLoading={deleteEvento.isPending}
      />
    </div>
  );
};

export default Scales;
