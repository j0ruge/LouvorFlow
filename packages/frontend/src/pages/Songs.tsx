/**
 * Página de gerenciamento do catálogo de músicas.
 *
 * Estado da lista (page, busca, intensidades, categorias) sincronizado com a
 * URL via `useSearchParams`. Filtros por intensidade (tempo) e por categoria
 * via chips multi-seleção: inline no desktop e colapsados atrás do botão
 * "Filtros" (bottom-sheet) no mobile, mantendo a busca como protagonista.
 * Busca textual e ambos os filtros executados no backend.
 */

import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams, useLocation } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Music, Plus, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { useMusicas } from "@/hooks/use-musicas";
import { useCategorias } from "@/hooks/use-categorias";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { MusicaForm } from "@/components/MusicaForm";
import {
  MusicaFiltrosAtivos,
  MusicaFiltrosChips,
  MusicaFiltrosDrawer,
} from "@/components/MusicaFiltros";
import { INTENSIDADE_OPTIONS, type Intensidade } from "@/components/intensidade-options";
import { useCan } from "@/hooks/use-can";
import { useFocusShortcut } from "@/hooks/use-focus-shortcut";
import { handleClickableKeyDown } from "@/lib/utils";

const ITEMS_PER_PAGE = 20;

/** Formato de UUID aceito pelo backend no filtro `categorias`. */
const UUID_REGEX =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

/**
 * Componente de skeleton para o item de música durante carregamento.
 *
 * @returns Elemento React com placeholder animado.
 */
function SongSkeleton() {
  return (
    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg border border-border gap-3 sm:gap-4">
      <div className="flex items-center gap-3 sm:gap-4">
        <Skeleton className="w-12 h-12 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="flex items-center gap-3 sm:gap-6 flex-wrap">
        <Skeleton className="h-4 w-8" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  );
}

/**
 * Componente da página de músicas do ministério com filtros sincronizados na URL.
 *
 * Gerencia busca com debounce (300ms), filtro multi-intensidade (tempo) e
 * multi-categoria por chips, e paginação — tudo refletido na URL para permitir
 * compartilhamento e restauração de estado ao voltar do detalhe.
 *
 * @returns Elemento JSX com a página de músicas.
 */
