/**
 * Página de administração de permissões.
 *
 * Lista todas as permissões em uma tabela com nome e descrição.
 * Permite criar novas permissões via dialog com formulário validado por Zod.
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Key } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
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
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { usePermissions, useCreatePermission } from "@/hooks/use-admin";
import { CreatePermissionFormSchema, type CreatePermissionForm } from "@/schemas/auth";

/**
 * Componente da página de administração de permissões.
 *
 * Exibe tabela de permissões com ação de criação via dialog.
 *
 * @returns Elemento JSX com a página de administração de permissões.
 */
const AdminPermissions = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: permissions, isLoading } = usePermissions();
  const createMutation = useCreatePermission();

  const {
    register,
    handleSubmit,
    reset,
    formState: { errors },
  } = useForm<CreatePermissionForm>({
    resolver: zodResolver(CreatePermissionFormSchema),
  });

  /**
   * Processa o envio do formulário de criação de permissão.
   *
   * @param dados - Dados validados do formulário (nome, descrição).
   */
  function onSubmit(dados: CreatePermissionForm) {
    createMutation.mutate(dados, {
      onSuccess: () => {
        reset();
        setDialogOpen(false);
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Permissões
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as permissões do sistema
          </p>
        </div>

        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild>
            <Button className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-soft">
              <Plus className="mr-2 h-4 w-4" />
              Nova Permissão
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Criar Nova Permissão</DialogTitle>
            </DialogHeader>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="perm-name">Nome</Label>
                <Input
                  id="perm-name"
                  placeholder="Ex: manage_users, edit_songs"
                  {...register("name")}
                />
                {errors.name && (
                  <p className="text-xs text-destructive">{errors.name.message}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="perm-description">Descrição</Label>
                <Input
                  id="perm-description"
                  placeholder="Descrição da permissão"
                  {...register("description")}
                />
                {errors.description && (
                  <p className="text-xs text-destructive">{errors.description.message}</p>
                )}
              </div>

              <div className="flex justify-end gap-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => setDialogOpen(false)}
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
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      <Card className="shadow-soft border-0">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {permissions
                ? `${permissions.length} permissão(ões) cadastrada(s)`
                : "Carregando..."}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-36" />
                  <Skeleton className="h-4 w-64" />
                </div>
              ))}
            </div>
          )}

          {!isLoading && permissions && permissions.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhuma permissão cadastrada.
            </div>
          )}

          {!isLoading && permissions && permissions.length > 0 && (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Nome</TableHead>
                  <TableHead>Descrição</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {permissions.map((permission) => (
                  <TableRow key={permission.id}>
                    <TableCell className="font-medium">{permission.name}</TableCell>
                    <TableCell>{permission.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default AdminPermissions;
