/**
 * Página de gerenciamento de escalas (eventos) do ministério.
 *
 * Carrega dados reais da API via React Query, exibe estados de
 * loading (Skeleton), erro (ErrorState) e vazio (EmptyState),
 * e permite criar novos eventos via formulário em dialog.
 * O botão "Ver Detalhes" navega para `/escalas/:id`.
 */

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Plus, Users, Music } from "lucide-react";
import { useEventos } from "@/hooks/use-eventos";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { EventoForm } from "@/components/EventoForm";

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
 * Exibe a lista de eventos (escalas) com seus integrantes e músicas,
 * permite criar novos eventos via dialog e navegar para detalhes.
 * Utiliza React Query para busca de dados e gerenciamento de estado.
 *
 * @returns Elemento JSX com a página de escalas.
 */
const Scales = () => {
  const [formOpen, setFormOpen] = useState(false);
  const navigate = useNavigate();
  const { data: scales, isLoading, isError, error, refetch } = useEventos();

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Escalas
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as escalas de culto
          </p>
        </div>
        <Button
          className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-soft"
          onClick={() => setFormOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Escala
        </Button>
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
        <div className="space-y-4">
          {scales.map((scale) => (
            <Card
              key={scale.id}
              className="shadow-soft border-0 hover:shadow-medium transition-all duration-300"
            >
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                      <Calendar className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">
                        {new Date(scale.data).toLocaleDateString("pt-BR", {
                          weekday: "long",
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                        })}
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
                      className="bg-primary text-primary-foreground"
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

                <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    <Music className="h-4 w-4" />
                    {scale.musicas.length} músicas selecionadas
                  </div>
                  <div className="flex gap-2">
                    <span tabIndex={0} title="Em breve" className="inline-flex">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        aria-label="Editar — em breve"
                      >
                        Editar
                      </Button>
                    </span>
                    <span tabIndex={0} title="Em breve" className="inline-flex">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled
                        aria-label="Compartilhar — em breve"
                      >
                        Compartilhar
                      </Button>
                    </span>
                    <Button
                      variant="default"
                      size="sm"
                      className="bg-gradient-primary"
                      onClick={() => navigate(`/escalas/${scale.id}`)}
                    >
                      Ver Detalhes
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      <EventoForm open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
};

export default Scales;
