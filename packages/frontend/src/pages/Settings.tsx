/**
 * Página de configurações do sistema.
 *
 * Renderizada na rota `/configuracoes`. Exibe abas horizontais para gerenciar
 * entidades auxiliares: Artistas, Categorias, Funções, Grupos, Tonalidades e
 * Tipos de Evento. As abas de cadastro simples renderizam um `ConfigCrudSection`;
 * a aba Grupos usa `GruposFuncoesSection`, que além do CRUD permite ordenar os
 * grupos e definir as funções de cada um.
 */

import { useCallback, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ConfigCrudSection } from "@/components/ConfigCrudSection";
import { GruposFuncoesSection } from "@/components/GruposFuncoesSection";
import {
  useArtistas,
  useCreateArtista,
  useUpdateArtista,
  useDeleteArtista,
} from "@/hooks/use-artistas";
import {
  useCategorias,
  useCreateCategoria,
  useUpdateCategoria,
  useDeleteCategoria,
  useFuncoes,
  useCreateFuncao,
  useUpdateFuncao,
  useDeleteFuncao,
  useTonalidades,
  useCreateTonalidade,
  useUpdateTonalidade,
  useDeleteTonalidade,
  useTiposEventos,
  useCreateTipoEvento,
  useUpdateTipoEvento,
  useDeleteTipoEvento,
} from "@/hooks/use-support";
import { useCan } from "@/hooks/use-can";
import type { Artista } from "@/schemas/artista";
import type { IdNome, Tonalidade } from "@/schemas/shared";

/**
 * Componente da página de configurações.
 *
 * @returns Elemento JSX com a página de configurações em abas.
 */
