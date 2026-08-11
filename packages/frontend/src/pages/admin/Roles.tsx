/**
 * Página de administração de papéis.
 *
 * Lista todos os papéis em uma tabela com nome, descrição e quantidade
 * de permissões. Permite criar novos papéis via `ResponsiveFormDialog`
 * (Drawer no mobile, Dialog no desktop) e acessar o gerenciamento de
 * permissões de cada papel.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Shield, Key } from "lucide-react";
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
import { useRoles, useCreateRole } from "@/hooks/use-admin";
import { CreateRoleFormSchema, type CreateRoleForm } from "@/schemas/auth";

/**
 * Componente da página de administração de papéis.
 *
 * Exibe tabela de papéis com ações de criação e gerenciamento de permissões.
 *
 * @returns Elemento JSX com a página de administração de papéis.
 */
const AdminRoles = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: roles, isLoading } = useRoles();
  const createMutation = useCreateRole();

  const form = useForm<CreateRoleForm>({
    resolver: zodResolver(CreateRoleFormSchema),
    defaultValues: { name: "", description: "" },
  });

  /**
   * Guarda de alterações não salvas: fechar por Esc/backdrop/X/Cancelar com
   * o formulário sujo exibe o veil de confirmação em vez de descartar tudo.
   * Permanece armado durante submit pendente (ver comentário no MusicaForm).
   *
   * O `reset()` vive no `aoFechar` (não no `aoDescartar`): todo fechamento
   * limpa o formulário — inclusive o fechamento "limpo" após um submit
   * inválido, em que `isDirty` é false mas `formState.errors` persistiria e
   * reabrir mostraria erros fantasma. Idempotente com o formulário limpo.
   */
  const guarda = useDirtyFormGuard({
    temAlteracoes: form.formState.isDirty,
    aoFechar: () => {
      form.reset();
      setDialogOpen(false);
    },
  });

  /**
   * Processa o envio do formulário de criação de papel.
   *
   * @param dados - Dados validados do formulário (nome, descrição).
   */
  function onSubmit(dados: CreateRoleForm) {
    createMutation.mutate(dados, {
      onSuccess: () => {
        form.reset();
        setDialogOpen(false);
      },
    });
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Papéis
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os papéis do sistema
          </p>
        </div>

        <Button
          className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-soft"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Papel
        </Button>
      </div>

      <Card className="shadow-soft border-0">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {roles
                ? `${roles.length} ${roles.length === 1 ? "papel cadastrado" : "papéis cadastrados"}`
                : "Carregando..."}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 4 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-32" />
                  <Skeleton className="h-4 w-56" />
                  <Skeleton className="h-5 w-12 rounded-full" />
                </div>
              ))}
            </div>
          )}

          {!isLoading && roles && roles.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum papel cadastrado.
            </div>
          )}

          {!isLoading && roles && roles.length > 0 && (
            <>
              {/* Mobile: Cards */}
              <div className="space-y-3 sm:hidden">
                {roles.map((role) => (
                  <div
                    key={role.id}
                    className="p-4 rounded-lg border border-border space-y-3"
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium truncate min-w-0 flex-1">{role.name}</span>
                      <Badge variant="secondary" className="text-xs flex-shrink-0">
                        {role.permissions.length} permissão(ões)
                      </Badge>
                    </div>
                    {role.description && (
                      <p className="text-sm text-muted-foreground">
                        {role.description}
                      </p>
                    )}
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link to={`/admin/roles/${role.id}/permissoes`}>
                        <Key className="mr-1 h-3 w-3" />
                        Gerenciar Permissões
                      </Link>
                    </Button>
                  </div>
                ))}
              </div>

              {/* Desktop: Table */}
              <div className="hidden sm:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Nome</TableHead>
                      <TableHead>Descrição</TableHead>
                      <TableHead>Permissões</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {roles.map((role) => (
                      <TableRow key={role.id}>
                        <TableCell className="font-medium">{role.name}</TableCell>
                        <TableCell>{role.description}</TableCell>
                        <TableCell>
                          <Badge variant="secondary" className="text-xs">
                            {role.permissions.length} permissão(ões)
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/admin/roles/${role.id}/permissoes`}>
                              <Key className="mr-1 h-3 w-3" />
                              Gerenciar Permissões
                            </Link>
                          </Button>
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

      {/* Dialog de criação de papel (Drawer no mobile, Dialog no desktop) */}
      <Form {...form}>
        <ResponsiveFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title="Criar Novo Papel"
          description="Preencha os dados do novo papel do sistema."
          onSubmit={form.handleSubmit(onSubmit)}
          contentClassName="sm:max-w-[425px]"
          dirtyGuard={guarda}
          footer={
            <>
              <Button
                type="button"
                variant="outline"
                onClick={() => guarda.pedirFechamento()}
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
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FieldLabel required>Nome</FieldLabel>
                <FormControl>
                  <Input
                    placeholder="Ex: editor, moderator"
                    aria-required
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="description"
            render={({ field }) => (
              <FormItem>
                <FieldLabel required>Descrição</FieldLabel>
                <FormControl>
                  <Input
                    placeholder="Descrição do papel"
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
    </div>
  );
};

export default AdminRoles;
