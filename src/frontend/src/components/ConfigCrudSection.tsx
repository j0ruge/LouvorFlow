/**
 * Componente genérico de seção CRUD para entidades auxiliares.
 *
 * Renderiza uma lista de itens com formulário inline para criar,
 * editar e excluir entidades simples (nome único). Usado nas abas
 * da página de Configurações.
 *
 * @typeParam T - Tipo da entidade com ao menos `id` e campo de nome.
 */

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, Plus, X, Check, Loader2 } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";

/** Configuração de uma entidade para o ConfigCrudSection. */
interface EntityConfig<T> {
  /** Rótulo exibido para a entidade (ex.: "Artista", "Tag"). */
  label: string;
  /** Função para extrair o nome da entidade (campo de exibição). */
  getName: (item: T) => string;
  /** Função para extrair o id da entidade. */
  getId: (item: T) => string;
}

/** Propriedades do componente ConfigCrudSection. */
interface ConfigCrudSectionProps<T> {
  /** Configuração da entidade. */
  config: EntityConfig<T>;
  /** Lista de itens a exibir. */
  items: T[] | undefined;
  /** Indica se os itens estão sendo carregados. */
  isLoading: boolean;
  /** Callback para criar um novo item. */
  onCreate: (name: string) => Promise<void>;
  /** Callback para atualizar um item existente. */
  onUpdate: (id: string, name: string) => Promise<void>;
  /** Callback para excluir um item. */
  onDelete: (id: string) => Promise<void>;
  /** Indica se uma operação de criação está em andamento. */
  isCreating?: boolean;
  /** Indica se uma operação de atualização está em andamento. */
  isUpdating?: boolean;
  /** Indica se uma operação de exclusão está em andamento. */
  isDeleting?: boolean;
}

/**
 * Seção CRUD genérica para entidades auxiliares.
 *
 * @param props - Propriedades do componente.
 * @returns Elemento React com a lista e formulário inline.
 */
export function ConfigCrudSection<T>({
  config,
  items,
  isLoading,
  onCreate,
  onUpdate,
  onDelete,
  isCreating = false,
  isUpdating = false,
  isDeleting = false,
}: ConfigCrudSectionProps<T>) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);

  /** Inicia a criação de um novo item. */
  async function handleCreate() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    try {
      await onCreate(trimmed);
    } finally {
      setNewName("");
    }
  }

  /** Inicia a edição de um item existente. */
  function startEditing(id: string, currentName: string) {
    setEditingId(id);
    setEditName(currentName);
  }

  /** Cancela a edição em andamento. */
  function cancelEditing() {
    setEditingId(null);
    setEditName("");
  }

  /** Salva a edição do item. */
  async function handleUpdate() {
    if (!editingId) return;
    const trimmed = editName.trim();
    if (!trimmed) return;
    try {
      await onUpdate(editingId, trimmed);
    } finally {
      cancelEditing();
    }
  }

  /** Confirma e executa a exclusão do item selecionado. */
  async function handleConfirmDelete() {
    if (!deleteTarget) return;
    try {
      await onDelete(deleteTarget.id);
    } finally {
      setDeleteTarget(null);
    }
  }

  return (
    <div className="space-y-4">
      {/* Formulário de criação */}
      <div className="flex items-center gap-2">
        <Input
          placeholder={`Novo(a) ${config.label.toLowerCase()}...`}
          value={newName}
          onChange={(e) => setNewName(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter") handleCreate();
          }}
          disabled={isCreating}
        />
        <Button
          size="sm"
          onClick={handleCreate}
          disabled={isCreating || !newName.trim()}
        >
          {isCreating ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Plus className="h-4 w-4" />
          )}
        </Button>
      </div>

      {/* Lista de itens */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Carregando...
        </p>
      ) : !items || items.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Nenhum(a) {config.label.toLowerCase()} cadastrado(a).
        </p>
      ) : (
        <div className="space-y-2">
          {items.map((item) => {
            const id = config.getId(item);
            const name = config.getName(item);
            const isEditingThis = editingId === id;

            return (
              <div
                key={id}
                className="flex items-center justify-between p-3 rounded-lg border border-border"
              >
                {isEditingThis ? (
                  <div className="flex items-center gap-2 flex-1">
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleUpdate();
                        if (e.key === "Escape") cancelEditing();
                      }}
                      className="h-8"
                      autoFocus
                      disabled={isUpdating}
                    />
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={handleUpdate}
                      disabled={isUpdating || !editName.trim()}
                    >
                      {isUpdating ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Check className="h-4 w-4 text-green-600" />
                      )}
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={cancelEditing}
                      disabled={isUpdating}
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <>
                    <span className="font-medium">{name}</span>
                    <div className="flex items-center gap-1">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => startEditing(id, name)}
                        aria-label={`Editar ${config.label.toLowerCase()}`}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => setDeleteTarget({ id, name })}
                        aria-label={`Excluir ${config.label.toLowerCase()}`}
                      >
                        <Trash2 className="h-4 w-4 text-destructive" />
                      </Button>
                    </div>
                  </>
                )}
              </div>
            );
          })}
        </div>
      )}

      <DeleteConfirmDialog
        open={!!deleteTarget}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null);
        }}
        title={`Excluir ${config.label}`}
        description={`Tem certeza que deseja excluir "${deleteTarget?.name}"? Essa ação não pode ser desfeita.`}
        onConfirm={handleConfirmDelete}
        isLoading={isDeleting}
      />
    </div>
  );
}
