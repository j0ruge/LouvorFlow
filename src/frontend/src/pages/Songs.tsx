/**
 * Página de gerenciamento do catálogo de músicas.
 *
 * Carrega dados reais paginados da API via React Query, exibe estados de
 * loading (Skeleton), erro (ErrorState) e vazio (EmptyState),
 * permite criar novas músicas via formulário em dialog, e implementa
 * filtragem client-side com debounce de 300ms.
 */

import { useState, useMemo, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Music, Plus, Search, Guitar, ChevronLeft, ChevronRight } from "lucide-react";
import { useMusicas } from "@/hooks/use-musicas";
import { EmptyState } from "@/components/EmptyState";
import { ErrorState } from "@/components/ErrorState";
import { MusicaForm } from "@/components/MusicaForm";

const ITEMS_PER_PAGE = 20;

/**
 * Componente de skeleton para o item de música durante carregamento.
 *
 * @returns Elemento React com placeholder animado.
 */
function SongSkeleton() {
  return (
    <div className="flex items-center justify-between p-4 rounded-lg border border-border">
      <div className="flex items-center gap-4">
        <Skeleton className="w-12 h-12 rounded-lg" />
        <div className="space-y-2">
          <Skeleton className="h-4 w-32" />
          <Skeleton className="h-3 w-24" />
        </div>
      </div>
      <div className="flex items-center gap-6">
        <Skeleton className="h-4 w-8" />
        <Skeleton className="h-4 w-16" />
        <Skeleton className="h-5 w-16 rounded-full" />
      </div>
    </div>
  );
}

const Songs = () => {
  const [formOpen, setFormOpen] = useState(false);
  const [page, setPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState("");
  const [debouncedTerm, setDebouncedTerm] = useState("");
  const navigate = useNavigate();

  /** Debounce de 300ms para o termo de busca. */
  useEffect(
    function debounceSearchTerm() {
      const timer = setTimeout(() => setDebouncedTerm(searchTerm), 300);
      return () => clearTimeout(timer);
    },
    [searchTerm],
  );

  const isSearching = debouncedTerm.length > 0;

  /** Quando buscando, carrega todos os registros; caso contrário, usa paginação. */
  const { data, isLoading, isError, error, refetch } = useMusicas(
    isSearching ? 1 : page,
    isSearching ? 9999 : ITEMS_PER_PAGE,
  );

  /** Aplica filtragem client-side por nome (case-insensitive). */
  const filteredSongs = useMemo(() => {
    const songs = data?.items ?? [];
    if (!isSearching) return songs;
    const term = debouncedTerm.toLowerCase();
    return songs.filter((song) => song.nome.toLowerCase().includes(term));
  }, [data?.items, debouncedTerm, isSearching]);

  const meta = data?.meta;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Músicas
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie o repertório do ministério
          </p>
        </div>
        <Button
          className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-soft"
          onClick={() => setFormOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Música
        </Button>
      </div>

      <Card className="shadow-soft border-0">
        <CardHeader>
          <div className="flex items-center gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar músicas por nome..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
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

          {!isLoading && !isError && filteredSongs.length === 0 && !isSearching && (
            <EmptyState
              title="Nenhuma música cadastrada"
              description="Comece adicionando músicas ao catálogo do ministério."
              actionLabel="Nova Música"
              onAction={() => setFormOpen(true)}
            />
          )}

          {!isLoading && !isError && filteredSongs.length === 0 && isSearching && (
            <EmptyState
              title="Nenhum resultado encontrado"
              description={`Nenhuma música encontrada para "${debouncedTerm}".`}
            />
          )}

          {!isLoading && !isError && filteredSongs.length > 0 && (
            <>
              <div className="space-y-4">
                {filteredSongs.map((song) => (
                  <div
                    key={song.id}
                    className="flex items-center justify-between p-4 rounded-lg bg-gradient-card border border-border hover:shadow-soft transition-all duration-300 cursor-pointer"
                    onClick={() => navigate(`/musicas/${song.id}`)}
                    role="button"
                    tabIndex={0}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") navigate(`/musicas/${song.id}`);
                    }}
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                        <Music className="h-6 w-6 text-white" />
                      </div>
                      <div>
                        <h3 className="font-semibold text-foreground">
                          {song.nome}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {song.versoes[0]?.artista?.nome ?? "Artista desconhecido"}
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-6">
                      {song.tonalidade && (
                        <div className="flex items-center gap-2">
                          <Guitar className="h-4 w-4 text-primary" />
                          <span className="text-sm font-medium text-foreground">
                            {song.tonalidade.tom}
                          </span>
                        </div>
                      )}
                      {song.versoes[0]?.bpm && (
                        <div className="text-sm text-muted-foreground">
                          {song.versoes[0].bpm} BPM
                        </div>
                      )}
                      <div className="flex gap-2">
                        {song.tags.map((tag) => (
                          <Badge
                            key={tag.id}
                            variant="secondary"
                            className="bg-primary/10 text-primary hover:bg-primary/20"
                          >
                            {tag.nome}
                          </Badge>
                        ))}
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          navigate(`/musicas/${song.id}`);
                        }}
                      >
                        Detalhes
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {!isSearching && meta && meta.total_pages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage((p) => Math.max(1, p - 1))}
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
                    onClick={() => setPage((p) => Math.min(meta.total_pages, p + 1))}
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
