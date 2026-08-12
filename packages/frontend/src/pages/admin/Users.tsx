/**
 * Página de administração de usuários.
 *
 * Lista todos os usuários em uma tabela com nome, e-mail e badges de papéis.
 * Permite criar novos usuários via `ResponsiveFormDialog` (Drawer no mobile,
 * Dialog no desktop) e acessar o gerenciamento de acessos de cada usuário.
 */

import { useState } from "react";
import { Link } from "react-router-dom";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Shield, Users as UsersIcon } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { PasswordInput } from "@/components/ui/password-input";
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
import { useUsers, useCreateUser } from "@/hooks/use-admin";
import { CreateUserFormSchema, type CreateUserForm } from "@/schemas/auth";
import { formatRoleLabel } from "@/lib/utils";

/**
 * Componente da página de administração de usuários.
 *
 * Exibe tabela de usuários com ações de criação e gerenciamento de ACL.
 *
 * @returns Elemento JSX com a página de administração de usuários.
 */
const AdminUsers = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: users, isLoading } = useUsers();
  const createMutation = useCreateUser();

  const form = useForm<CreateUserForm>({
    resolver: zodResolver(CreateUserFormSchema),
    defaultValues: { name: "", email: "", password: "" },
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
   * Processa o envio do formulário de criação de usuário.
   *
   * @param dados - Dados validados do formulário (nome, e-mail, senha).
   */
  function onSubmit(dados: CreateUserForm) {
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
            Usuários
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os usuários do sistema
          </p>
        </div>

        <Button
          className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-soft"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Novo Usuário
        </Button>
      </div>

      <Card className="shadow-soft border-0">
        <CardHeader>
          <div className="flex items-center gap-2">
            <UsersIcon className="h-5 w-5 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">
              {users ? `${users.length} usuário(s) cadastrado(s)` : "Carregando..."}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          {isLoading && (
            <div className="space-y-3">
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="h-4 w-40" />
                  <Skeleton className="h-4 w-48" />
                  <Skeleton className="h-5 w-16 rounded-full" />
                </div>
              ))}
            </div>
          )}

          {!isLoading && users && users.length === 0 && (
            <div className="text-center py-8 text-muted-foreground">
              Nenhum usuário cadastrado.
            </div>
          )}

          {!isLoading && users && users.length > 0 && (
            <>
              {/* Mobile: Cards */}
              <div className="space-y-3 sm:hidden">
                {users.map((user) => (
                  <div
                    key={user.id}
                    className="p-4 rounded-lg border border-border space-y-3"
                  >
                    <div className="min-w-0">
                      <p className="font-medium truncate">{user.name}</p>
                      <p className="text-sm text-muted-foreground truncate">
                        {user.email}
                      </p>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {user.roles.map((role) => (
                        <Badge key={role.id} variant="outline" className="text-xs">
                          {formatRoleLabel(role.name)}
                        </Badge>
                      ))}
                      {user.roles.length === 0 && (
                        <span className="text-xs text-muted-foreground">
                          Sem papel definido
                        </span>
                      )}
                    </div>
                    <Button variant="outline" size="sm" className="w-full" asChild>
                      <Link to={`/admin/usuarios/${user.id}/acl`}>
                        <Shield className="mr-1 h-3 w-3" />
                        Gerenciar acessos
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
                      <TableHead>E-mail</TableHead>
                      <TableHead>Papéis</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell className="font-medium">{user.name}</TableCell>
                        <TableCell>{user.email}</TableCell>
                        <TableCell>
                          <div className="flex flex-wrap gap-1">
                            {user.roles.map((role) => (
                              <Badge key={role.id} variant="outline" className="text-xs">
                                {formatRoleLabel(role.name)}
                              </Badge>
                            ))}
                            {user.roles.length === 0 && (
                              <span className="text-xs text-muted-foreground">
                                Sem papel definido
                              </span>
                            )}
                          </div>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button variant="outline" size="sm" asChild>
                            <Link to={`/admin/usuarios/${user.id}/acl`}>
                              <Shield className="mr-1 h-3 w-3" />
                              Gerenciar acessos
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

      {/* Dialog de criação de usuário (Drawer no mobile, Dialog no desktop) */}
      <Form {...form}>
        <ResponsiveFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title="Criar Novo Usuário"
          description="Preencha os dados do novo usuário do sistema."
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
                    placeholder="Nome completo"
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
            name="email"
            render={({ field }) => (
              <FormItem>
                <FieldLabel required>E-mail</FieldLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="email@exemplo.com"
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
            name="password"
            render={({ field }) => (
              <FormItem>
                <FieldLabel required>Senha</FieldLabel>
                <FormControl>
                  <PasswordInput
                    placeholder="Mínimo 6 caracteres"
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

export default AdminUsers;
