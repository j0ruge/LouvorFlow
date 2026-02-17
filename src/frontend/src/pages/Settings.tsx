/**
 * Página de configurações do sistema.
 *
 * Renderizada na rota `/configuracoes`. Exibe abas horizontais para gerenciar
 * entidades auxiliares: Artistas, Tags, Funções, Tonalidades e Tipos de Evento.
 * Cada aba renderiza um `ConfigCrudSection` com hooks CRUD específicos.
 */

import { useCallback, useRef } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { ConfigCrudSection } from "@/components/ConfigCrudSection";
import {
  useArtistas,
  useCreateArtista,
  useUpdateArtista,
  useDeleteArtista,
} from "@/hooks/use-artistas";
import {
  useTags,
  useCreateTag,
  useUpdateTag,
  useDeleteTag,
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
import type { Artista } from "@/schemas/artista";
import type { IdNome, Tonalidade } from "@/schemas/shared";

/**
 * Componente da página de configurações.
 *
 * @returns Elemento JSX com a página de configurações em abas.
 */
const Settings = () => {
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
      const activeTab = list.querySelector<HTMLElement>('[data-state="active"]');
      activeTab?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "center" });
    });
  }, []);

  const artistas = useArtistas();
  const createArtista = useCreateArtista();
  const updateArtista = useUpdateArtista();
  const deleteArtista = useDeleteArtista();

  const tags = useTags();
  const createTag = useCreateTag();
  const updateTag = useUpdateTag();
  const deleteTag = useDeleteTag();

  const funcoes = useFuncoes();
  const createFuncao = useCreateFuncao();
  const updateFuncao = useUpdateFuncao();
  const deleteFuncao = useDeleteFuncao();

  const tonalidades = useTonalidades();
  const createTonalidade = useCreateTonalidade();
  const updateTonalidade = useUpdateTonalidade();
  const deleteTonalidade = useDeleteTonalidade();

  const tiposEventos = useTiposEventos();
  const createTipoEvento = useCreateTipoEvento();
  const updateTipoEvento = useUpdateTipoEvento();
  const deleteTipoEvento = useDeleteTipoEvento();

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
          Configurações
        </h1>
        <p className="text-muted-foreground mt-1">
          Gerencie as entidades auxiliares do sistema
        </p>
      </div>

      <Card className="shadow-soft border-0">
        <Tabs defaultValue="artistas" onValueChange={handleTabChange}>
          <CardHeader className="pb-0">
            <TabsList ref={tabsListRef} className="flex w-full justify-start overflow-x-auto scrollbar-none md:grid md:grid-cols-5">
              <TabsTrigger value="artistas" className="shrink-0">Artistas</TabsTrigger>
              <TabsTrigger value="tags" className="shrink-0">Tags</TabsTrigger>
              <TabsTrigger value="funcoes" className="shrink-0">Funções</TabsTrigger>
              <TabsTrigger value="tonalidades" className="shrink-0">Tonalidades</TabsTrigger>
              <TabsTrigger value="tipos-eventos" className="shrink-0">Tipos de Evento</TabsTrigger>
            </TabsList>
          </CardHeader>

          <CardContent className="pt-6">
              <TabsContent value="artistas">
                <ConfigCrudSection<Artista>
                  config={{
                    label: "Artista",
                    getName: (item) => item.nome,
                    getId: (item) => item.id,
                  }}
                  items={artistas.data}
                  isLoading={artistas.isLoading}
                  onCreate={async (name) => {
                    await createArtista.mutateAsync({ nome: name });
                  }}
                  onUpdate={async (id, name) => {
                    await updateArtista.mutateAsync({ id, dados: { nome: name } });
                  }}
                  onDelete={async (id) => {
                    await deleteArtista.mutateAsync(id);
                  }}
                  isCreating={createArtista.isPending}
                  isUpdating={updateArtista.isPending}
                  isDeleting={deleteArtista.isPending}
                />
              </TabsContent>

              <TabsContent value="tags">
                <ConfigCrudSection<IdNome>
                  config={{
                    label: "Tag",
                    getName: (item) => item.nome,
                    getId: (item) => item.id,
                  }}
                  items={tags.data}
                  isLoading={tags.isLoading}
                  onCreate={async (name) => {
                    await createTag.mutateAsync({ nome: name });
                  }}
                  onUpdate={async (id, name) => {
                    await updateTag.mutateAsync({ id, dados: { nome: name } });
                  }}
                  onDelete={async (id) => {
                    await deleteTag.mutateAsync(id);
                  }}
                  isCreating={createTag.isPending}
                  isUpdating={updateTag.isPending}
                  isDeleting={deleteTag.isPending}
                />
              </TabsContent>

              <TabsContent value="funcoes">
                <ConfigCrudSection<IdNome>
                  config={{
                    label: "Função",
                    getName: (item) => item.nome,
                    getId: (item) => item.id,
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
                  isDeleting={deleteFuncao.isPending}
                />
              </TabsContent>

              <TabsContent value="tonalidades">
                <ConfigCrudSection<Tonalidade>
                  config={{
                    label: "Tonalidade",
                    getName: (item) => item.tom,
                    getId: (item) => item.id,
                  }}
                  items={tonalidades.data}
                  isLoading={tonalidades.isLoading}
                  onCreate={async (name) => {
                    await createTonalidade.mutateAsync({ tom: name });
                  }}
                  onUpdate={async (id, name) => {
                    await updateTonalidade.mutateAsync({ id, dados: { tom: name } });
                  }}
                  onDelete={async (id) => {
                    await deleteTonalidade.mutateAsync(id);
                  }}
                  isCreating={createTonalidade.isPending}
                  isUpdating={updateTonalidade.isPending}
                  isDeleting={deleteTonalidade.isPending}
                />
              </TabsContent>

              <TabsContent value="tipos-eventos">
                <ConfigCrudSection<IdNome>
                  config={{
                    label: "Tipo de Evento",
                    getName: (item) => item.nome,
                    getId: (item) => item.id,
                  }}
                  items={tiposEventos.data}
                  isLoading={tiposEventos.isLoading}
                  onCreate={async (name) => {
                    await createTipoEvento.mutateAsync({ nome: name });
                  }}
                  onUpdate={async (id, name) => {
                    await updateTipoEvento.mutateAsync({ id, dados: { nome: name } });
                  }}
                  onDelete={async (id) => {
                    await deleteTipoEvento.mutateAsync(id);
                  }}
                  isCreating={createTipoEvento.isPending}
                  isUpdating={updateTipoEvento.isPending}
                  isDeleting={deleteTipoEvento.isPending}
                />
              </TabsContent>
          </CardContent>
        </Tabs>
      </Card>
    </div>
  );
};

export default Settings;
