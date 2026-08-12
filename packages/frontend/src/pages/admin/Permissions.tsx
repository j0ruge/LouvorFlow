/**
 * Página de administração de permissões.
 *
 * Lista todas as permissões em uma tabela com nome e descrição.
 * Permite criar novas permissões via `ResponsiveFormDialog` (Drawer no
 * mobile, Dialog no desktop) com formulário validado por Zod.
 */

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2, Plus, Key } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
import { usePermissions, useCreatePermission } from "@/hooks/use-admin";
import { CreatePermissionFormSchema, type CreatePermissionForm } from "@/schemas/auth";

/**
 * Componente da página de administração de permissões.
 *
 * Exibe tabela de permissões com ação de criação via dialog responsivo.
 *
 * @returns Elemento JSX com a página de administração de permissões.
 */
const AdminPermissions = () => {
  const [dialogOpen, setDialogOpen] = useState(false);
  const { data: permissions, isLoading } = usePermissions();
  const createMutation = useCreatePermission();

  const form = useForm<CreatePermissionForm>({
    resolver: zodResolver(CreatePermissionFormSchema),
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
   * Processa o envio do formulário de criação de permissão.
   *
   * @param dados - Dados validados do formulário (nome, descrição).
   */
  function onSubmit(dados: CreatePermissionForm) {
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
            Permissões
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as permissões do sistema
          </p>
        </div>

        <Button
          className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-soft"
          onClick={() => setDialogOpen(true)}
        >
          <Plus className="mr-2 h-4 w-4" />
          Nova Permissão
        </Button>
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
            <>
              {/* Cards no mobile: nomes de permissão são tokens snake_case sem
                  espaço, que não quebram linha e forçariam scroll horizontal na
                  tabela a 360px. Mesmo dual layout de Users/Roles/Igrejas. */}
              <div className="space-y-3 sm:hidden">
                {permissions.map((permission) => (
                  <div
                    key={permission.id}
                    className="p-4 rounded-lg border border-border space-y-1"
                  >
                    <p className="font-medium break-words">{permission.name}</p>
                    <p className="text-sm text-muted-foreground break-words">
                      {permission.description}
                    </p>
                  </div>
                ))}
              </div>

              <div className="hidden sm:block">
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
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* Dialog de criação de permissão (Drawer no mobile, Dialog no desktop) */}
      <Form {...form}>
        <ResponsiveFormDialog
          open={dialogOpen}
          onOpenChange={setDialogOpen}
          title="Criar Nova Permissão"
          description="Preencha os dados da nova permissão do sistema."
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
                    placeholder="Ex: manage_users, edit_songs"
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
                    placeholder="Descrição da permissão"
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

export default AdminPermissions;
