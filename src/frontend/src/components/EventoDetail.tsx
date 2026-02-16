/**
 * Componente de detalhe de evento (escala).
 *
 * Exibe dados completos do evento usando `useEvento(id)`, lista músicas
 * e integrantes associados, e permite adicionar/remover associações
 * usando selects populados com dados de `useMusicas` e `useIntegrantes`.
 */

import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Calendar,
  Music,
  Users,
  Plus,
  X,
  ArrowLeft,
  Guitar,
} from "lucide-react";
import {
  useEvento,
  useAddMusicaToEvento,
  useRemoveMusicaFromEvento,
  useAddIntegranteToEvento,
  useRemoveIntegranteFromEvento,
} from "@/hooks/use-eventos";
import { useMusicas } from "@/hooks/use-musicas";
import { useIntegrantes } from "@/hooks/use-integrantes";
import { ErrorState } from "@/components/ErrorState";

/**
 * Página de detalhe de evento com gerenciamento de associações.
 *
 * Renderizada na rota `/escalas/:id`. Permite visualizar e gerenciar
 * as músicas e integrantes associados ao evento.
 *
 * @returns Elemento React com o detalhe do evento.
 */
export function EventoDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedMusicaId, setSelectedMusicaId] = useState("");
  const [selectedIntegranteId, setSelectedIntegranteId] = useState("");

  const {
    data: evento,
    isLoading,
    isError,
    error,
    refetch,
  } = useEvento(id ?? "");

  const { data: allMusicas } = useMusicas(1, 100);
  const { data: allIntegrantes } = useIntegrantes();

  const addMusica = useAddMusicaToEvento(id ?? "");
  const removeMusica = useRemoveMusicaFromEvento(id ?? "");
  const addIntegrante = useAddIntegranteToEvento(id ?? "");
  const removeIntegrante = useRemoveIntegranteFromEvento(id ?? "");

  if (isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-lg" />
        <Skeleton className="h-48 w-full rounded-lg" />
      </div>
    );
  }

  if (isError || !evento) {
    return (
      <ErrorState
        message={error?.message ?? "Erro ao carregar detalhes do evento."}
        onRetry={() => refetch()}
      />
    );
  }

  /** IDs das músicas já associadas ao evento. */
  const musicasAssociadasIds = new Set(evento.musicas.map((m) => m.id));

  /** IDs dos integrantes já associados ao evento. */
  const integrantesAssociadosIds = new Set(
    evento.integrantes.map((i) => i.id),
  );

  /** Músicas disponíveis para associação (excluindo já associadas). */
  const musicasDisponiveis =
    allMusicas?.items.filter((m) => !musicasAssociadasIds.has(m.id)) ?? [];

  /** Integrantes disponíveis para associação (excluindo já associados). */
  const integrantesDisponiveis =
    allIntegrantes?.filter((i) => !integrantesAssociadosIds.has(i.id)) ?? [];

  /**
   * Adiciona a música selecionada ao evento.
   */
  function handleAddMusica() {
    if (!selectedMusicaId) return;
    addMusica.mutate(selectedMusicaId, {
      onSuccess: () => setSelectedMusicaId(""),
    });
  }

  /**
   * Adiciona o integrante selecionado ao evento.
   */
  function handleAddIntegrante() {
    if (!selectedIntegranteId) return;
    addIntegrante.mutate(selectedIntegranteId, {
      onSuccess: () => setSelectedIntegranteId(""),
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Button
          variant="outline"
          size="sm"
          onClick={() => navigate("/escalas")}
        >
          <ArrowLeft className="h-4 w-4 mr-1" />
          Voltar
        </Button>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Detalhes da Escala
          </h1>
          <p className="text-muted-foreground mt-1">{evento.descricao}</p>
        </div>
      </div>

      <Card className="shadow-soft border-0">
        <CardHeader>
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
              <Calendar className="h-6 w-6 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">
                {evento.tipoEvento?.nome ?? "Evento"}
              </CardTitle>
              <p className="text-sm text-muted-foreground mt-1">
                {new Date(evento.data).toLocaleDateString("pt-BR", {
                  weekday: "long",
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                  hour: "2-digit",
                  minute: "2-digit",
                })}
              </p>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Músicas associadas */}
      <Card className="shadow-soft border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Music className="h-5 w-5" />
            Músicas ({evento.musicas.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Select
              value={selectedMusicaId}
              onValueChange={setSelectedMusicaId}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecione uma música para adicionar" />
              </SelectTrigger>
              <SelectContent>
                {musicasDisponiveis.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.nome}
                    {m.tonalidade ? ` (${m.tonalidade.tom})` : ""}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={handleAddMusica}
              disabled={!selectedMusicaId || addMusica.isPending}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {evento.musicas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma música associada. Selecione acima para adicionar.
            </p>
          ) : (
            <div className="space-y-2">
              {evento.musicas.map((musica) => (
                <div
                  key={musica.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3">
                    <Music className="h-4 w-4 text-primary" />
                    <span className="font-medium">{musica.nome}</span>
                    {musica.tonalidade && (
                      <Badge variant="outline" className="text-xs">
                        <Guitar className="h-3 w-3 mr-1" />
                        {musica.tonalidade.tom}
                      </Badge>
                    )}
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeMusica.mutate(musica.id)}
                    disabled={removeMusica.isPending}
                  >
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Integrantes associados */}
      <Card className="shadow-soft border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Integrantes ({evento.integrantes.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Select
              value={selectedIntegranteId}
              onValueChange={setSelectedIntegranteId}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecione um integrante para adicionar" />
              </SelectTrigger>
              <SelectContent>
                {integrantesDisponiveis.map((i) => (
                  <SelectItem key={i.id} value={i.id}>
                    {i.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={handleAddIntegrante}
              disabled={!selectedIntegranteId || addIntegrante.isPending}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>

          {evento.integrantes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhum integrante associado. Selecione acima para adicionar.
            </p>
          ) : (
            <div className="space-y-2">
              {evento.integrantes.map((integrante) => (
                <div
                  key={integrante.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3">
                    <Users className="h-4 w-4 text-primary" />
                    <span className="font-medium">{integrante.nome}</span>
                    <div className="flex gap-1">
                      {integrante.funcoes.map((f) => (
                        <Badge
                          key={f.id}
                          variant="outline"
                          className="text-xs"
                        >
                          {f.nome}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeIntegrante.mutate(integrante.id)}
                    disabled={removeIntegrante.isPending}
                  >
                    <X className="h-4 w-4 text-destructive" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
