/**
 * Página de gerenciamento do catálogo de músicas.
 *
 * Estado da lista (page, busca, categorias) sincronizado com a URL via
 * `useSearchParams`. Filtros por categoria via chips multi-seleção.
 * Busca textual e filtro por categoria executados no backend.
 */

import { useState, useEffect } from "react";
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
import { useCan } from "@/hooks/use-can";
import { handleClickableKeyDown } from "@/lib/utils";

const ITEMS_PER_PAGE = 20;

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
 * Gerencia busca com debounce (300ms), filtro multi-categoria por chips e
 * paginação — tudo refletido na URL para permitir compartilhamento e
 * restauração de estado ao voltar do detalhe.
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
  const page = Math.max(1, parseInt(searchParams.get("page") ?? "1", 10) || 1);
  const q = searchParams.get("q") ?? "";
  const categoriasParam = searchParams.get("categorias") ?? "";
  const categoriaIds = categoriasParam
    ? categoriasParam.split(",").filter(Boolean)
    : [];

  /** Input local para aplicar debounce antes de gravar `q` na URL. */
  const [searchInput, setSearchInput] = useState(q);

  /** Debounce: aplica `q` na URL após 300ms sem digitação, resetando para página 1. */
  useEffect(
    function debounceSearchToUrl() {
      const timer = setTimeout(() => {
        if (searchInput === q) return;
        setSearchParams(
          (prev) => {
            const next = new URLSearchParams(prev);
            if (searchInput) next.set("q", searchInput);
            else next.delete("q");
            next.set("page", "1");
            return next;
          },
          { replace: true },
        );
      }, 300);
      return () => clearTimeout(timer);
    },
    [searchInput, q, setSearchParams],
  );

  const { data: categoriasList } = useCategorias();
  const { data, isLoading, isError, error, refetch } = useMusicas({
    page,
    limit: ITEMS_PER_PAGE,
    categorias: categoriaIds.length > 0 ? categoriaIds : undefined,
    q: q || undefined,
  });

  const meta = data?.meta;
  const songs = data?.items ?? [];

  /**
   * Alterna uma categoria no filtro, resetando para a página 1.
   *
   * @param id - UUID da categoria a alternar.
   */
  const toggleCategoria = (id: string) => {
    const set = new Set(categoriaIds);
    if (set.has(id)) set.delete(id);
    else set.add(id);
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      if (set.size > 0) next.set("categorias", Array.from(set).join(","));
      else next.delete("categorias");
      next.set("page", "1");
      return next;
    });
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
    setSearchParams((prev) => {
      const next = new URLSearchParams(prev);
      next.set("page", String(newPage));
      return next;
    });
  };

  const hasFilters = q.length > 0 || categoriaIds.length > 0;

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
            className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-soft"
            onClick={() => setFormOpen(true)}
          >
            <Plus className="mr-2 h-4 w-4" />
            Nova Música
          </Button>
        )}
      </div>

      <Card className="shadow-soft border-0">
        <CardHeader className="space-y-4">
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar músicas por nome..."
                className="pl-10 w-full"
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
              />
            </div>
          </div>

          {categoriasList && categoriasList.length > 0 && (
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Filtrar por categoria"
            >
              {categoriasList.map((cat) => {
                const active = categoriaIds.includes(cat.id);
                return (
                  <Badge
                    key={cat.id}
                    variant={active ? "default" : "outline"}
                    className={
                      "cursor-pointer select-none transition-colors " +
                      (active
                        ? "bg-primary text-primary-foreground hover:bg-primary/90"
                        : "hover:bg-primary/10")
                    }
                    role="checkbox"
                    aria-checked={active}
                    tabIndex={0}
                    onClick={() => toggleCategoria(cat.id)}
                    onKeyDown={handleClickableKeyDown(() =>
                      toggleCategoria(cat.id),
                    )}
                  >
                    {cat.nome}
                  </Badge>
                );
              })}
            </div>
          )}
        </CardHeader>

        <CardContent>
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
              actionLabel={!hasFilters ? "Nova Música" : undefined}
              onAction={!hasFilters ? () => setFormOpen(true) : undefined}
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
