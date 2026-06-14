/**
 * Componente de detalhe de evento (escala).
 *
 * Exibe dados completos do evento usando `useEvento(id)`, lista músicas
 * e integrantes associados, e permite adicionar/remover associações
 * usando selects populados com dados de `useMusicas` e `useIntegrantes`.
 */

import { useState, useMemo } from "react";
import { useParams, useNavigate, useLocation } from "react-router-dom";
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
  Calendar,
  Music,
  Users,
  CornerDownLeft,
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
  useSetMusicaVersao,
  useAddIntegranteToEvento,
  useRemoveIntegranteFromEvento,
} from "@/hooks/use-eventos";
import { useMusicas } from "@/hooks/use-musicas";
import { useDebouncedValue } from "@/hooks/use-debounced-value";
import {
  CreatableCombobox,
  type ComboboxOption,
} from "@/components/CreatableCombobox";
import { useIntegrantes } from "@/hooks/use-integrantes";
import { ErrorState } from "@/components/ErrorState";
import { EventoForm } from "@/components/EventoForm";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { FuncaoSelectDialog } from "@/components/FuncaoSelectDialog";
import { MusicaVersaoPicker } from "@/components/MusicaVersaoPicker";
import { EscalaShareActions } from "@/components/EscalaShareActions";
import { CifraclubPlaylistDialog } from "@/components/CifraclubPlaylistDialog";
import { handleClickableKeyDown } from "@/lib/utils";
import { useScrollRestoration } from "@/hooks/use-scroll-restoration";
import { useCan } from "@/hooks/use-can";
import type { IntegranteComFuncoes } from "@/schemas/integrante";
import type { MusicaEvento } from "@/schemas/evento";

/**
 * Card de música ordenável via drag-and-drop.
 * Exibe badge de posição, grip handle (para usuários com permissão) e botão de remoção.
 * O card inteiro é clicável e navega ao detalhe da música via `onOpen`; o grip,
 * o botão de remoção e o seletor de versão usam `stopPropagation` para não navegar.
 *
 * @param musica - Música do evento (com versão selecionada e disponíveis).
 * @param canWrite - Se o usuário tem permissão de escrita (exibe grip/remoção).
 * @param onRemove - Callback para remover a música do evento.
 * @param isPending - Se há uma mutação em andamento (desabilita ações).
 * @param eventoId - UUID do evento ao qual a música pertence.
 * @param onOpen - Callback invocado com o ID da música ao ativar o card (clique/Enter),
 *   navegando para a página de detalhe da música.
 */
