/**
 * Componente de detalhe de evento (escala).
 *
 * Exibe dados completos do evento usando `useEvento(id)`, lista músicas
 * e integrantes associados, e permite adicionar/remover associações
 * usando selects populados com dados de `useMusicas` e `useIntegrantes`.
 */

import { useState, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
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
  Pencil,
  Trash2,
  GripVertical,
} from "lucide-react";
import {
  useEvento,
  useUpdateEvento,
  useDeleteEvento,
  useAddMusicaToEvento,
  useRemoveMusicaFromEvento,
  useReorderMusicas,
  useAddIntegranteToEvento,
  useRemoveIntegranteFromEvento,
} from "@/hooks/use-eventos";
import { useMusicas } from "@/hooks/use-musicas";
import { useIntegrantes } from "@/hooks/use-integrantes";
import { ErrorState } from "@/components/ErrorState";
import { EventoForm } from "@/components/EventoForm";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { FuncaoSelectDialog } from "@/components/FuncaoSelectDialog";
import { useCan } from "@/hooks/use-can";
import type { IntegranteComFuncoes } from "@/schemas/integrante";
import type { MusicaEvento } from "@/schemas/evento";

/**
 * Card de música ordenável via drag-and-drop.
 * Exibe badge de posição, grip handle (para usuários com permissão) e botão de remoção.
 */
