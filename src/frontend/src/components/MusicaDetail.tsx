/**
 * Componente de detalhe de música com gestão completa.
 *
 * Exibe informações básicas (nome, tonalidade) com edição inline,
 * lista de versões (add/edit/remove via VersaoForm), tags e funções
 * requeridas (select + badges removíveis), e botão de exclusão
 * com diálogo de confirmação informando impacto CASCADE.
 */

import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Music,
  Guitar,
  Plus,
  X,
  Pencil,
  Check,
  Trash2,
  Tag,
  Users,
  Link as LinkIcon,
} from "lucide-react";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { VersaoForm } from "@/components/VersaoForm";
import {
  useUpdateMusica,
  useDeleteMusica,
  useAddVersao,
  useUpdateVersao,
  useRemoveVersao,
  useAddTagMusica,
  useRemoveTagMusica,
  useAddFuncaoMusica,
  useRemoveFuncaoMusica,
} from "@/hooks/use-musicas";
import { useTonalidades, useTags, useFuncoes } from "@/hooks/use-support";
import type { Musica, Versao, CreateVersaoForm } from "@/schemas/musica";

/** Propriedades do componente MusicaDetail. */
interface MusicaDetailProps {
  /** Dados completos da música. */
  musica: Musica;
  /** Callback executado após exclusão bem-sucedida. */
  onDeleted: () => void;
}

/**
 * Componente principal da página de detalhes da música.
 *
 * @param props - Propriedades do componente.
 * @returns Elemento React com o detalhe completo da música.
 */
