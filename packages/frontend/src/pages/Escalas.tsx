/**
 * Página de gerenciamento de escalas (eventos) do ministério.
 *
 * Carrega dados reais da API via React Query, exibe estados de
 * loading (Skeleton), erro (ErrorState) e vazio (EmptyState),
 * e permite criar, editar, duplicar e excluir eventos via dialogs.
 * Separa escalas em abas "Próximas", "Passadas" e "Rascunhos" — as duas
 * primeiras exibem apenas escalas publicadas; rascunhos vivem SÓ na
 * terceira, com badge próprio e ação "Publicar" (com confirmação quando o
 * rascunho não tem repertório). O botão "Ver Detalhes" navega para
 * `/escalas/:id`.
 */

import { useEffect, useMemo, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Plus, Users, Music, Search, Copy, Send } from "lucide-react";
import {
  useEventos,
  useDeleteEvento,
  useUpdateEvento,
} from "@/hooks/use-eventos";
import { useUndoableDelete } from "@/hooks/use-undoable-delete";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { EventoForm } from "@/components/EventoForm";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { EventoRow, tituloDoEvento } from "@/components/EventoRow";
import { useCan } from "@/hooks/use-can";
import { formatDataExtenso } from "@/lib/utils";
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
const Escalas = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [editingEvento, setEditingEvento] = useState<EventoIndex | null>(null);
  const [duplicandoEvento, setDuplicandoEvento] = useState<EventoIndex | null>(null);
  const [deletingEvento, setDeletingEvento] = useState<EventoIndex | null>(null);
  const [publicandoEvento, setPublicandoEvento] = useState<EventoIndex | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { data: scales, isLoading, isError, error, refetch } = useEventos();
  /** Mutation de atualização, usada para publicar rascunhos (`{ status: "publicada" }`). */
  const updateEvento = useUpdateEvento();
  /** Mutation silenciosa: o feedback de exclusão é o toast com "Desfazer" do useUndoableDelete. */
  const deleteEvento = useDeleteEvento({ silent: true });
  /** Exclusão com janela de desfazer: adia o DELETE ~5s e filtra os pendentes da lista. */
  const { agendar: agendarExclusao, estaPendente } = useUndoableDelete({
    excluir: deleteEvento.mutateAsync,
  });
  const { can: canWrite, isLoading: isLoadingPermissao } = useCan("escalas.write");

  /**
   * Quando a página recebe `?nova=1` (ex: vindo do CTA "Nova Escala" do
   * Dashboard), abre o formulário de criação automaticamente e remove o
   * parâmetro da URL para evitar reabertura ao recarregar.
   */
  useEffect(() => {
    if (searchParams.get("nova") !== "1") return;

    /**
     * Espera a autenticação resolver antes de qualquer ação. `useCan` devolve
     * `can: false` enquanto carrega (fail-closed), e num carregamento direto de
     * `/escalas?nova=1` (link compartilhado, recarga) esse `false` inicial não
     * significa "sem permissão". Agir aqui apagaria o parâmetro antes da hora e
     * o formulário nunca abriria, mesmo para quem pode escrever.
     */
    if (isLoadingPermissao) return;

    if (canWrite) {
      setEditingEvento(null);
      setDuplicandoEvento(null);
      setFormOpen(true);
    }

    /**
     * Limpa o parâmetro mesmo sem permissão de escrita: do contrário, quem
     * recebesse o link compartilhado ficaria com `?nova=1` preso na URL para
     * sempre, já que a condição de limpeza nunca seria satisfeita.
     */
    const next = new URLSearchParams(searchParams);
    next.delete("nova");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, canWrite, isLoadingPermissao]);

  /**
   * Separa as escalas em próximas (data >= início do dia), passadas e
   * rascunhos, aplicando o filtro de busca. Próximas e rascunhos ordenados
   * por data ASC; passadas por data DESC. Apenas escalas `publicada` entram
   * em próximas/passadas — rascunhos vivem SÓ na aba Rascunhos. Escalas com
   * exclusão pendente (janela de desfazer) são filtradas da exibição sem
   * tocar no cache — um "Desfazer" as devolve na posição original.
   */
  const { upcoming, past, rascunhos } = useMemo(() => {
    if (!scales) return { upcoming: [], past: [], rascunhos: [] };
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    /** Esconde as escalas com exclusão agendada (aguardando a janela de desfazer). */
    const visiveis = scales.filter((s) => !estaPendente(s.id));

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

    /** Só escalas publicadas entram nas abas de linha do tempo. */
    const publicadas = visiveis.filter((s) => s.status === "publicada");

    const upcomingList = publicadas
      .filter((s) => new Date(s.data) >= today)
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    const pastList = publicadas
      .filter((s) => new Date(s.data) < today)
      .sort((a, b) => new Date(b.data).getTime() - new Date(a.data).getTime());
    const rascunhosList = visiveis
      .filter((s) => s.status === "rascunho")
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
    return {
      upcoming: applySearch(upcomingList),
      past: applySearch(pastList),
      rascunhos: applySearch(rascunhosList),
    };
  }, [scales, searchQuery, estaPendente]);

  /** Abre o formulário em modo edição para o evento informado. */
  function handleEdit(evento: EventoIndex) {
    setDuplicandoEvento(null);
    setEditingEvento(evento);
    setFormOpen(true);
  }

  /** Abre o formulário em modo duplicação para o evento informado. */
  function handleDuplicar(evento: EventoIndex) {
    setEditingEvento(null);
    setDuplicandoEvento(evento);
    setFormOpen(true);
  }

  /** Controla a visibilidade do dialog do formulário. */
  function handleFormOpenChange(open: boolean) {
    setFormOpen(open);
    if (!open) {
      setEditingEvento(null);
      setDuplicandoEvento(null);
    }
  }

  /**
   * Publica um rascunho via PUT `{ status: "publicada" }`.
   *
   * @param id - UUID do rascunho a publicar.
   */
  function publicar(id: string) {
    updateEvento.mutate({ id, dados: { status: "publicada" } });
  }

  /**
   * Ponto de entrada da ação "Publicar" de um rascunho: com repertório,
   * publica direto; com ZERO músicas, abre o dialog "Publicar sem
   * repertório?" para o usuário escolher entre adicionar músicas antes ou
   * publicar assim mesmo.
   *
   * @param evento - Rascunho alvo da publicação.
   */
  function handlePublicar(evento: EventoIndex) {
    if (evento.musicas.length === 0) {
      setPublicandoEvento(evento);
      return;
    }
    publicar(evento.id);
  }

  /**
   * Confirma a exclusão do evento selecionado agendando-a com janela de
   * desfazer: o card some da lista na hora, mas o DELETE real só dispara
   * quando a janela do toast expirar (ou no desmonte da página).
   */
  function handleConfirmDelete() {
    if (!deletingEvento) return;
    agendarExclusao(deletingEvento.id, "Escala excluída.");
    setDeletingEvento(null);
  }

  /** Indica se há um termo de busca ativo (distingue lista vazia de busca sem resultado). */
  const temBusca = searchQuery.trim().length > 0;

  /**
   * Termo de busca truncado para exibição no zero-result: um termo sem
   * espaços maior que ~40 caracteres estouraria os 360px do mobile.
   */
  const termoExibicao =
    searchQuery.trim().length > 40
      ? `${searchQuery.trim().slice(0, 40)}…`
      : searchQuery.trim();

  /**
   * Renderiza o estado vazio específico de busca sem resultado, com a ação
   * "Limpar busca" — `upcoming.length === 0` sozinho não distingue "não há
   * escala futura" de "a busca não achou nada".
   *
   * @returns Elemento React com o EmptyState de busca sem resultado.
   */
  function renderZeroResultadoBusca() {
    return (
      <EmptyState
        title="Nenhuma escala encontrada"
        description={`Nenhum resultado para "${termoExibicao}". Ajuste o termo ou limpe a busca.`}
        actionLabel="Limpar busca"
        onAction={() => setSearchQuery("")}
      />
    );
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
              {/* Sem `onOpen`: este card já tem Editar/Excluir no rodapé
                  (ação destrutiva) — tornar a linha inteira clicável ao lado
                  de um botão destrutivo convidaria ao clique acidental. */}
              <EventoRow
                evento={scale}
                legenda={formatDataExtenso(scale.data, { capitalizar: true })}
                badges={
                  scale.status === "rascunho" ? (
                    <Badge variant="outline" className="border-dashed">
                      Rascunho
                    </Badge>
                  ) : undefined
                }
                acoes={
                  scale.status === "rascunho" && canWrite ? (
                    /* `disabled` durante o PUT pendente: double-tap no mobile
                       dispararia publicações duplicadas (benignas, mas evitáveis). */
                    <Button
                      size="sm"
                      className="w-full sm:w-auto"
                      onClick={() => handlePublicar(scale)}
                      disabled={updateEvento.isPending}
                      aria-label={`Publicar rascunho ${tituloDoEvento(scale)}`}
                    >
                      <Send className="mr-1 h-4 w-4" />
                      Publicar
                    </Button>
                  ) : undefined
                }
              />
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

              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-end gap-3 mt-4 pt-4 border-t border-border">
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
                      {/* 4º botão da fileira: ícone puro no mobile (label
                          `hidden sm:inline` + aria-label) para a fileira
                          caber em 360px sem quebrar linha. */}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleDuplicar(scale)}
                        aria-label={`Duplicar escala ${tituloDoEvento(scale)}`}
                      >
                        <Copy className="h-4 w-4 sm:mr-1" />
                        <span className="hidden sm:inline">Duplicar</span>
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
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
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
          aria-label="Buscar escalas por data, tipo, integrante ou música"
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
          actionLabel={canWrite ? "Nova Escala" : undefined}
          onAction={canWrite ? () => setFormOpen(true) : undefined}
        />
      )}

      {!isLoading && !isError && scales && scales.length > 0 && (
        <Tabs defaultValue="upcoming" className="w-full">
          {/* px reduzido no mobile: 3 abas com contagem precisam caber em 360px. */}
          <TabsList className="w-full">
            <TabsTrigger value="upcoming" className="flex-1 px-2 sm:px-3">
              Próximas ({upcoming.length})
            </TabsTrigger>
            <TabsTrigger value="past" className="flex-1 px-2 sm:px-3">
              Passadas ({past.length})
            </TabsTrigger>
            <TabsTrigger value="rascunhos" className="flex-1 px-2 sm:px-3">
              Rascunhos ({rascunhos.length})
            </TabsTrigger>
          </TabsList>
          <TabsContent value="upcoming" className="mt-4">
            {upcoming.length === 0 ? (
              temBusca ? (
                renderZeroResultadoBusca()
              ) : (
                <EmptyState
                  title="Nenhuma escala futura agendada"
                  description="Crie uma nova escala para organizar os próximos cultos."
                  actionLabel={canWrite ? "Nova Escala" : undefined}
                  onAction={canWrite ? () => setFormOpen(true) : undefined}
                />
              )
            ) : (
              renderScaleCards(upcoming)
            )}
          </TabsContent>
          <TabsContent value="past" className="mt-4">
            {past.length === 0 ? (
              temBusca ? (
                renderZeroResultadoBusca()
              ) : (
                <EmptyState
                  title="Nenhuma escala passada"
                  description="As escalas anteriores aparecerão aqui após suas datas."
                />
              )
            ) : (
              renderScaleCards(past)
            )}
          </TabsContent>
          <TabsContent value="rascunhos" className="mt-4">
            {rascunhos.length === 0 ? (
              temBusca ? (
                renderZeroResultadoBusca()
              ) : (
                <EmptyState
                  title="Nenhum rascunho"
                  description="Rascunhos são escalas em preparação — ficam visíveis só aqui até serem publicadas."
                />
              )
            ) : (
              renderScaleCards(rascunhos)
            )}
          </TabsContent>
        </Tabs>
      )}

      <EventoForm
        open={formOpen}
        onOpenChange={handleFormOpenChange}
        evento={editingEvento}
        duplicarDe={duplicandoEvento}
      />

      {/*
        Confirmação de publicação sem repertório: rascunho com ZERO músicas
        não publica direto — o usuário escolhe entre ir montar o repertório
        (`/escalas/:id`) ou publicar assim mesmo. Com músicas, `handlePublicar`
        publica sem passar por aqui. O "Cancelar" é a saída NEUTRA obrigatória:
        no touch não há Esc e o Radix ignora tap no backdrop — sem ele, quem
        tocasse "Publicar" por engano seria obrigado a navegar ou publicar.
      */}
      <AlertDialog
        open={!!publicandoEvento}
        onOpenChange={(open) => {
          if (!open) setPublicandoEvento(null);
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Publicar sem repertório?</AlertDialogTitle>
            <AlertDialogDescription>
              {publicandoEvento
                ? `A escala "${tituloDoEvento(publicandoEvento)}" ainda não tem músicas. Você pode adicionar o repertório antes ou publicar assim mesmo.`
                : ""}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {/* `gap-2 sm:gap-0`: 3 ações empilham no mobile (flex-col-reverse
              do próprio AlertDialogFooter) com respiro uniforme; no desktop o
              space-x-2 padrão assume. */}
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="mt-0">Cancelar</AlertDialogCancel>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                if (publicandoEvento) navigate(`/escalas/${publicandoEvento.id}`);
                setPublicandoEvento(null);
              }}
            >
              Adicionar músicas
            </Button>
            <AlertDialogAction
              onClick={() => {
                if (publicandoEvento) publicar(publicandoEvento.id);
                setPublicandoEvento(null);
              }}
            >
              Publicar assim mesmo
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <DeleteConfirmDialog
        open={!!deletingEvento}
        onOpenChange={(open) => {
          if (!open) setDeletingEvento(null);
        }}
        title="Excluir Escala"
        description="Os vínculos com músicas e integrantes desta escala serão removidos. Você poderá desfazer nos próximos segundos."
        onConfirm={handleConfirmDelete}
        /* Sem isLoading: `agendar` é síncrono (o diálogo fecha antes de
           qualquer pending) e um DELETE adiado de OUTRO item deixaria o
           botão em "Excluindo..." por uma request alheia. */
      />
    </div>
  );
};

export default Escalas;
