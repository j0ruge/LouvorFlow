/**
 * Página de administração de igrejas (super-admin).
 *
 * Lista todas as igrejas em uma tabela com nome, status, contagem de membros
 * e ações de criação, edição e ativação/desativação. Acessível apenas para
 * usuários com role "super-admin".
 */

import { useState } from "react";
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
import { Label } from "@/components/ui/label";
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
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  useIgrejas,
  useCreateIgreja,
  useUpdateIgreja,
  useDeactivateIgreja,
} from "@/hooks/use-igrejas";
import { CreateIgrejaFormSchema, type Igreja, type CreateIgrejaForm } from "@/schemas/auth";

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

  const { data: igrejas, isLoading } = useIgrejas();
  const createMutation = useCreateIgreja();
  const updateMutation = useUpdateIgreja();
  const deactivateMutation = useDeactivateIgreja();

  const createForm = useForm<CreateIgrejaForm>({
    resolver: zodResolver(CreateIgrejaFormSchema),
    defaultValues: { name: "" },
  });

  const editForm = useForm<CreateIgrejaForm>({
    resolver: zodResolver(CreateIgrejaFormSchema),
    defaultValues: { name: "" },
  });

  /**
   * Processa o envio do formulário de criação de nova igreja.
   *
   * @param dados - Dados validados do formulário (nome da igreja).
   */
  function onCreateSubmit(dados: CreateIgrejaForm) {
    createMutation.mutate(dados, {
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
      { id: editingIgreja.id, dados },
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
   * Alterna o estado ativo/inativo de uma igreja.
   *
   * @param igreja - Igreja a ter o status alternado.
   */
  function handleToggleStatus(igreja: Igreja) {
    deactivateMutation.mutate(
      { id: igreja.id, active: !igreja.active },
      {
        onSuccess: () => {
          toast.success(
            igreja.active
              ? "Igreja desativada com sucesso."
              : "Igreja reativada com sucesso.",
          );
        },
        onError: (err) => {
          toast.error(err instanceof Error ? err.message : "Erro ao alterar status.");
        },
      },
    );
  }

  return (
    <div className="space-y-6">
      {/* Cabeçalho */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Igrejas
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerenciar igrejas e organizações
          </p>
        </div>

        <Button
          className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-soft"
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

          {!isLoading && igrejas && igrejas.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma igreja cadastrada.
            </div>
          )}

          {!isLoading && igrejas && igrejas.length > 0 && (
            <div className="overflow-x-auto">
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
                      <TableCell className="font-medium">{igreja.name}</TableCell>
                      <TableCell>
                        {igreja.active ? (
                          <Badge className="bg-green-100 text-green-800 border-green-200 hover:bg-green-100">
                            Ativa
                          </Badge>
                        ) : (
                          <Badge variant="secondary" className="text-muted-foreground">
                            Inativa
                          </Badge>
                        )}
                      </TableCell>
                      <TableCell>{igreja.user_count ?? 0}</TableCell>
                      <TableCell>
                        <div className="flex items-center justify-end gap-2 flex-wrap">
                          <Link to={`/admin/igrejas/${igreja.id}/usuarios`}>
                            <Button variant="outline" size="sm">
                              <Users className="mr-1 h-3 w-3" />
                              Membros
                            </Button>
                          </Link>
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
                            disabled={deactivateMutation.isPending}
                          >
                            {igreja.active ? (
                              <>
                                <PowerOff className="mr-1 h-3 w-3" />
                                Desativar
                              </>
                            ) : (
                              <>
                                <Power className="mr-1 h-3 w-3" />
                                Reativar
                              </>
                            )}
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Dialog de criação */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nova Igreja</DialogTitle>
          </DialogHeader>
          <form onSubmit={createForm.handleSubmit(onCreateSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="create-name">Nome</Label>
              <Input
                id="create-name"
                placeholder="Nome da igreja ou organização"
                {...createForm.register("name")}
              />
              {createForm.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {createForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  createForm.reset();
                  setCreateDialogOpen(false);
                }}
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
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog de edição */}
      <Dialog
        open={editDialogOpen}
        onOpenChange={(open) => {
          if (!open) {
            editForm.reset();
            setEditingIgreja(null);
          }
          setEditDialogOpen(open);
        }}
      >
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Editar Igreja</DialogTitle>
          </DialogHeader>
          <form onSubmit={editForm.handleSubmit(onEditSubmit)} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="edit-name">Nome</Label>
              <Input
                id="edit-name"
                placeholder="Nome da igreja ou organização"
                {...editForm.register("name")}
              />
              {editForm.formState.errors.name && (
                <p className="text-xs text-destructive">
                  {editForm.formState.errors.name.message}
                </p>
              )}
            </div>
            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  editForm.reset();
                  setEditDialogOpen(false);
                  setEditingIgreja(null);
                }}
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
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminIgrejas;