export function MusicaDetail({ musica, onDeleted }: MusicaDetailProps) {
  const [isEditingName, setIsEditingName] = useState(false);
  const [editName, setEditName] = useState(musica.nome);
  const [editTonalidade, setEditTonalidade] = useState(musica.tonalidade?.id ?? "");
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [versaoFormOpen, setVersaoFormOpen] = useState(false);
  const [editingVersao, setEditingVersao] = useState<Versao | null>(null);
  const [selectedTagId, setSelectedTagId] = useState("");
  const [selectedFuncaoId, setSelectedFuncaoId] = useState("");

  const updateMusica = useUpdateMusica();
  const deleteMusica = useDeleteMusica();
  const addVersao = useAddVersao(musica.id);
  const updateVersao = useUpdateVersao(musica.id);
  const removeVersao = useRemoveVersao(musica.id);
  const addTag = useAddTagMusica(musica.id);
  const removeTag = useRemoveTagMusica(musica.id);
  const addFuncao = useAddFuncaoMusica(musica.id);
  const removeFuncao = useRemoveFuncaoMusica(musica.id);

  const { data: tonalidades } = useTonalidades();
  const { data: allTags } = useTags();
  const { data: allFuncoes } = useFuncoes();

  /** Tags disponíveis para adição (excluindo já associadas). */
  const tagsAssociadasIds = new Set(musica.tags.map((t) => t.id));
  const tagsDisponiveis = allTags?.filter((t) => !tagsAssociadasIds.has(t.id)) ?? [];

  /** Funções disponíveis para adição (excluindo já associadas). */
  const funcoesAssociadasIds = new Set(musica.funcoes.map((f) => f.id));
  const funcoesDisponiveis = allFuncoes?.filter((f) => !funcoesAssociadasIds.has(f.id)) ?? [];

  /** Salva a edição do nome/tonalidade. */
  function handleSaveInfo() {
    updateMusica.mutate(
      {
        id: musica.id,
        dados: { nome: editName, fk_tonalidade: editTonalidade },
      },
      { onSuccess: () => setIsEditingName(false) },
    );
  }

  /** Confirma a exclusão da música. */
  function handleConfirmDelete() {
    deleteMusica.mutate(musica.id, {
      onSuccess: () => {
        setDeleteOpen(false);
        onDeleted();
      },
    });
  }

  /** Submete o formulário de versão (criação ou edição). */
  function handleVersaoSubmit(dados: CreateVersaoForm) {
    if (editingVersao) {
      updateVersao.mutate(
        {
          versaoId: editingVersao.id,
          dados: {
            bpm: dados.bpm,
            cifras: dados.cifras,
            lyrics: dados.lyrics,
            link_versao: dados.link_versao,
          },
        },
        {
          onSuccess: () => {
            setVersaoFormOpen(false);
            setEditingVersao(null);
          },
        },
      );
    } else {
      addVersao.mutate(dados, {
        onSuccess: () => {
          setVersaoFormOpen(false);
        },
      });
    }
  }

  /** Adiciona a tag selecionada. */
  function handleAddTag() {
    if (!selectedTagId) return;
    addTag.mutate(selectedTagId, {
      onSuccess: () => setSelectedTagId(""),
    });
  }

  /** Adiciona a função selecionada. */
  function handleAddFuncao() {
    if (!selectedFuncaoId) return;
    addFuncao.mutate(selectedFuncaoId, {
      onSuccess: () => setSelectedFuncaoId(""),
    });
  }

  return (
    <div className="space-y-6">
      {/* Informações básicas */}
      <Card className="shadow-soft border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-lg bg-gradient-primary flex items-center justify-center">
                <Music className="h-6 w-6 text-white" />
              </div>
              {isEditingName ? (
                <div className="flex items-center gap-2">
                  <Input
                    value={editName}
                    onChange={(e) => setEditName(e.target.value)}
                    className="h-8 w-48"
                    autoFocus
                  />
                  <Select
                    value={editTonalidade}
                    onValueChange={setEditTonalidade}
                  >
                    <SelectTrigger className="h-8 w-32">
                      <SelectValue placeholder="Tonalidade" />
                    </SelectTrigger>
                    <SelectContent>
                      {tonalidades?.map((ton) => (
                        <SelectItem key={ton.id} value={ton.id}>
                          {ton.tom}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleSaveInfo}
                    disabled={updateMusica.isPending}
                  >
                    <Check className="h-4 w-4 text-green-600" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setIsEditingName(false);
                      setEditName(musica.nome);
                      setEditTonalidade(musica.tonalidade?.id ?? "");
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              ) : (
                <div>
                  <CardTitle className="text-xl flex items-center gap-2">
                    {musica.nome}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => setIsEditingName(true)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                  </CardTitle>
                  {musica.tonalidade && (
                    <div className="flex items-center gap-1 mt-1">
                      <Guitar className="h-4 w-4 text-primary" />
                      <span className="text-sm text-muted-foreground">
                        {musica.tonalidade.tom}
                      </span>
                    </div>
                  )}
                </div>
              )}
            </div>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setDeleteOpen(true)}
            >
              <Trash2 className="h-4 w-4 mr-1" />
              Excluir
            </Button>
          </div>
        </CardHeader>
      </Card>

      {/* Versões */}
      <Card className="shadow-soft border-0">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              <LinkIcon className="h-5 w-5" />
              Versões ({musica.versoes.length})
            </CardTitle>
            <Button
              size="sm"
              onClick={() => {
                setEditingVersao(null);
                setVersaoFormOpen(true);
              }}
            >
              <Plus className="h-4 w-4 mr-1" />
              Nova Versão
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          {musica.versoes.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-4">
              Nenhuma versão cadastrada. Adicione a primeira versão.
            </p>
          ) : (
            <div className="space-y-2">
              {musica.versoes.map((versao) => (
                <div
                  key={versao.id}
                  className="flex items-center justify-between p-3 rounded-lg border border-border"
                >
                  <div className="flex items-center gap-3">
                    <Music className="h-4 w-4 text-primary" />
                    <span className="font-medium">{versao.artista.nome}</span>
                    {versao.bpm && (
                      <Badge variant="outline" className="text-xs">
                        {versao.bpm} BPM
                      </Badge>
                    )}
                    {versao.link_versao && (
                      <a
                        href={versao.link_versao}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline text-xs"
                      >
                        <LinkIcon className="h-3 w-3" />
                      </a>
                    )}
                  </div>
                  <div className="flex items-center gap-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditingVersao(versao);
                        setVersaoFormOpen(true);
                      }}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeVersao.mutate(versao.id)}
                      disabled={removeVersao.isPending}
                    >
                      <X className="h-4 w-4 text-destructive" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tags */}
      <Card className="shadow-soft border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" />
            Tags ({musica.tags.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Select value={selectedTagId} onValueChange={setSelectedTagId}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecione uma tag para adicionar" />
              </SelectTrigger>
              <SelectContent>
                {tagsDisponiveis.map((tag) => (
                  <SelectItem key={tag.id} value={tag.id}>
                    {tag.nome}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Button
              size="sm"
              onClick={handleAddTag}
              disabled={!selectedTagId || addTag.isPending}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {musica.tags.map((tag) => (
              <Badge key={tag.id} variant="secondary" className="gap-1">
                {tag.nome}
                <button
                  onClick={() => removeTag.mutate(tag.id)}
                  disabled={removeTag.isPending}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {musica.tags.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhuma tag associada.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Funções requeridas */}
      <Card className="shadow-soft border-0">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Users className="h-5 w-5" />
            Funções Requeridas ({musica.funcoes.length})
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Select
              value={selectedFuncaoId}
              onValueChange={setSelectedFuncaoId}
            >
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Selecione uma função para adicionar" />
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
              disabled={!selectedFuncaoId || addFuncao.isPending}
            >
              <Plus className="h-4 w-4" />
            </Button>
          </div>
          <div className="flex flex-wrap gap-2">
            {musica.funcoes.map((funcao) => (
              <Badge key={funcao.id} variant="outline" className="gap-1">
                {funcao.nome}
                <button
                  onClick={() => removeFuncao.mutate(funcao.id)}
                  disabled={removeFuncao.isPending}
                  className="ml-1 hover:text-destructive"
                >
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
            {musica.funcoes.length === 0 && (
              <p className="text-sm text-muted-foreground">
                Nenhuma função requerida.
              </p>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Dialog de versão */}
      <VersaoForm
        open={versaoFormOpen}
        onOpenChange={(open) => {
          setVersaoFormOpen(open);
          if (!open) setEditingVersao(null);
        }}
        onSubmit={handleVersaoSubmit}
        isPending={addVersao.isPending || updateVersao.isPending}
        versao={editingVersao}
      />

      {/* Dialog de exclusão */}
      <DeleteConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title={`Excluir "${musica.nome}"`}
        description="Esta música será removida de todas as escalas em que está associada. Deseja continuar?"
        onConfirm={handleConfirmDelete}
        isLoading={deleteMusica.isPending}
      />
    </div>
  );
}
