/**
 * Página de administração de igrejas (super-admin).
 *
 * Lista todas as igrejas em uma tabela com nome, status, contagem de membros
 * e ações de criação, edição e ativação/desativação. Acessível apenas para
 * usuários com role "super-admin".
 */

import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import {
  Building2,
  Plus,
  Pencil,
  Users,
  Power,
  PowerOff,
  Loader2,
} from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Form,
  FormField,
  FormItem,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { FieldLabel } from "@/components/form/FieldLabel";
import { RequiredFieldsLegend } from "@/components/form/RequiredFieldsLegend";
import { ResponsiveFormDialog } from "@/components/ResponsiveFormDialog";
import { useDirtyFormGuard } from "@/hooks/use-dirty-form-guard";
import {
  useIgrejas,
  useCreateIgreja,
  useUpdateIgreja,
} from "@/hooks/use-igrejas";
import { CreateIgrejaFormSchema, type Igreja, type CreateIgrejaForm } from "@/schemas/auth";
import { ErrorState } from "@/components/ErrorState";
import { DeleteConfirmDialog } from "@/components/DeleteConfirmDialog";

/**
 * Componente da página de administração de igrejas.
 *
 * Exibe tabela de igrejas com ações de criação, edição e ativação/desativação.
 * Permite navegar para o gerenciamento de usuários de cada igreja.
 *
 * @returns Elemento JSX com a página de administração de igrejas.
 */
