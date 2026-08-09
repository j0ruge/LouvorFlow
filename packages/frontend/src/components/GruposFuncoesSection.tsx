/**
 * Seção de configuração dos grupos de funções.
 *
 * Renderizada na aba "Grupos" de Configurações. Permite criar, renomear,
 * excluir e reordenar (drag-and-drop) os grupos, além de definir quais
 * funções pertencem a cada um. A ordem definida aqui é a ordem dos blocos
 * de integrantes na mensagem de compartilhamento da escala.
 */

import { useMemo, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
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
  sortableKeyboardCoordinates,
  arrayMove,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import {
  GripVertical,
  Pencil,
  Trash2,
  CornerDownLeft,
  X,
  Check,
  Loader2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { useCan } from "@/hooks/use-can";
import { useFuncoes } from "@/hooks/use-support";
import {
  useFuncoesGrupos,
  useCreateGrupo,
  useUpdateGrupo,
  useDeleteGrupo,
  useSetGrupoFuncoes,
  useReorderGrupos,
} from "@/hooks/use-funcoes-grupos";
import type { GrupoFuncoes } from "@/schemas/funcoes-grupos";
import type { IdNome } from "@/schemas/shared";

/** Propriedades do card arrastável de grupo. */
interface SortableGrupoCardProps {
  /** Grupo exibido no card. */
  grupo: GrupoFuncoes;
  /** Posição do grupo na lista (1..N), exibida como badge. */
  posicao: number;
  /** Quando `false`, oculta grip, ações e atribuição de funções. */
  canWrite: boolean;
  /** Funções ainda não atribuídas a nenhum grupo ou pertencentes a outros. */
  funcoesDisponiveis: IdNome[];
  /** Callback para renomear o grupo. */
  onRename: (nome: string) => void;
  /** Callback para solicitar exclusão do grupo. */
  onDelete: () => void;
  /** Callback que substitui o conjunto de funções do grupo. */
  onSetFuncoes: (funcoesIds: string[]) => void;
  /** Indica que uma renomeação está em andamento. */
  isUpdating: boolean;
  /** Indica que uma atribuição de funções está em andamento. */
  isSettingFuncoes: boolean;
}

/**
 * Card de um grupo, arrastável para reordenação.
 *
 * Primeira linha: grip, posição, nome (editável inline) e ações.
 * Segunda linha: badges das funções atribuídas e o seletor para adicionar.
 *
 * @param props - Propriedades do card.
 * @returns Elemento React do card do grupo.
 */
function SortableGrupoCard({
  grupo,
  posicao,
  canWrite,
  funcoesDisponiveis,
  onRename,
  onDelete,
  onSetFuncoes,
  isUpdating,
  isSettingFuncoes,
}: SortableGrupoCardProps) {
  const [isEditing, setIsEditing] = useState(false);
  const [editName, setEditName] = useState(grupo.nome);
  const [selectedFuncaoId, setSelectedFuncaoId] = useState("");

  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: grupo.id, disabled: !canWrite });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  /** Abre a edição inline do nome, partindo do valor atual. */
  function startEditing() {
    setEditName(grupo.nome);
    setIsEditing(true);
  }

  /** Confirma a renomeação, ignorando nome vazio. */
  function confirmEditing() {
    const trimmed = editName.trim();
    if (!trimmed) return;
    onRename(trimmed);
    setIsEditing(false);
  }

  /** Adiciona ao grupo a função selecionada no seletor. */
  function handleAddFuncao() {
    if (!selectedFuncaoId) return;
    onSetFuncoes([...grupo.funcoes.map((f) => f.id), selectedFuncaoId]);
    setSelectedFuncaoId("");
  }

  /**
   * Remove uma função do grupo — ela passa a não pertencer a grupo algum.
   *
   * @param funcaoId - UUID da função a desvincular.
   */
  function handleRemoveFuncao(funcaoId: string) {
    onSetFuncoes(grupo.funcoes.filter((f) => f.id !== funcaoId).map((f) => f.id));
  }

  /**
   * Toda função já pertence a algum grupo. O seletor fica desabilitado com
   * um placeholder explicativo — um dropdown vazio não diria ao usuário que
   * ele precisa liberar a função de outro grupo antes.
   */
  const semFuncoesDisponiveis = funcoesDisponiveis.length === 0;

  return (
    <div
      ref={setNodeRef}
      style={style}
      className={`p-3 rounded-lg border border-border space-y-3 ${
        isDragging ? "shadow-lg opacity-75 bg-muted/50 z-10" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        {isEditing ? (
          <div className="flex items-center gap-2 flex-1 min-w-0">
            <Input
              value={editName}
              onChange={(e) => setEditName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === "Enter") confirmEditing();
                if (e.key === "Escape") setIsEditing(false);
              }}
              className="h-8"
              autoFocus
              disabled={isUpdating}
            />
            <Button
              variant="ghost"
              size="sm"
              onClick={confirmEditing}
              disabled={isUpdating || !editName.trim()}
              aria-label="Confirmar edição"
            >
              {isUpdating ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4 text-primary" />
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsEditing(false)}
              disabled={isUpdating}
              aria-label="Cancelar edição"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        ) : (
          <>
            <div className="flex items-center gap-2 min-w-0">
              {canWrite && (
                <button
                  {...attributes}
                  {...listeners}
                  className="flex-shrink-0 w-8 h-8 sm:w-11 sm:h-11 flex items-center justify-center cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
                  aria-label={`Arrastar ${grupo.nome} para reordenar`}
                >
                  <GripVertical className="h-4 w-4" />
                </button>
              )}
              <Badge
                variant="secondary"
                className="flex-shrink-0 text-xs font-mono w-6 h-6 flex items-center justify-center p-0"
              >
                {posicao}
              </Badge>
              <span className="font-medium truncate min-w-0">{grupo.nome}</span>
            </div>
            {canWrite && (
              <div className="flex items-center gap-1 flex-shrink-0">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={startEditing}
                  aria-label={`Editar grupo ${grupo.nome}`}
                >
                  <Pencil className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={onDelete}
                  aria-label={`Excluir grupo ${grupo.nome}`}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            )}
          </>
        )}
      </div>

      <div className="space-y-2 sm:pl-10">
        <div className="flex flex-wrap gap-2">
          {grupo.funcoes.map((funcao) => (
            <Badge key={funcao.id} variant="outline" className="gap-1 max-w-full">
              <span className="truncate">{funcao.nome}</span>
              {canWrite && (
                <button
                  type="button"
                  onClick={() => handleRemoveFuncao(funcao.id)}
                  disabled={isSettingFuncoes}
                  className="ml-1 hover:text-destructive flex-shrink-0"
                  aria-label={`Remover ${funcao.nome} do grupo ${grupo.nome}`}
                >
                  <X className="h-3 w-3" aria-hidden="true" />
                </button>
              )}
            </Badge>
          ))}
          {grupo.funcoes.length === 0 && (
            <p className="text-sm text-muted-foreground">
              Nenhuma função neste grupo.
            </p>
          )}
        </div>

        {canWrite && (
          <div className="flex flex-wrap items-center gap-2">
            <Select
              value={selectedFuncaoId}
              onValueChange={setSelectedFuncaoId}
              disabled={semFuncoesDisponiveis}
            >
              <SelectTrigger className="h-8 w-full sm:w-64 min-w-0">
                <SelectValue
                  className="truncate"
                  placeholder={
                    semFuncoesDisponiveis
                      ? "Todas as funções já estão em grupos"
                      : "Adicionar função..."
                  }
                />
              </SelectTrigger>
              <SelectContent>
                {funcoesDisponiveis.map((funcao) => (
                  <SelectItem key={funcao.id} value={funcao.id}>
                    {funcao.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={handleAddFuncao}
              disabled={!selectedFuncaoId || isSettingFuncoes}
              aria-label={`Adicionar função ao grupo ${grupo.nome}`}
            >
              {isSettingFuncoes ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <CornerDownLeft className="h-4 w-4" />
              )}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Seção de gerenciamento dos grupos de funções.
 *
 * @returns Elemento React com a lista ordenável de grupos e o formulário de criação.
 */
export function GruposFuncoesSection() {
  const { can: canWrite } = useCan("configuracoes.write");
  const { data: grupos, isLoading } = useFuncoesGrupos();
  const { data: funcoes } = useFuncoes();

  const createGrupo = useCreateGrupo();
  const updateGrupo = useUpdateGrupo();
  const deleteGrupo = useDeleteGrupo();
  const setGrupoFuncoes = useSetGrupoFuncoes();
  const reorderGrupos = useReorderGrupos();

  const [newName, setNewName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<GrupoFuncoes | null>(null);

  /**
   * Sensores de drag-and-drop: PointerSensor para desktop, TouchSensor com long
   * press para mobile e KeyboardSensor para reordenar sem mouse (Espaço para
   * pegar, setas para mover, Espaço para soltar).
   */
  const pointerSensor = useSensor(PointerSensor, {
    activationConstraint: { distance: 8 },
  });
  const touchSensor = useSensor(TouchSensor, {
    activationConstraint: { delay: 250, tolerance: 5 },
  });
  const keyboardSensor = useSensor(KeyboardSensor, {
    coordinateGetter: sortableKeyboardCoordinates,
  });
  const sensors = useSensors(pointerSensor, touchSensor, keyboardSensor);

  /** IDs dos grupos na ordem atual, para o SortableContext. */
  const grupoIds = useMemo(() => grupos?.map((g) => g.id) ?? [], [grupos]);

  /**
   * Funções que ainda não pertencem a nenhum grupo — as únicas oferecidas no
   * seletor. Mover uma função entre grupos se faz removendo do atual e
   * adicionando no novo, o que deixa a origem sempre explícita para o usuário.
   */
  const funcoesSemGrupo = useMemo(() => {
    const atribuidas = new Set(
      (grupos ?? []).flatMap((g) => g.funcoes.map((f) => f.id)),
    );
    return (funcoes ?? []).filter((f) => !atribuidas.has(f.id));
  }, [grupos, funcoes]);

  /** Cria um grupo a partir do campo do rodapé. */
  function handleCreate() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    createGrupo.mutate({ nome: trimmed }, { onSuccess: () => setNewName("") });
  }

  /** Handler de fim de arraste — recalcula a ordem e persiste via mutation otimista. */
  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    if (!over || active.id === over.id) return;

    const oldIndex = grupoIds.indexOf(active.id as string);
    const newIndex = grupoIds.indexOf(over.id as string);
    if (oldIndex === -1 || newIndex === -1) return;

    reorderGrupos.mutate(arrayMove(grupoIds, oldIndex, newIndex));
  }

  /** Confirma a exclusão do grupo selecionado. */
  function handleConfirmDelete() {
    if (!deleteTarget) return;
    deleteGrupo.mutate(deleteTarget.id, {
      onSettled: () => setDeleteTarget(null),
    });
  }

  return (
    <div className="space-y-4">
      <p className="text-sm text-muted-foreground">
        A ordem dos grupos define a sequência dos blocos de integrantes na
        escala compartilhada no WhatsApp. Arraste para reordenar.
      </p>

      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Carregando...
        </p>
      ) : !grupos || grupos.length === 0 ? (
        <EmptyState
          title="Nenhum grupo cadastrado"
          description="Crie grupos como Ministração, Vocal e Instrumentos para organizar os integrantes na escala compartilhada."
        />
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext items={grupoIds} strategy={verticalListSortingStrategy}>
            <div className="space-y-2">
              {grupos.map((grupo, index) => (
                <SortableGrupoCard
                  key={grupo.id}
                  grupo={grupo}
                  posicao={index + 1}
                  canWrite={canWrite}
                  funcoesDisponiveis={funcoesSemGrupo}
                  onRename={(nome) =>
                    updateGrupo.mutate({ id: grupo.id, dados: { nome } })
                  }
                  onDelete={() => setDeleteTarget(grupo)}
                  onSetFuncoes={(funcoesIds) =>
                    setGrupoFuncoes.mutate({ id: grupo.id, funcoesIds })
                  }
                  isUpdating={updateGrupo.isPending}
                  isSettingFuncoes={setGrupoFuncoes.isPending}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>
      )}

      {canWrite && (
        <div className="flex flex-wrap items-center gap-2">
          <Input
            className="flex-1"
            placeholder="Novo(a) grupo..."
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
            }}
            disabled={createGrupo.isPending}
          />
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={createGrupo.isPending || !newName.trim()}
            aria-label="Confirmar criação"
          >
            {createGrupo.isPending ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CornerDownLeft className="h-4 w-4" />
            )}
          </Button>
        </div>
      )}

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title="Excluir Grupo"
        description={`Tem certeza que deseja excluir "${deleteTarget?.nome}"? As funções deste grupo ficarão sem grupo e passarão a aparecer ao final da lista de integrantes. Essa ação não pode ser desfeita.`}
        onConfirm={handleConfirmDelete}
        isLoading={deleteGrupo.isPending}
      />
    </div>
  );
}
