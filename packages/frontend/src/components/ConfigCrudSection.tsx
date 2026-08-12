/**
 * Componente genérico de seção CRUD para entidades auxiliares.
 *
 * Renderiza uma lista de itens com formulário inline para criar,
 * editar e excluir entidades simples (nome único). Usado nas abas
 * da página de Configurações.
 *
 * @typeParam T - Tipo da entidade com ao menos `id` e campo de nome.
 */

import { useEffect, useId, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Pencil, Trash2, CornerDownLeft, X, Check, Loader2 } from "lucide-react";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";
import { EmptyState } from "@/components/EmptyState";
import { useUndoableDelete } from "@/hooks/use-undoable-delete";
import { cn, normalizeForSearch } from "@/lib/utils";

/** Duração (ms) do destaque visual aplicado ao item recém-criado. */
const HIGHLIGHT_DURATION_MS = 2000;

/** Configuração de uma entidade para o ConfigCrudSection. */
interface EntityConfig<T> {
  /** Rótulo exibido para a entidade (ex.: "Artista", "Tag"). */
  label: string;
  /**
   * Gênero gramatical do `label` ("m" ou "f"), usado para concordância nas
   * mensagens geradas pelo componente: placeholder do formulário de criação
   * ("Novo"/"Nova") e mensagem de erro de duplicado ("um"/"uma").
   */
  genero: "m" | "f";
  /** Função para extrair o nome da entidade (campo de exibição). */
  getName: (item: T) => string;
  /** Função para extrair o id da entidade. */
  getId: (item: T) => string;
  /** Título exibido no estado vazio da listagem. */
  emptyTitle: string;
  /** Descrição complementar exibida no estado vazio da listagem. */
  emptyDescription: string;
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
  /** Quando `true`, oculta controles de criação, edição e exclusão (modo somente-leitura). */
  readOnly?: boolean;
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
  readOnly = false,
}: ConfigCrudSectionProps<T>) {
  const [newName, setNewName] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [deleteTarget, setDeleteTarget] = useState<{ id: string; name: string } | null>(null);
  /** Mensagem de erro de duplicidade (checagem client-side, só no formulário de criação). */
  const [erroCriacao, setErroCriacao] = useState<string | null>(null);
  /**
   * Nome normalizado (`normalizeForSearch`) do item recém-criado, usado para
   * aplicar o destaque visual de 2s. Guarda o nome — não o id — porque
   * `onCreate` devolve `Promise<void>` e não expõe o id criado; como a
   * checagem de duplicado abaixo já bloqueia nomes case/acento-insensíveis
   * iguais, o nome normalizado é chave única o suficiente sem mudar o
   * contrato de `onCreate`.
   */
  const [recemCriado, setRecemCriado] = useState<string | null>(null);
  const erroCriacaoId = useId();
  /**
   * Exclusão com janela de desfazer: adia o `onDelete` real ~5s enquanto o
   * toast com "Desfazer" está visível e esconde o item pendente da lista.
   * Vive aqui (e não no `Settings.tsx`) porque este componente é quem
   * conhece os `items` a filtrar — o pai só fornece o executor `onDelete`.
   */
  const { agendar: agendarExclusao, estaPendente } = useUndoableDelete({
    excluir: onDelete,
  });

  /** Remove o destaque do item recém-criado 2s depois de marcado, com cleanup no unmount/reexecução. */
  useEffect(() => {
    if (!recemCriado) return;
    const timer = setTimeout(() => setRecemCriado(null), HIGHLIGHT_DURATION_MS);
    return () => clearTimeout(timer);
  }, [recemCriado]);

  /**
   * Verifica se já existe um item com o mesmo nome, ignorando acento e caixa
   * (mesma normalização usada na busca). Camada client-side complementar ao
   * bloqueio 409 case-insensitive do backend — evita a ida-e-volta de rede
   * para o erro de digitação mais comum (decisão D7).
   *
   * @param name - Nome já aparado (trim) a validar contra os itens atuais.
   * @returns `true` quando já existe um item com o mesmo nome normalizado.
   */
  function existeDuplicado(name: string): boolean {
    const normalizado = normalizeForSearch(name);
    return (items ?? []).some(
      (item) => normalizeForSearch(config.getName(item)) === normalizado,
    );
  }

  /**
   * Cria um novo item. Bloqueia duplicados (client-side) antes de chamar
   * `onCreate`; em caso de rejeição da mutation, preserva o texto digitado —
   * o hook de mutation (`use-artistas.ts`/`use-support.ts`) já exibiu o
   * `toast.error`, reexibir a mensagem aqui duplicaria o aviso.
   */
  async function handleCreate() {
    const trimmed = newName.trim();
    if (!trimmed) return;
    if (existeDuplicado(trimmed)) {
      const artigo = config.genero === "f" ? "uma" : "um";
      setErroCriacao(`Já existe ${artigo} ${config.label.toLowerCase()} com esse nome.`);
      return;
    }
    try {
      await onCreate(trimmed);
      setNewName("");
      setErroCriacao(null);
      setRecemCriado(normalizeForSearch(trimmed));
    } catch {
      /* O hook de mutation já exibiu toast.error (use-artistas.ts:46-48,
         use-support.ts:105-107). Reexibir duplicaria; preservar o texto
         digitado é o comportamento útil aqui. */
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

  /**
   * Salva a edição do item. Em caso de rejeição da mutation, mantém o modo
   * de edição aberto com o texto digitado — `cancelEditing()` descartaria o
   * que o usuário editou. O toast de erro já vem do hook de mutation.
   *
   * Escopo consciente: sem checagem de duplicado no rename inline (lacuna
   * registrada — só o formulário de criação valida no cliente).
   */
  async function handleUpdate() {
    if (!editingId) return;
    const trimmed = editName.trim();
    if (!trimmed) return;
    try {
      await onUpdate(editingId, trimmed);
      cancelEditing();
    } catch {
      /* Mesma razão do handleCreate: toast já exibido pelo hook; não chamar
         cancelEditing() aqui preserva o texto em edição. */
    }
  }

  /**
   * Confirma a exclusão do item selecionado agendando-a com janela de
   * desfazer: o item some da lista na hora, mas o `onDelete` real só dispara
   * quando a janela do toast expirar (ou no desmonte da seção — trocar de
   * aba em Configurações desmonta o `TabsContent` e faz o flush). A copy do
   * toast concorda em gênero com o rótulo da entidade ("Artista excluído.",
   * "Categoria excluída.").
   */
  function handleConfirmDelete() {
    if (!deleteTarget) return;
    const participio = config.genero === "f" ? "excluída" : "excluído";
    agendarExclusao(deleteTarget.id, `${config.label} ${participio}.`);
    setDeleteTarget(null);
  }

  /**
   * Itens visíveis na lista: esconde os que estão com exclusão pendente
   * (janela de desfazer). A checagem de duplicado (`existeDuplicado`)
   * continua usando `items` completo de propósito — durante a janela o item
   * ainda existe no backend e recriar o mesmo nome levaria a um 409.
   */
  const itensVisiveis = (items ?? []).filter(
    (item) => !estaPendente(config.getId(item)),
  );

  return (
    <div className="space-y-4">
      {/* Formulário de criação (oculto em modo somente-leitura) */}
      {!readOnly && (
        <div className="flex flex-wrap items-center gap-2">
          <Input
            className="flex-1"
            placeholder={`${config.genero === "f" ? "Nova" : "Novo"} ${config.label.toLowerCase()}...`}
            value={newName}
            onChange={(e) => {
              setNewName(e.target.value);
              if (erroCriacao) setErroCriacao(null);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleCreate();
            }}
            disabled={isCreating}
            aria-invalid={erroCriacao ? "true" : undefined}
            aria-describedby={erroCriacao ? erroCriacaoId : undefined}
          />
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={isCreating || !newName.trim()}
            aria-label="Confirmar criação"
          >
            {isCreating ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <CornerDownLeft className="h-4 w-4" />
            )}
          </Button>
          {/*
            `role="alert"` além do `aria-describedby`: o erro aparece sem que o
            foco mude de lugar (Enter no próprio input, ou clique no botão de
            confirmar, que deixa o foco no botão e não no input descrito). Sem a
            live region, o leitor de tela não reanuncia a descrição e o usuário
            fica sem retorno nenhum da duplicidade.
          */}
          {erroCriacao && (
            <p role="alert" id={erroCriacaoId} className="w-full text-sm text-destructive">
              {erroCriacao}
            </p>
          )}
        </div>
      )}

      {/* Lista de itens */}
      {isLoading ? (
        <p className="text-sm text-muted-foreground text-center py-4">
          Carregando...
        </p>
      ) : itensVisiveis.length === 0 ? (
        <EmptyState
          title={config.emptyTitle}
          description={config.emptyDescription}
        />
      ) : (
        <div className="space-y-2">
          {itensVisiveis.map((item) => {
            const id = config.getId(item);
            const name = config.getName(item);
            const isEditingThis = editingId === id;
            const isRecemCriado = recemCriado !== null && recemCriado === normalizeForSearch(name);

            return (
              <div
                key={id}
                className={cn(
                  "flex items-center justify-between p-3 rounded-lg border border-border gap-2",
                  isRecemCriado &&
                    "motion-safe:animate-highlight-new motion-reduce:ring-2 motion-reduce:ring-primary/40",
                )}
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
                        <Check className="h-4 w-4 text-primary" />
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
                    <span className="font-medium truncate min-w-0">{name}</span>
                    {!readOnly && (
                      <div className="flex items-center gap-1 flex-shrink-0">
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
                    )}
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
        description={`Tem certeza que deseja excluir "${deleteTarget?.name ?? ""}"? Você poderá desfazer nos próximos segundos.`}
        onConfirm={handleConfirmDelete}
        /* Sem isLoading: `agendar` é síncrono (o diálogo fecha antes de
           qualquer pending) e um DELETE adiado de OUTRO item deixaria o
           botão em "Excluindo..." por uma request alheia. */
      />
    </div>
  );
}