export function SortableMusicaCard({
  musica,
  canWrite,
  onRemove,
  isPending,
  eventoId,
  onOpen,
}: {
  musica: MusicaEvento;
  canWrite: boolean;
  onRemove: () => void;
  isPending: boolean;
  eventoId: string;
  onOpen: (musicaId: string) => void;
}) {
  const setVersao = useSetMusicaVersao(eventoId);
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
      onClick={() => onOpen(musica.id)}
      onKeyDown={(e) => {
        // Só navega quando o foco está no próprio card. Enter/Espaço disparados
        // em controles internos (grip de arraste, seletor de versão, botão de
        // remover) fazem bubble do keydown até aqui; o guard de currentTarget
        // evita a navegação inesperada para todos eles de uma só vez.
        if (e.target === e.currentTarget) {
          handleClickableKeyDown(() => onOpen(musica.id))(e);
        }
      }}
      role="button"
      tabIndex={0}
      aria-label={`Abrir detalhes da música ${musica.nome}`}
      className={`p-3 rounded-lg border border-border cursor-pointer transition-all hover:shadow-medium hover:border-primary/30 ${
        isDragging ? "shadow-lg opacity-75 bg-muted/50 z-10" : ""
      }`}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-start gap-2 min-w-0">
          {canWrite && (
            <button
              {...attributes}
              {...listeners}
              onClick={(e) => e.stopPropagation()}
              className="flex-shrink-0 w-8 h-8 sm:w-11 sm:h-11 flex items-center justify-center cursor-grab active:cursor-grabbing text-muted-foreground hover:text-foreground touch-none"
              aria-label="Arrastar para reordenar"
            >
              <GripVertical className="h-4 w-4" />
            </button>
          )}
          <Badge variant="secondary" className="flex-shrink-0 text-xs font-mono w-6 h-6 flex items-center justify-center p-0 mt-0.5">
            {musica.ordem}
          </Badge>
          <Music className="h-4 w-4 text-primary flex-shrink-0 hidden sm:block mt-1" />
          <span className="font-medium line-clamp-2 min-w-0">{musica.nome}</span>
        </div>
        {canWrite && (
          <Button
            variant="ghost"
            size="sm"
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            disabled={isPending}
            className="flex-shrink-0"
            aria-label="Remover música"
          >
            <X className="h-4 w-4 text-destructive" />
          </Button>
        )}
      </div>
      {/* pl-9/pl-14: alinha com o nome da música acima (grip w-8/w-11 + badge w-6 + gaps) */}
      <div className="flex items-center gap-2 mt-1.5 pl-9 sm:pl-14 flex-wrap">
        {musica.tonalidade && (
          <Badge variant="outline" className="text-xs flex-shrink-0">
            <Guitar className="h-3 w-3 mr-1" />
            {musica.tonalidade.tom}
          </Badge>
        )}
        {/* display:contents não afeta o layout; a propagação de evento segue a
            árvore DOM, então o stopPropagation evita navegar ao mexer na versão. */}
        <span className="contents" onClick={(e) => e.stopPropagation()}>
          <MusicaVersaoPicker
            musicaId={musica.id}
            versaoSelecionada={musica.versao_selecionada}
            versoesDisponiveis={musica.versoes_disponiveis}
            onSelect={(artistasMusicasId, options) =>
              setVersao.mutate({
                musicaId: musica.id,
                artistasMusicasId,
                silent: options?.silent,
              })
            }
            isPending={setVersao.isPending}
            readOnly={!canWrite}
          />
        </span>
      </div>
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
  const location = useLocation();
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

  /** Texto digitado no campo de busca do combobox de músicas. */
  const [musicaSearch, setMusicaSearch] = useState("");
  /**
   * Texto debounceado (300ms) usado para consultar a API.
   * Evita um request a cada tecla pressionada enquanto o usuário digita.
   */
  const debouncedMusicaSearch = useDebouncedValue(musicaSearch, 300);
  const { data: allMusicas, isFetching: isFetchingMusicas } = useMusicas(
    {
      page: 1,
      limit: 100,
      q: debouncedMusicaSearch.trim() || undefined,
    },
    { staleTime: 60_000 },
  );
  const { data: allIntegrantes } = useIntegrantes();

  const updateEvento = useUpdateEvento();
  const deleteEvento = useDeleteEvento();
  const addMusica = useAddMusicaToEvento(id ?? "");
  const removeMusica = useRemoveMusicaFromEvento(id ?? "");
  const reorderMusicas = useReorderMusicas(id ?? "");
  const addIntegrante = useAddIntegranteToEvento(id ?? "");
  const removeIntegrante = useRemoveIntegranteFromEvento(id ?? "");
  const { can: canWrite } = useCan("escalas.write");

  // Restaura a posição de rolagem ao voltar para esta escala (ver use-scroll-restoration).
  // `ready` aguarda os dados para que a altura do conteúdo já exista na restauração.
  useScrollRestoration(`escala:${id ?? ""}`, !isLoading && !!evento);

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

  /** IDs das músicas já associadas ao evento (derivado de musicaIds). */
  const musicasAssociadasIds = useMemo(
    () => new Set(musicaIds),
    [musicaIds],
  );

  /** Músicas disponíveis para associação (excluindo já associadas). */
  const musicasDisponiveis = useMemo(
    () => allMusicas?.items.filter((m) => !musicasAssociadasIds.has(m.id)) ?? [],
    [allMusicas?.items, musicasAssociadasIds],
  );

  /** Opções formatadas para o combobox de busca de músicas. */
  const musicaOptions: ComboboxOption[] = useMemo(
    () =>
      musicasDisponiveis.map((m) => ({
        value: m.id,
        label: m.nome + (m.tonalidade ? ` (${m.tonalidade.tom})` : ""),
      })),
    [musicasDisponiveis],
  );

  /** IDs dos integrantes já associados ao evento. */
  const integrantesAssociadosIds = useMemo(
    () => new Set(evento?.integrantes.map((i) => i.id) ?? []),
    [evento?.integrantes],
  );

  /** Integrantes disponíveis para associação (excluindo já associados). */
  const integrantesDisponiveis = useMemo(
    () =>
      allIntegrantes?.filter((i) => !integrantesAssociadosIds.has(i.id)) ?? [],
    [allIntegrantes, integrantesAssociadosIds],
  );

  /** Opções formatadas para o combobox de busca de integrantes. */
  const integranteOptions: ComboboxOption[] = useMemo(
    () =>
      integrantesDisponiveis.map((i) => ({
        value: i.id,
        label: i.nome,
      })),
    [integrantesDisponiveis],
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

  /**
   * Navega ao detalhe da música preservando a URL atual em `location.state.from`,
   * para que o botão "Voltar" da página da música retorne a esta escala.
   *
   * @param musicaId - UUID da música a abrir.
   */
  function handleOpenMusica(musicaId: string) {
    navigate(`/musicas/${musicaId}`, { state: { from: location.pathname } });
  }

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
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <Button
            variant="outline"
            size="sm"
            onClick={() => navigate("/escalas")}
            className="flex-shrink-0"
          >
            <ArrowLeft className="h-4 w-4 mr-1" />
            Voltar
          </Button>
          <div className="min-w-0">
            <h1 className="text-xl sm:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent truncate">
              Detalhes da Escala
            </h1>
            {evento.descricao && (
              <p className="text-muted-foreground text-sm mt-0.5 truncate">{evento.descricao}</p>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {canWrite && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => setEditFormOpen(true)}
              aria-label="Editar evento"
            >
              <Pencil className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Editar</span>
            </Button>
          )}
          <EscalaShareActions evento={evento} />
          <CifraclubPlaylistDialog eventoId={evento.id} />
          {canWrite && (
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteOpen(true)}
              aria-label="Excluir evento"
            >
              <Trash2 className="h-4 w-4 sm:mr-1" />
              <span className="hidden sm:inline">Excluir</span>
            </Button>
          )}
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
              <div className="flex-1 min-w-0">
                <CreatableCombobox
                  options={musicaOptions}
                  value={selectedMusicaId || undefined}
                  onSelect={setSelectedMusicaId}
                  placeholder={
                    /**
                     * Gates baseados em `meta.total` (e não em `items.length`)
                     * porque a primeira página pode estar cheia (limit=100) e
                     * ainda existirem músicas em páginas seguintes acessíveis
                     * via busca textual. O combobox deve permanecer habilitado
                     * sempre que houver qualquer música no catálogo do tenant.
                     */
                    (allMusicas?.meta.total ?? 0) === 0 && !debouncedMusicaSearch
                      ? "Nenhuma música cadastrada no sistema"
                      : musicasDisponiveis.length === 0 &&
                          (allMusicas?.meta.total ?? 0) === evento.musicas.length &&
                          !debouncedMusicaSearch
                        ? "Todas as músicas já foram adicionadas"
                        : "Selecione uma música para adicionar"
                  }
                  searchPlaceholder="Buscar música..."
                  disabled={
                    (allMusicas?.meta.total ?? 0) === 0 &&
                    !debouncedMusicaSearch &&
                    !isFetchingMusicas
                  }
                  searchValue={musicaSearch}
                  onSearchChange={setMusicaSearch}
                  isSearching={isFetchingMusicas}
                  emptyMessage={
                    debouncedMusicaSearch.trim()
                      ? "Nenhuma música encontrada para esta busca."
                      : "Nenhum resultado encontrado."
                  }
                />
              </div>
              <Button
                size="sm"
                onClick={handleAddMusica}
                disabled={!selectedMusicaId || addMusica.isPending}
                aria-label="Adicionar música ao evento"
              >
                <CornerDownLeft className="h-4 w-4" />
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
                      eventoId={evento.id}
                      onOpen={handleOpenMusica}
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
              <div className="flex-1 min-w-0">
                <CreatableCombobox
                  options={integranteOptions}
                  value={selectedIntegranteId || undefined}
                  onSelect={setSelectedIntegranteId}
                  placeholder={
                    (allIntegrantes?.length ?? 0) === 0
                      ? "Nenhum integrante cadastrado no sistema"
                      : integrantesDisponiveis.length === 0
                        ? "Todos os integrantes já foram adicionados"
                        : "Selecione um integrante para adicionar"
                  }
                  searchPlaceholder="Buscar integrante..."
                  disabled={integrantesDisponiveis.length === 0}
                />
              </div>
              <Button
                size="sm"
                onClick={handleAddIntegrante}
                disabled={
                  !selectedIntegranteId ||
                  addIntegrante.isPending ||
                  integrantesDisponiveis.length === 0
                }
                aria-label="Adicionar integrante ao evento"
              >
                <CornerDownLeft className="h-4 w-4" />
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
                  className="p-3 rounded-lg border border-border"
                >
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2 min-w-0">
                      <Users className="h-4 w-4 text-primary flex-shrink-0" />
                      <span className="font-medium truncate min-w-0">{integrante.nome}</span>
                    </div>
                    {canWrite && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => removeIntegrante.mutate(integrante.id)}
                        disabled={removeIntegrante.isPending}
                        className="flex-shrink-0"
                        aria-label="Remover integrante"
                      >
                        <X className="h-4 w-4 text-destructive" />
                      </Button>
                    )}
                  </div>
                  {integrante.funcoes.length > 0 && (
                    <div className="flex gap-1 flex-wrap mt-1.5 pl-6">
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