const AdminIgrejas = () => {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [editingIgreja, setEditingIgreja] = useState<Igreja | null>(null);
  /** Igreja aguardando confirmação de desativação (null = nenhum diálogo aberto). */
  const [deactivatingIgreja, setDeactivatingIgreja] = useState<Igreja | null>(null);
  /**
   * Igreja cuja alternância de status está em voo.
   *
   * `updateMutation.isPending` sozinho é global: desabilitaria o botão de todas
   * as linhas (e também o "Salvar" do diálogo de edição, que usa a mesma
   * mutation) enquanto uma única linha era alternada.
   */
  const [togglingIgrejaId, setTogglingIgrejaId] = useState<string | null>(null);

  const {
    data: todasIgrejas,
    isLoading,
    isError,
    error,
    refetch,
  } = useIgrejas();
  const createMutation = useCreateIgreja();
  const updateMutation = useUpdateIgreja();

  /**
   * Esconde o tenant sentinela da listagem.
   *
   * `IgrejaSchema.status` é `"active" | "inactive" | "system"`, mas a tela trata
   * o status como binário (badge "Ativa"/"Inativa" e botão Desativar/Reativar).
   * Um tenant `system` cairia no ramo "Inativa" com um botão "Reativar" que o
   * backend recusa com 403 (`recusarTenantDeSistema`). Hoje o repositório já o
   * exclui de `findAll`, então isto é defesa em profundidade: se a listagem
   * mudar, a tela continua coerente em vez de oferecer uma ação impossível.
   */
  const igrejas = useMemo(
    () => todasIgrejas?.filter((igreja) => igreja.status !== "system"),
    [todasIgrejas],
  );

  const createForm = useForm<CreateIgrejaForm>({
    resolver: zodResolver(CreateIgrejaFormSchema),
    defaultValues: { name: "" },
  });

  const editForm = useForm<CreateIgrejaForm>({
    resolver: zodResolver(CreateIgrejaFormSchema),
    defaultValues: { name: "" },
  });

  /**
   * Guarda de alterações não salvas do dialog de criação: fechar por
   * Esc/backdrop/X/Cancelar com o formulário sujo exibe o veil de confirmação.
   * Permanece armado durante submit pendente (ver comentário no MusicaForm).
   *
   * O `reset()` vive no `aoFechar` (não no `aoDescartar`): todo fechamento
   * limpa o formulário — inclusive o fechamento "limpo" após um submit
   * inválido, em que `isDirty` é false mas `formState.errors` persistiria e
   * reabrir mostraria erros fantasma. Idempotente com o formulário limpo.
   */
  const guardaCriacao = useDirtyFormGuard({
    temAlteracoes: createForm.formState.isDirty,
    aoFechar: () => {
      createForm.reset();
      setCreateDialogOpen(false);
    },
  });

  /**
   * Guarda de alterações não salvas do dialog de edição. O `aoFechar` absorve
   * a limpeza que antes vivia no `onOpenChange` do Dialog: além de fechar,
   * reseta o formulário e limpa `editingIgreja`.
   */
  const guardaEdicao = useDirtyFormGuard({
    temAlteracoes: editForm.formState.isDirty,
    aoFechar: () => {
      editForm.reset();
      setEditingIgreja(null);
      setEditDialogOpen(false);
    },
  });

  /**
   * Processa o envio do formulário de criação de nova igreja.
   *
   * @param dados - Dados validados do formulário (nome da igreja).
   */
  function onCreateSubmit(dados: CreateIgrejaForm) {
    createMutation.mutate({ name: dados.name }, {
      onSuccess: () => {
        createForm.reset();
        setCreateDialogOpen(false);
        toast.success("Igreja criada com sucesso.");
      },
      onError: (err) => {
        toast.error(err instanceof Error ? err.message : "Erro ao criar igreja.");
      },
    });
  }

  /**
   * Processa o envio do formulário de edição de uma igreja existente.
   *
   * @param dados - Dados validados do formulário (nome da igreja).
   */
  function onEditSubmit(dados: CreateIgrejaForm) {
    if (!editingIgreja) return;
    updateMutation.mutate(
      { id: editingIgreja.id, data: dados },
      {
        onSuccess: () => {
          editForm.reset();
          setEditDialogOpen(false);
          setEditingIgreja(null);
          toast.success("Igreja atualizada com sucesso.");
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Erro ao atualizar igreja.");
        },
      },
    );
  }

  /**
   * Abre o dialog de edição com os dados da igreja selecionada.
   *
   * @param igreja - Igreja a ser editada.
   */
  function handleOpenEdit(igreja: Igreja) {
    setEditingIgreja(igreja);
    editForm.reset({ name: igreja.name });
    setEditDialogOpen(true);
  }

  /**
   * Aplica a mudança de status de uma igreja.
   *
   * @param igreja - Igreja a ter o status alternado.
   * @param newStatus - Novo status a persistir.
   */
  function aplicarStatus(igreja: Igreja, newStatus: "active" | "inactive") {
    setTogglingIgrejaId(igreja.id);
    updateMutation.mutate(
      { id: igreja.id, data: { status: newStatus } },
      {
        onSuccess: () => {
          toast.success(
            newStatus === "inactive"
              ? "Igreja desativada com sucesso."
              : "Igreja reativada com sucesso.",
          );
          setDeactivatingIgreja(null);
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Erro ao alterar status.");
        },
        onSettled: () => setTogglingIgrejaId(null),
      },
    );
  }

  /**
   * Alterna o estado ativo/inativo de uma igreja.
   *
   * Desativar bloqueia login e renovação de sessão de **todos** os usuários
   * daquela igreja, então exige confirmação explícita. Reativar é inócuo e
   * segue imediato.
   *
   * @param igreja - Igreja a ter o status alternado.
   */
  function handleToggleStatus(igreja: Igreja) {
    if (igreja.status === "active") {
      setDeactivatingIgreja(igreja);
      return;
    }
    aplicarStatus(igreja, "active");
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="min-w-0">
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Igrejas
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerenciar igrejas e organizações
          </p>
        </div>

        <Button
          className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-soft w-full sm:w-auto"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Igreja
        </Button>
      </div>

      {/* Tabela de igrejas */}
      <Card className="shadow-soft border-0">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Building2 className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {igrejas
                ? `${igrejas.length} igreja(s) cadastrada(s)`
                : "Carregando..."}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                  <Skeleton className="h-4 w-10" />
                  <Skeleton className="h-8 w-24" />
                </div>
              ))}
            </div>
          )}

          {!isLoading && isError && (
            <ErrorState
              message={error?.message ?? "Erro ao carregar igrejas."}
              onRetry={() => refetch()}
            />
          )}

          {!isLoading && !isError && igrejas && igrejas.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma igreja cadastrada.
            </div>
          )}

          {!isLoading && !isError && igrejas && igrejas.length > 0 && (
            <>
              {/* Mobile: Cards */}
              <div className="space-y-3 sm:hidden">
                {igrejas.map((igreja) => (
                  <div
                    key={igreja.id}
                    className="p-4 rounded-lg border border-border space-y-3"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <p className="font-medium truncate min-w-0">{igreja.name}</p>
                      {igreja.status === "active" ? (
                        <Badge className="flex-shrink-0 bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
                          Ativa
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="flex-shrink-0 text-muted-foreground">
                          Inativa
                        </Badge>
                      )}
                    </div>
                    <p className="text-sm text-muted-foreground">
                      {igreja._count?.tenant_users ?? 0} membro(s)
                    </p>
                    <div className="space-y-2">
                      <Button variant="outline" size="sm" className="w-full" asChild>
                        <Link to={`/admin/igrejas/${igreja.id}/usuarios`}>
                          <Users className="mr-1 h-3 w-3" />
                          Membros
                        </Link>
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleOpenEdit(igreja)}
                      >
                        <Pencil className="mr-1 h-3 w-3" />
                        Editar
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        className="w-full"
                        onClick={() => handleToggleStatus(igreja)}
                        disabled={togglingIgrejaId === igreja.id}
                      >
                        {togglingIgrejaId === igreja.id ? (
                          <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                        ) : igreja.status === "active" ? (
                          <PowerOff className="mr-1 h-3 w-3" />
                        ) : (
                          <Power className="mr-1 h-3 w-3" />
                        )}
                        {igreja.status === "active" ? "Desativar" : "Reativar"}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Desktop: Table */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Membros</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {igrejas.map((igreja) => (
                      <TableRow key={igreja.id}>
                        <TableCell className="font-medium max-w-[16rem] truncate">
                          {igreja.name}
                        </TableCell>
                        <TableCell>
                          {igreja.status === "active" ? (
                            <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
                              Ativa
                            </Badge>
                          ) : (
                            <Badge variant="secondary" className="text-muted-foreground">
                              Inativa
                            </Badge>
                          )}
                        </TableCell>
                        <TableCell>{igreja._count?.tenant_users ?? 0}</TableCell>
                        <TableCell>
                          <div className="flex items-center justify-end gap-2 flex-wrap">
                            <Button variant="outline" size="sm" asChild>
                              <Link to={`/admin/igrejas/${igreja.id}/usuarios`}>
                                <Users className="mr-1 h-3 w-3" />
                                Membros
                              </Link>
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleOpenEdit(igreja)}
                            >
                              <Pencil className="mr-1 h-3 w-3" />
                              Editar
                            </Button>
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => handleToggleStatus(igreja)}
                              disabled={togglingIgrejaId === igreja.id}
                            >
                              {togglingIgrejaId === igreja.id ? (
                                <Loader2 className="mr-1 h-3 w-3 animate-spin" />
                              ) : igreja.status === "active" ? (
                                <PowerOff className="mr-1 h-3 w-3" />
                              ) : (
                                <Power className="mr-1 h-3 w-3" />
                              )}
                              {igreja.status === "active" ? "Desativar" : "Reativar"}
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog de criação (Drawer no mobile, Dialog no desktop) */}
      <Form {...createForm}>
        <ResponsiveFormDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          title="Nova Igreja"
          description="Preencha os dados da nova igreja ou organização."
          onSubmit={createForm.handleSubmit(onCreateSubmit)}
          contentClassName="sm:max-w-[425px]"
          dirtyGuard={guardaCriacao}
          footer={
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => guardaCriacao.pedirFechamento()}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-gradient-primary hover:opacity-90 transition-opacity"
                disabled={createMutation.isPending}
              >
                {createMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Criar
              </Button>
            </>
          }
        >
          <RequiredFieldsLegend />
          <FormField
            control={createForm.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FieldLabel required>Nome</FieldLabel>
                <FormControl>
                  <Input
                    placeholder="Nome da igreja ou organização"
                    aria-required
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </ResponsiveFormDialog>
      </Form>

      {/* Dialog de edição (Drawer no mobile, Dialog no desktop) */}
      <Form {...editForm}>
        <ResponsiveFormDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          title="Editar Igreja"
          description="Altere o nome da igreja ou organização."
          onSubmit={editForm.handleSubmit(onEditSubmit)}
          contentClassName="sm:max-w-[425px]"
          dirtyGuard={guardaEdicao}
          footer={
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => guardaEdicao.pedirFechamento()}
              >
                Cancelar
              </Button>
              <Button
                type="submit"
                className="bg-gradient-primary hover:opacity-90 transition-opacity"
                disabled={updateMutation.isPending}
              >
                {updateMutation.isPending ? (
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                ) : null}
                Salvar
              </Button>
            </>
          }
        >
          <RequiredFieldsLegend />
          <FormField
            control={editForm.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FieldLabel required>Nome</FieldLabel>
                <FormControl>
                  <Input
                    placeholder="Nome da igreja ou organização"
                    aria-required
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </ResponsiveFormDialog>
      </Form>

      {/* Confirmação de desativação — bloqueia o acesso de todos os membros */}
      <DeleteConfirmDialog
        open={deactivatingIgreja !== null}
        onOpenChange={(open) => {
          if (!open) setDeactivatingIgreja(null);
        }}
        title="Desativar igreja?"
        description={
          deactivatingIgreja
            ? `Todos os usuários de "${deactivatingIgreja.name}" perderão o acesso: novos logins são bloqueados e as sessões ativas não poderão ser renovadas. Você pode reativar a igreja depois.`
            : ""
        }
        onConfirm={() => {
          if (deactivatingIgreja) aplicarStatus(deactivatingIgreja, "inactive");
        }}
        isLoading={updateMutation.isPending}
      />
    </div>
  );
};

export default AdminIgrejas;