const Songs = () => {
  const { can: canWrite } = useCan("musicas.write");
  const [formOpen, setFormOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams, setSearchParams] = useSearchParams();

  /** Estado canônico vive na URL — derivado dos search params. */
  const rawPage = parseInt(searchParams.get("page") ?? "1", 10);
  const page = Number.isNaN(rawPage) || rawPage < 1 ? 1 : rawPage;
  const q = searchParams.get("q") ?? "";
  /**
   * `q` normalizado (trimado) é usado em comparações, no cálculo de
   * `hasFilters` e no envio para o backend. Mantemos `q` cru para
   * sincronizar o input visualmente quando a URL é alterada
   * externamente (popstate, deep link), evitando flicker do campo.
   */
  const normalizedQ = q.trim();
  const categoriasParam = searchParams.get("categorias") ?? "";
  /**
   * Mantém apenas UUIDs bem formados vindos da URL, pelo mesmo motivo do filtro
   * de intensidades logo abaixo: o backend valida `categorias` com
   * `z.array(uuidSchema)` e devolve 400 ao primeiro token inválido, o que
   * jogaria a página inteira no `ErrorState` por causa de um link velho ou
   * editado à mão. Descartar o token inválido degrada para "sem esse filtro".
   *
   * O `Set` remove repetições: `?categorias=<uuid>,<uuid>` geraria duas
   * entradas idênticas em `descreverFiltrosAtivos`, colidindo na `key` do React
   * (badge duplicado que não some ao ser removido) e inflando o contador de
   * filtros ativos do Drawer.
   */
  const categoriaIds = categoriasParam
    ? Array.from(
        new Set(categoriasParam.split(",").filter((v) => UUID_REGEX.test(v))),
      )
    : [];
  const intensidadesParam = searchParams.get("intensidades") ?? "";
  /**
   * Mantém apenas valores válidos de intensidade vindos da URL — um
   * `?intensidades=foo` manipulado é descartado no cliente em vez de gerar um
   * 400 no backend. Resulta em `Intensidade[]`, alinhado ao contrato de
   * `useMusicas`/`getMusicas`.
   */
  const intensidades: Intensidade[] = intensidadesParam
    ? intensidadesParam
        .split(",")
        .filter((v): v is Intensidade =>
          INTENSIDADE_OPTIONS.some((opt) => opt.value === v),
        )
    : [];

  /** Input local com inicialização preguiçosa a partir da URL. */
  const [searchInput, setSearchInput] = useState(() => q);

  /** Referência ao input de busca — alvo do atalho de teclado `/`. */
  const searchRef = useRef<HTMLInputElement>(null);
  useFocusShortcut(searchRef);

  /**
   * Sincroniza `searchInput` com `q` em mudanças externas da URL
   * (botão voltar/avançar do navegador via popstate, deep link).
   * O guard `current === q` evita renders extras quando a mudança veio
   * do próprio debounce — `setState` com o mesmo valor é no-op.
   */
  useEffect(
    function syncSearchInputFromUrl() {
      setSearchInput((current) => (current === q ? current : q));
    },
    [q],
  );

  /**
   * Debounce: aplica `q` na URL após 300ms sem digitação, resetando para página 1.
   *
   * Compara e persiste a versão trimada de `searchInput` para manter a UI
   * consistente com a normalização do backend — busca whitespace-only não
   * é considerada filtro ativo nem persiste na URL.
   */
  useEffect(
    function debounceSearchToUrl() {
      const timer = setTimeout(() => {
        const trimmedInput = searchInput.trim();
        if (trimmedInput === normalizedQ) return;
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            if (trimmedInput) next.set("q", trimmedInput);
            else next.delete("q");
            next.set("page", "1");
            return next;
          },
          { replace: true },
        );
      }, 300);
      return () => clearTimeout(timer);
    },
    [searchInput, normalizedQ, setSearchParams],
  );

  const { data: categoriasList } = useCategorias();
  const { data, isLoading, isError, error, refetch } = useMusicas({
    page,
    limit: ITEMS_PER_PAGE,
    categorias: categoriaIds.length > 0 ? categoriaIds : undefined,
    intensidades: intensidades.length > 0 ? intensidades : undefined,
    q: normalizedQ || undefined,
  });

  const meta = data?.meta;
  const songs = data?.items ?? [];

  /**
   * Normaliza `page` quando a URL pede uma página fora do range válido
   * retornado pela API. Sem isso, `?page=999` cairia em empty-state
   * mesmo com dados disponíveis em páginas válidas (1..total_pages).
   * Replace silencioso no histórico para evitar entradas extras de
   * navegação ao recuperar do estado inválido.
   */
  /**
   * Só o primitivo entra no efeito abaixo. Ler `meta` inteiro lá dentro
   * obrigaria a listá-lo nas dependências, e como o objeto ganha nova
   * referência a cada fetch, o efeito rodaria mesmo sem mudança na contagem
   * de páginas (ex.: `total` muda com a mesma quantidade de páginas).
   */
  const totalPages = meta?.total_pages;

  useEffect(
    function clampPageToMeta() {
      if (totalPages === undefined || totalPages < 1) return;
      if (page <= totalPages) return;
      setSearchParams(
        (prev) => {
          const next = new URLSearchParams(prev);
          next.set("page", String(totalPages));
          return next;
        },
        { replace: true },
      );
    },
    [totalPages, page, setSearchParams],
  );

  /**
   * Alterna uma categoria no filtro, resetando para a página 1.
   *
   * @param id - UUID da categoria a alternar.
   */
  const toggleCategoria = (id: string) => {
    const set = new Set(categoriaIds);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        /**
         * `sort()` canoniza a ordem dos IDs antes de serializar. A ordem
         * de iteração do `Set` segue inserção, então sem o sort a mesma
         * seleção em ordens diferentes geraria URLs distintas e
         * `queryKey`s diferentes — provocando refetch desnecessário.
         */
        if (set.size > 0)
          next.set("categorias", Array.from(set).sort().join(","));
        else next.delete("categorias");
        next.set("page", "1");
        return next;
      },
      { replace: true },
    );
  };

  /**
   * Alterna uma intensidade (tempo) no filtro, resetando para a página 1.
   *
   * Espelha `toggleCategoria`: mesma canonização via `sort()` antes de
   * serializar para a URL, evitando `queryKey`s distintas (e refetch) para
   * a mesma seleção em ordens diferentes.
   *
   * @param value - Valor de intensidade (`calma`/`media`/`agitada`) a alternar.
   */
  const toggleIntensidade = (value: Intensidade) => {
    const set = new Set(intensidades);
    if (set.has(value)) set.delete(value);
    else set.add(value);
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        if (set.size > 0)
          next.set("intensidades", Array.from(set).sort().join(","));
        else next.delete("intensidades");
        next.set("page", "1");
        return next;
      },
      { replace: true },
    );
  };

  /**
   * Remove todos os filtros de chips (categorias e intensidades) da URL,
   * preservando a busca textual e resetando para a página 1.
   */
  const limparFiltros = () => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("categorias");
        next.delete("intensidades");
        next.set("page", "1");
        return next;
      },
      { replace: true },
    );
  };

  /**
   * Remove busca textual e todos os filtros de chips de uma vez (CTA do
   * zero-result quando `hasFilters` é verdadeiro).
   *
   * Zera `searchInput` explicitamente em vez de confiar no efeito
   * `syncSearchInputFromUrl`: um debounce ainda pendente (`searchInput`
   * digitado nos últimos 300ms) reescreveria `q` na URL depois deste
   * `setSearchParams`, reaplicando a busca que acabamos de limpar —
   * acoplamento temporal entre o timer do debounce e esta ação.
   */
  const limparTudo = () => {
    setSearchInput("");
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.delete("q");
        next.delete("categorias");
        next.delete("intensidades");
        next.set("page", "1");
        return next;
      },
      { replace: true },
    );
  };

  /**
   * Navega ao detalhe preservando a URL atual em `location.state.from`.
   *
   * @param id - UUID da música a abrir.
   */
  const goToSong = (id: string) => {
    navigate(`/musicas/${id}`, {
      state: { from: location.pathname + location.search },
    });
  };

  /**
   * Atualiza a página atual na URL, preservando demais parâmetros.
   *
   * @param newPage - Nova página a aplicar.
   */
  const setPage = (newPage: number) => {
    setSearchParams(
      (prev) => {
        const next = new URLSearchParams(prev);
        next.set("page", String(newPage));
        return next;
      },
      { replace: true },
    );
  };

  const hasFilters =
    normalizedQ.length > 0 ||
    categoriaIds.length > 0 ||
    intensidades.length > 0;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Músicas
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie o repertório do ministério
          </p>
        </div>
        {canWrite && (
          <Button
            className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-soft flex-shrink-0"
            onClick={() => setFormOpen(true)}
            aria-label="Nova Música"
          >
            <Plus className="h-4 w-4 sm:mr-2" />
            <span className="hidden sm:inline">Nova Música</span>
          </Button>
        )}
      </div>

      <Card className="shadow-soft border-0">
        <CardHeader className="space-y-4">
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                ref={searchRef}
                placeholder="Buscar músicas por nome..."
                aria-label="Buscar músicas por nome"
                className="pl-10 w-full sm:pr-9"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
              {/* Dica visual do atalho de teclado — some no mobile (sem teclado físico). */}
              <kbd className="hidden sm:flex absolute right-3 top-1/2 h-5 min-w-5 -translate-y-1/2 items-center justify-center rounded border border-border bg-muted px-1.5 text-[10px] font-medium text-muted-foreground">
                /
              </kbd>
            </div>
            {/* Mobile: filtros colapsados atrás do botão (bottom-sheet). */}
            <div className="sm:hidden">
              <MusicaFiltrosDrawer
                categorias={categoriasList ?? []}
                categoriaIds={categoriaIds}
                intensidades={intensidades}
                onToggleCategoria={toggleCategoria}
                onToggleIntensidade={toggleIntensidade}
                onLimpar={limparFiltros}
              />
            </div>
          </div>

          {/* Desktop: chips inline, sempre visíveis (comportamento atual). */}
          <div className="hidden sm:block">
            <MusicaFiltrosChips
              categorias={categoriasList ?? []}
              categoriaIds={categoriaIds}
              intensidades={intensidades}
              onToggleCategoria={toggleCategoria}
              onToggleIntensidade={toggleIntensidade}
            />
          </div>
        </CardHeader>

        <CardContent>
          {/*
           * Linha de resultados visível — substitui o antigo anúncio `sr-only`
           * (mantê-lo junto duplicaria o anúncio no leitor de tela). Usa
           * `meta.total` (contagem real do backend), não `songs.length`
           * (tamanho da página atual, teto de `ITEMS_PER_PAGE`).
           *
           * `role="status"`/`aria-live`/`aria-atomic` ficam só no `<span>` da
           * contagem, não no container: os badges de `MusicaFiltrosAtivos`
           * são interativos (botões), e colocar a live region no `<div>` pai
           * faria cada clique num badge re-anunciar a linha inteira (ruído).
           * O `<div>` externo é só um flex container.
           */}
          {hasFilters && !isLoading && !isError && meta && (
            <div className="mb-4 flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
              <span
                role="status"
                aria-live="polite"
                aria-atomic="true"
                className="min-w-0"
              >
                <b className="text-foreground tabular-nums">{meta.total}</b>{" "}
                {meta.total === 1 ? "música" : "músicas"}
                {normalizedQ && (
                  <>
                    {" "}
                    {/* `break-words`: o termo é texto livre do usuário e pode
                        vir sem espaço (token/URL colado), estourando 360px. */}
                    para{" "}
                    <span className="text-foreground break-words">
                      “{normalizedQ}”
                    </span>
                  </>
                )}
              </span>
              <MusicaFiltrosAtivos
                categorias={categoriasList ?? []}
                categoriaIds={categoriaIds}
                intensidades={intensidades}
                onToggleCategoria={toggleCategoria}
                onToggleIntensidade={toggleIntensidade}
                onLimpar={limparFiltros}
                aoRemover={() => searchRef.current?.focus()}
              />
            </div>
          )}
          {isLoading && (
            <div className="space-y-4">
              {Array.from({ length: 4 }).map((_, i) => (
                <SongSkeleton key={i} />
              ))}
            </div>
          )}

          {isError && (
            <ErrorState
              message={error?.message ?? "Erro ao carregar músicas."}
              onRetry={() => refetch()}
            />
          )}

          {!isLoading && !isError && songs.length === 0 && (
            <EmptyState
              title={
                hasFilters
                  ? "Nenhum resultado encontrado"
                  : "Nenhuma música cadastrada"
              }
              description={
                hasFilters
                  ? "Tente remover filtros ou ajustar a busca."
                  : "Comece adicionando músicas ao catálogo do ministério."
              }
              actionLabel={hasFilters ? "Limpar busca e filtros" : "Nova Música"}
              onAction={hasFilters ? limparTudo : () => setFormOpen(true)}
            />
          )}

          {!isLoading && !isError && songs.length > 0 && (
            <>
              <div className="space-y-4">
                {songs.map((song) => {
                  /** Badges de categoria reutilizadas no layout desktop e mobile. */
                  const categoriaBadges = song.categorias.map((categoria) => (
                    <Badge
                      key={categoria.id}
                      variant="secondary"
                      className="bg-primary/10 text-primary hover:bg-primary/20"
                    >
                      {categoria.nome}
                    </Badge>
                  ));
                  return (
                    <div
                      key={song.id}
                      className="flex flex-col sm:flex-row sm:items-center sm:justify-between p-4 rounded-lg bg-gradient-card border border-border hover:shadow-medium hover:border-primary/30 transition-all duration-300 cursor-pointer gap-3 sm:gap-4"
                      onClick={() => goToSong(song.id)}
                      role="button"
                      tabIndex={0}
                      onKeyDown={handleClickableKeyDown(() => goToSong(song.id))}
                    >
                      <div className="flex items-center gap-3 sm:gap-4 min-w-0 flex-1">
                        <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center shrink-0 shadow-soft">
                          <Music className="h-6 w-6 text-white" />
                        </div>
                        <div className="min-w-0 flex-1">
                          <h3 className="font-semibold text-foreground truncate">
                            {song.nome}
                          </h3>
                          <p className="text-sm text-muted-foreground truncate">
                            {song.versoes[0]?.artista?.nome ??
                              "Artista desconhecido"}
                          </p>
                        </div>
                        <div className="flex flex-col items-end leading-none shrink-0 sm:hidden">
                          {song.tonalidade && (
                            <span className="font-display font-bold text-lg text-foreground">
                              {song.tonalidade.tom}
                            </span>
                          )}
                          {song.versoes[0]?.bpm && (
                            <span className="text-[11px] text-muted-foreground tabular-nums mt-0.5">
                              {song.versoes[0].bpm} BPM
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="hidden sm:flex items-center gap-3 sm:gap-6 flex-wrap">
                        {song.tonalidade && (
                          <span className="font-display font-bold text-lg text-foreground leading-none">
                            {song.tonalidade.tom}
                          </span>
                        )}
                        {song.versoes[0]?.bpm && (
                          <div className="text-sm text-muted-foreground tabular-nums">
                            {song.versoes[0].bpm} BPM
                          </div>
                        )}
                        <div className="flex gap-2">{categoriaBadges}</div>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            goToSong(song.id);
                          }}
                        >
                          Detalhes
                        </Button>
                      </div>

                      {song.categorias.length > 0 && (
                        <div className="flex flex-wrap gap-2 sm:hidden">
                          {categoriaBadges}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {meta && meta.total_pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(Math.max(1, page - 1))}
                    disabled={page <= 1}
                  >
                    <ChevronLeft className="h-4 w-4 mr-1" />
                    Anterior
                  </Button>
                  <span className="text-sm text-muted-foreground px-4">
                    Página {meta.page} de {meta.total_pages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() =>
                      setPage(Math.min(meta.total_pages, page + 1))
                    }
                    disabled={page >= meta.total_pages}
                  >
                    Próxima
                    <ChevronRight className="h-4 w-4 ml-1" />
                  </Button>
                </div>
              )}
            </>
          )}
        </CardContent>
      </Card>

      <MusicaForm open={formOpen} onOpenChange={setFormOpen} />
    </div>
  );
};

export default Songs;