function SortableMusicaCard({
  musica,
  canWrite,
  onRemove,
  isPending,
}: {
  musica: MusicaEvento;
  canWrite: boolean;
  onRemove: () => void;
  isPending: boolean;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: musica.id, disabled: !canWrite });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`flex items-center justify-between p-3 rounded-lg border border-border ${
        isDragging ? "shadow-lg opacity-75 bg-muted/50 z-10" : ""
      }`}
    >
      <div className="flex items-center gap-2 sm:gap-3 min-w-0">
        {canWrite && (
          <button
            {...attributes}
            {...listeners}
            className="flex-shrink-0 w-11 h-11 flex items-center justify-center cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
            aria-label="Arrastar para reordenar"
          >
            <GripVertical className="h-4 w-4" />
          </button>
        )}
        <Badge variant="secondary" className="flex-shrink-0 text-xs font-mono w-6 h-6 flex items-center justify-center p-0">
          {musica.ordem}
        </Badge>
        <Music className="h-4 w-4 text-primary flex-shrink-0" />
        <span className="font-medium truncate">{musica.nome}</span>
        {musica.tonalidade && (
          <Badge variant="outline" className="text-xs flex-shrink-0">
            <Guitar className="h-3 w-3 mr-1" />
            {musica.tonalidade.tom}
          </Badge>
        )}
      </div>
      {canWrite && (
        <Button
          variant="ghost"
          size="sm"
          onClick={onRemove}
          disabled={isPending}
          className="flex-shrink-0"
        >
          <X className="h-4 w-4 text-destructive" />
        </Button>
      )}
    </div>
  );
}

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
  const [removingMusicaId, setRemovingMusicaId] = useState<string | null>(null);
  const [editFormOpen, setEditFormOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [funcaoDialogIntegrante, setFuncaoDialogIntegrante] =
    useState<IntegranteComFuncoes | null>(null);

  const {
    data: evento,
    isLoading,
    isError,
    error,
    refetch,
  } = useEvento(id ?? "");

  const { data: allMusicas } = useMusicas(1, 100);
  const { data: allIntegrantes } = useIntegrantes();

  const updateEvento = useUpdateEvento();
  const deleteEvento = useDeleteEvento();
  const addMusica = useAddMusicaToEvento(id ?? "");
  const removeMusica = useRemoveMusicaFromEvento(id ?? "");
  const reorderMusicas = useReorderMusicas(id ?? "");
  const addIntegrante = useAddIntegranteToEvento(id ?? "");
  const removeIntegrante = useRemoveIntegranteFromEvento(id ?? "");
  const { can: canWrite } = useCan("escalas.write");

  /** Sensores de drag-and-drop: PointerSensor para desktop, TouchSensor com long press para mobile. */
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 250, tolerance: 5 },
  });
  const sensors = useSensors(pointerSensor, touchSensor);

  /** IDs das músicas ordenados para o SortableContext. */
  const musicaIds = useMemo(
    () => evento?.musicas.map((m) => m.id) ?? [],
    [evento?.musicas],
  );

  /**
   * Handler de fim de arraste — recalcula a ordem e persiste via mutation otimista.
   */
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id || !evento) return;

    const oldIndex = musicaIds.indexOf(active.id as string);
    const newIndex = musicaIds.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;

    const newOrder = arrayMove(musicaIds, oldIndex, newIndex);
    reorderMusicas.mutate(newOrder);
  }

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
   * Inicia o fluxo de adicionar integrante ao evento.
   * Se o integrante tem 2+ funções, abre dialog para seleção.
   * Caso contrário, adiciona diretamente com todas as funções.
   */
  function handleAddIntegrante() {
    if (!selectedIntegranteId) return;
    const integrante = allIntegrantes?.find(
      (i) => i.id === selectedIntegranteId,
    );
    if (!integrante) return;

    if (integrante.funcoes.length >= 2) {
      setFuncaoDialogIntegrante(integrante);
    } else {
      addIntegrante.mutate(
        { integranteId: selectedIntegranteId },
        { onSuccess: () => setSelectedIntegranteId("") },
      );
    }
  }

  /**
   * Callback do dialog de seleção de funções.
   * Adiciona o integrante ao evento com as funções selecionadas.
   *
   * @param funcaoIds - IDs das funções selecionadas.
   */
  function handleFuncaoDialogConfirm(funcaoIds: string[]) {
    if (!funcaoDialogIntegrante) return;
    addIntegrante.mutate(
      { integranteId: funcaoDialogIntegrante.id, funcaoIds },
      {
        onSuccess: () => {
          setSelectedIntegranteId("");
          setFuncaoDialogIntegrante(null);
        },
      },
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center gap-4">
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
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Detalhes da Escala
            </h1>
            <p className="text-muted-foreground mt-1">{evento.descricao}</p>
          </div>
        </div>
        {canWrite && (
          <div className="flex items-center gap-2 sm:ml-auto">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditFormOpen(true)}
            >
              <Pencil className="h-4 w-4 mr-1" />
              Editar
            </Button>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Excluir
            </Button>
          </div>
        )}
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
                {new Date(evento.data).toLocaleString("pt-BR", {
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
          {canWrite && (
            <div className="flex items-center gap-2">
              <Select
                value={selectedMusicaId}
                onValueChange={setSelectedMusicaId}
                disabled={musicasDisponiveis.length === 0}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue
                    placeholder={
                      (allMusicas?.items.length ?? 0) === 0
                        ? "Nenhuma música cadastrada no sistema"
                        : musicasDisponiveis.length === 0
                          ? "Todas as músicas já foram adicionadas"
                          : "Selecione uma música para adicionar"
                    }
                  />
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
                disabled={
                  !selectedMusicaId ||
                  addMusica.isPending ||
                  musicasDisponiveis.length === 0
                }
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}

          {evento.musicas.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma música associada. Selecione acima para adicionar.
            </p>
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext items={musicaIds} strategy={verticalListSortingStrategy}>
                <div className="space-y-2">
                  {evento.musicas.map((musica) => (
                    <SortableMusicaCard
                      key={musica.id}
                      musica={musica}
                      canWrite={canWrite}
                      onRemove={() => {
                        setRemovingMusicaId(musica.id);
                        removeMusica.mutate(musica.id, {
                          onSettled: () => setRemovingMusicaId(null),
                        });
                      }}
                      isPending={removingMusicaId === musica.id}
                    />
                  ))}
                </div>
              </SortableContext>
            </DndContext>
          )}
        </CardContent>
      </Card>

      {/* Formulário de edição */}
      <EventoForm
        open={editFormOpen}
        onOpenChange={setEditFormOpen}
        evento={{
          id: evento.id,
          data: evento.data,
          descricao: evento.descricao,
          tipoEvento: evento.tipoEvento,
          musicas: evento.musicas.map((m) => ({ id: m.id, nome: m.nome })),
          integrantes: evento.integrantes.map((i) => ({ id: i.id, nome: i.nome })),
        }}
      />

      {/* Dialog de exclusão */}
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Excluir Escala"
        description="Os vínculos com músicas e integrantes desta escala serão removidos. Deseja continuar?"
        onConfirm={() => {
          if (!id) {
            setDeleteOpen(false);
            return;
          }
          deleteEvento.mutate(id, {
            onSuccess: () => {
              setDeleteOpen(false);
              navigate("/escalas");
            },
          });
        }}
        isLoading={deleteEvento.isPending}
      />

      {/* Dialog de seleção de funções */}
      {funcaoDialogIntegrante && (
        <FuncaoSelectDialog
          open={!!funcaoDialogIntegrante}
          onOpenChange={(open) => {
            if (!open) {
              setFuncaoDialogIntegrante(null);
              setSelectedIntegranteId("");
            }
          }}
          integranteNome={funcaoDialogIntegrante.nome}
          funcoes={funcaoDialogIntegrante.funcoes}
          onConfirm={handleFuncaoDialogConfirm}
          isLoading={addIntegrante.isPending}
        />
      )}

      {/* Integrantes associados */}
      <Card className="shadow-soft border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Integrantes ({evento.integrantes.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {canWrite && (
            <div className="flex items-center gap-2">
              <Select
                value={selectedIntegranteId}
                onValueChange={setSelectedIntegranteId}
                disabled={integrantesDisponiveis.length === 0}
              >
                <SelectTrigger className="flex-1">
                  <SelectValue
                    placeholder={
                      (allIntegrantes?.length ?? 0) === 0
                        ? "Nenhum integrante cadastrado no sistema"
                        : integrantesDisponiveis.length === 0
                          ? "Todos os integrantes já foram adicionados"
                          : "Selecione um integrante para adicionar"
                    }
                  />
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
                disabled={
                  !selectedIntegranteId ||
                  addIntegrante.isPending ||
                  integrantesDisponiveis.length === 0
                }
              >
                <Plus className="h-4 w-4" />
              </Button>
            </div>
          )}

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
                  {canWrite && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeIntegrante.mutate(integrante.id)}
                      disabled={removeIntegrante.isPending}
                    >
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