const Settings = () => {
  const { can: canWrite } = useCan("configuracoes.write");
  const tabsListRef = useRef<HTMLDivElement>(null);

  /**
   * Centraliza a aba selecionada no scroll horizontal da TabsList.
   * Aguarda a atualização do DOM via requestAnimationFrame e usa
   * scrollIntoView com inline: 'center' para revelar abas adjacentes.
   */
  const handleTabChange = useCallback(() => {
    requestAnimationFrame(() => {
      const list = tabsListRef.current;
      if (!list) return;
      const activeTab = list.querySelector<HTMLElement>(
        '[data-state="active"]',
      );
      activeTab?.scrollIntoView({
        behavior: "smooth",
        block: "nearest",
        inline: "center",
      });
    });
  }, []);

  /**
   * As 5 mutations de exclusão abaixo são silenciosas (`{ silent: true }`):
   * o feedback de exclusão é o toast com a ação "Desfazer" do
   * `useUndoableDelete` dentro do `ConfigCrudSection` — o toast padrão do
   * hook duplicaria o aviso. O toast de erro permanece nos hooks.
   */
  const artistas = useArtistas();
  const createArtista = useCreateArtista();
  const updateArtista = useUpdateArtista();
  const deleteArtista = useDeleteArtista({ silent: true });

  const categorias = useCategorias();
  const createCategoria = useCreateCategoria();
  const updateCategoria = useUpdateCategoria();
  const deleteCategoria = useDeleteCategoria({ silent: true });

  const funcoes = useFuncoes();
  const createFuncao = useCreateFuncao();
  const updateFuncao = useUpdateFuncao();
  const deleteFuncao = useDeleteFuncao({ silent: true });

  const tonalidades = useTonalidades();
  const createTonalidade = useCreateTonalidade();
  const updateTonalidade = useUpdateTonalidade();
  const deleteTonalidade = useDeleteTonalidade({ silent: true });

  const tiposEventos = useTiposEventos();
  const createTipoEvento = useCreateTipoEvento();
  const updateTipoEvento = useUpdateTipoEvento();
  const deleteTipoEvento = useDeleteTipoEvento({ silent: true });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Configurações
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie os cadastros auxiliares do sistema
        </p>
      </div>

      <Card className="shadow-soft border-0">
        <Tabs defaultValue="artistas" onValueChange={handleTabChange}>
          <CardHeader className="pb-0">
            <TabsList
              ref={tabsListRef}
              className="flex w-full justify-start overflow-x-auto scrollbar-none md:grid md:grid-cols-6"
            >
              <TabsTrigger value="artistas" className="shrink-0">
                Artistas
              </TabsTrigger>
              <TabsTrigger value="categorias" className="shrink-0">
                Categorias
              </TabsTrigger>
              <TabsTrigger value="funcoes" className="shrink-0">
                Funções
              </TabsTrigger>
              <TabsTrigger value="grupos" className="shrink-0">
                Grupos
              </TabsTrigger>
              <TabsTrigger value="tonalidades" className="shrink-0">
                Tonalidades
              </TabsTrigger>
              <TabsTrigger value="tipos-eventos" className="shrink-0">
                Tipos de Evento
              </TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent className="pt-6">
            <TabsContent value="artistas">
              <ConfigCrudSection<Artista>
                config={{
                  label: "Artista",
                  genero: "m",
                  getName: (item) => item.nome,
                  getId: (item) => item.id,
                  emptyTitle: "Nenhum artista cadastrado",
                  emptyDescription:
                    "Adicione artistas usando o campo acima para associar às músicas do repertório.",
                }}
                items={artistas.data}
                isLoading={artistas.isLoading}
                onCreate={async (name) => {
                  await createArtista.mutateAsync({ nome: name });
                }}
                onUpdate={async (id, name) => {
                  await updateArtista.mutateAsync({
                    id,
                    dados: { nome: name },
                  });
                }}
                onDelete={async (id) => {
                  await deleteArtista.mutateAsync(id);
                }}
                isCreating={createArtista.isPending}
                isUpdating={updateArtista.isPending}
                readOnly={!canWrite}
              />
            </TabsContent>

            <TabsContent value="categorias">
              <ConfigCrudSection<IdNome>
                config={{
                  label: "Categoria",
                  genero: "f",
                  getName: (item) => item.nome,
                  getId: (item) => item.id,
                  emptyTitle: "Nenhuma categoria cadastrada",
                  emptyDescription:
                    "Crie categorias usando o campo acima para classificar as músicas.",
                }}
                items={categorias.data}
                isLoading={categorias.isLoading}
                onCreate={async (name) => {
                  await createCategoria.mutateAsync({ nome: name });
                }}
                onUpdate={async (id, name) => {
                  await updateCategoria.mutateAsync({
                    id,
                    dados: { nome: name },
                  });
                }}
                onDelete={async (id) => {
                  await deleteCategoria.mutateAsync(id);
                }}
                isCreating={createCategoria.isPending}
                isUpdating={updateCategoria.isPending}
                readOnly={!canWrite}
              />
            </TabsContent>

            <TabsContent value="funcoes">
              <ConfigCrudSection<IdNome>
                config={{
                  label: "Função",
                  genero: "f",
                  getName: (item) => item.nome,
                  getId: (item) => item.id,
                  emptyTitle: "Nenhuma função cadastrada",
                  emptyDescription:
                    "Adicione funções usando o campo acima para definir os papéis dos integrantes.",
                }}
                items={funcoes.data}
                isLoading={funcoes.isLoading}
                onCreate={async (name) => {
                  await createFuncao.mutateAsync({ nome: name });
                }}
                onUpdate={async (id, name) => {
                  await updateFuncao.mutateAsync({ id, dados: { nome: name } });
                }}
                onDelete={async (id) => {
                  await deleteFuncao.mutateAsync(id);
                }}
                isCreating={createFuncao.isPending}
                isUpdating={updateFuncao.isPending}
                readOnly={!canWrite}
              />
            </TabsContent>

            <TabsContent value="grupos">
              <GruposFuncoesSection />
            </TabsContent>

            <TabsContent value="tonalidades">
              <ConfigCrudSection<Tonalidade>
                config={{
                  label: "Tonalidade",
                  genero: "f",
                  getName: (item) => item.tom,
                  getId: (item) => item.id,
                  emptyTitle: "Nenhuma tonalidade cadastrada",
                  emptyDescription:
                    "Cadastre tonalidades usando o campo acima para usar nas músicas.",
                }}
                items={tonalidades.data}
                isLoading={tonalidades.isLoading}
                onCreate={async (name) => {
                  await createTonalidade.mutateAsync({ tom: name });
                }}
                onUpdate={async (id, name) => {
                  await updateTonalidade.mutateAsync({
                    id,
                    dados: { tom: name },
                  });
                }}
                onDelete={async (id) => {
                  await deleteTonalidade.mutateAsync(id);
                }}
                isCreating={createTonalidade.isPending}
                isUpdating={updateTonalidade.isPending}
                readOnly={!canWrite}
              />
            </TabsContent>

            <TabsContent value="tipos-eventos">
              <ConfigCrudSection<IdNome>
                config={{
                  label: "Tipo de Evento",
                  genero: "m",
                  getName: (item) => item.nome,
                  getId: (item) => item.id,
                  emptyTitle: "Nenhum tipo de evento cadastrado",
                  emptyDescription:
                    "Crie tipos de evento usando o campo acima para categorizar as escalas.",
                }}
                items={tiposEventos.data}
                isLoading={tiposEventos.isLoading}
                onCreate={async (name) => {
                  await createTipoEvento.mutateAsync({ nome: name });
                }}
                onUpdate={async (id, name) => {
                  await updateTipoEvento.mutateAsync({
                    id,
                    dados: { nome: name },
                  });
                }}
                onDelete={async (id) => {
                  await deleteTipoEvento.mutateAsync(id);
                }}
                isCreating={createTipoEvento.isPending}
                isUpdating={updateTipoEvento.isPending}
                readOnly={!canWrite}
              />
            </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Settings;
