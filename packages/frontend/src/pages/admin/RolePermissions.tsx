/**
 * Página de gerenciamento de permissões de uma role.
 *
 * Exibe o nome da role e lista todas as permissões disponíveis
 * com checkboxes indicando quais estão atribuídas à role.
 * Permite salvar as alterações via API.
 */

import { useState, useEffect, useMemo } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, ArrowLeft, Key } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useRoles, usePermissions, useSetRolePermissions } from "@/hooks/use-admin";
import { RolePermissionsFormSchema } from "@/schemas/auth";
import { toast } from "sonner";

/**
 * Componente da página de gerenciamento de permissões de uma role.
 *
 * Carrega a role atual e todas as permissões disponíveis,
 * permitindo atribuir ou remover permissões via checkboxes.
 *
 * @returns Elemento JSX com a página de gerenciamento de permissões da role.
 */
const RolePermissions = () => {
  const { roleId } = useParams<{ roleId: string }>();
  const { data: roles, isLoading: isLoadingRoles } = useRoles();
  const { data: allPermissions, isLoading: isLoadingPermissions } = usePermissions();
  const setPermissionsMutation = useSetRolePermissions();

  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  const [initialized, setInitialized] = useState(false);

  const isLoading = isLoadingRoles || isLoadingPermissions;

  /**
   * Busca a role atual dentro da lista de roles carregadas.
   */
  const currentRole = useMemo(
    () => roles?.find((r) => r.id === roleId) ?? null,
    [roles, roleId],
  );

  /**
   * Inicializa os checkboxes com as permissões atuais da role.
   * Apenas na primeira carga — refetches não sobrescrevem edições em andamento.
   */
  useEffect(() => {
    if (currentRole && !initialized) {
      setSelectedPermissions(currentRole.permissions.map((p) => p.id));
      setInitialized(true);
    }
  }, [currentRole, initialized]);

  /**
   * Alterna a seleção de uma permissão.
   *
   * @param permissionId - UUID da permissão a ser alternada.
   */
  function handleTogglePermission(permissionId: string) {
    setSelectedPermissions((prev) =>
      prev.includes(permissionId)
        ? prev.filter((id) => id !== permissionId)
        : [...prev, permissionId],
    );
  }

  /**
   * Salva as permissões atualizadas da role, validando via schema Zod.
   */
  function handleSave() {
    if (!roleId) return;

    const result = RolePermissionsFormSchema.safeParse({
      permissions: selectedPermissions,
    });

    if (!result.success) {
      toast.error(result.error.issues[0]?.message ?? "Dados inválidos.");
      return;
    }

    setPermissionsMutation.mutate({
      roleId,
      dados: result.data,
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/admin/roles">
            <Button variant="ghost" size="icon" aria-label="Voltar para lista de roles">
              <ArrowLeft className="h-5 w-5" />
            </Button>
          </Link>
          <div>
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-64 mt-1" />
          </div>
        </div>
        <Card className="shadow-soft border-0">
          <CardContent className="p-6 space-y-4">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-6 w-full" />
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4">
        <Link to="/admin/roles">
          <Button variant="ghost" size="icon">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div>
          <h1 className="text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent">
            Permissões de {currentRole?.name ?? "Role"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie as permissões atribuídas a esta role
          </p>
        </div>
      </div>

      <Card className="shadow-soft border-0">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Key className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-medium">Permissões Disponíveis</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Marque as permissões que esta role deve possuir.
          </p>
        </CardHeader>
        <CardContent>
          {allPermissions && allPermissions.length > 0 ? (
            <div className="grid gap-3 sm:grid-cols-2">
              {allPermissions.map((permission) => (
                <div key={permission.id} className="flex items-start gap-3">
                  <Checkbox
                    id={`role-perm-${permission.id}`}
                    checked={selectedPermissions.includes(permission.id)}
                    onCheckedChange={() => handleTogglePermission(permission.id)}
                  />
                  <div className="space-y-0.5">
                    <Label htmlFor={`role-perm-${permission.id}`} className="cursor-pointer">
                      {permission.name}
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      {permission.description}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhuma permissão cadastrada.</p>
          )}
        </CardContent>
      </Card>

      <Separator />

      <div className="flex justify-end">
        <Button
          className="bg-gradient-primary hover:opacity-90 transition-opacity shadow-soft"
          onClick={handleSave}
          disabled={setPermissionsMutation.isPending || selectedPermissions.length === 0}
        >
          {setPermissionsMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Salvar Permissões
        </Button>
      </div>
    </div>
  );
};

export default RolePermissions;
