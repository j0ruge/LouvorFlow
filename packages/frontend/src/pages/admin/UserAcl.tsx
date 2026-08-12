/**
 * Página de gerenciamento de ACL (Access Control List) de um usuário.
 *
 * Exibe o nome do usuário e permite atribuir/remover papéis e permissões
 * individuais via checkboxes. Impede que o usuário logado remova o papel
 * "admin" de si mesmo (prevenção de auto-demoção).
 */

import { useState, useEffect } from "react";
import { useParams, Link } from "react-router-dom";
import { Loader2, ArrowLeft, Shield } from "lucide-react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { useAuth } from "@/hooks/use-auth";
import { useUserAcl, useSetUserAcl, useRoles, usePermissions } from "@/hooks/use-admin";
import { UserAclFormSchema } from "@/schemas/auth";
import { formatRoleLabel } from "@/lib/utils";

/**
 * Componente da página de gerenciamento de ACL de um usuário.
 *
 * Carrega a ACL atual do usuário e lista todos os papéis e permissões
 * disponíveis. O administrador pode selecionar/desmarcar itens e salvar.
 *
 * @returns Elemento JSX com a página de gerenciamento de ACL.
 */
const UserAcl = () => {
  const { userId } = useParams<{ userId: string }>();
  const { user: currentUser } = useAuth();
  const { data: userAcl, isLoading: isLoadingAcl } = useUserAcl(userId ?? null);
  const { data: allRoles, isLoading: isLoadingRoles } = useRoles();
  const { data: allPermissions, isLoading: isLoadingPermissions } = usePermissions();
  const setAclMutation = useSetUserAcl();

  const [selectedRoles, setSelectedRoles] = useState<string[]>([]);
  const [selectedPermissions, setSelectedPermissions] = useState<string[]>([]);
  /**
   * Usuário já semeado nos checkboxes — guarda o `userId`, não um booleano.
   *
   * O React Router reaproveita a instância do componente quando só o parâmetro
   * da URL muda: com um latch booleano, ir de `/usuarios/A/acl` para
   * `/usuarios/B/acl` sem desmontar manteria a ACL de A na tela. Mesma correção
   * já aplicada em `useScrollRestoration`.
   */
  const [inicializadoPara, setInicializadoPara] = useState<string | null>(null);

  const isLoading = isLoadingAcl || isLoadingRoles || isLoadingPermissions;
  const isOwnProfile = currentUser?.id === userId;
  const callerIsSuperAdmin = currentUser?.roles?.some((r) => r.name === 'super-admin') ?? false;
  /** Admins regulares não podem editar suas próprias permissões (prevenção de auto-elevação). */
  const isSelfEditBlocked = isOwnProfile && !callerIsSuperAdmin;

  /**
   * Inicializa os checkboxes com os papéis e permissões atuais do usuário.
   *
   * Uma vez por usuário — refetches não sobrescrevem edições em andamento, mas
   * trocar de usuário na mesma instância do componente re-semeia.
   */
  useEffect(() => {
    if (userAcl && userId && inicializadoPara !== userId) {
      setSelectedRoles(userAcl.roles.map((r) => r.id));
      setSelectedPermissions(userAcl.permissions.map((p) => p.id));
      setInicializadoPara(userId);
    }
  }, [userAcl, userId, inicializadoPara]);

  /**
   * Alterna a seleção de um papel.
   *
   * @param roleId - UUID do papel a ser alternado.
   * @param roleName - Nome do papel (para verificação de auto-demoção).
   */
  function handleToggleRole(roleId: string, roleName: string) {
    if (isOwnProfile && roleName === "admin" && selectedRoles.includes(roleId)) {
      toast.error("Você não pode remover o papel 'admin' de si mesmo.");
      return;
    }

    setSelectedRoles((prev) =>
      prev.includes(roleId)
        ? prev.filter((id) => id !== roleId)
        : [...prev, roleId],
    );
  }

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
   * Salva a ACL atualizada do usuário, validando via schema Zod.
   */
  function handleSave() {
    if (!userId) return;

    const result = UserAclFormSchema.safeParse({
      roles: selectedRoles,
      permissions: selectedPermissions,
    });

    if (!result.success) {
      toast.error(result.error.issues[0]?.message ?? "Dados inválidos.");
      return;
    }

    setAclMutation.mutate({
      userId,
      dados: result.data,
    });
  }

  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center gap-4">
          <Link to="/admin/usuarios">
            <Button variant="ghost" size="icon" aria-label="Voltar para lista de usuários">
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
        <Link to="/admin/usuarios">
          <Button variant="ghost" size="icon" aria-label="Voltar para lista de usuários">
            <ArrowLeft className="h-5 w-5" />
          </Button>
        </Link>
        <div className="min-w-0">
          <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent line-clamp-2">
            ACL de {userAcl?.name ?? "Usuário"}
          </h1>
          <p className="text-muted-foreground mt-1">
            Gerencie os papéis e permissões deste usuário
          </p>
        </div>
      </div>

      {isSelfEditBlocked && (
        <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
          Não é permitido editar suas próprias permissões. Solicite a um super-administrador.
        </div>
      )}

      <Card className="shadow-soft border-0">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-medium">Papéis</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Selecione os papéis que o usuário deve possuir.
          </p>
        </CardHeader>
        <CardContent>
          {allRoles && allRoles.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {allRoles.map((role) => {
                const isChecked = selectedRoles.includes(role.id);
                const isDisabled =
                  isOwnProfile && role.name === "admin" && isChecked;

                return (
                  <div key={role.id} className="flex items-start gap-3">
                    <Checkbox
                      id={`role-${role.id}`}
                      checked={isChecked}
                      disabled={isDisabled}
                      onCheckedChange={() => handleToggleRole(role.id, role.name)}
                    />
                    <div className="space-y-0.5">
                      <Label
                        htmlFor={`role-${role.id}`}
                        className={isDisabled ? "text-muted-foreground cursor-not-allowed" : "cursor-pointer"}
                      >
                        {formatRoleLabel(role.name)}
                      </Label>
                      <p className="text-xs text-muted-foreground">{role.description}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <p className="text-sm text-muted-foreground">Nenhum papel cadastrado.</p>
          )}
        </CardContent>
      </Card>

      <Card className="shadow-soft border-0">
        <CardHeader>
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 text-muted-foreground" />
            <h2 className="text-lg font-medium">Permissões Individuais</h2>
          </div>
          <p className="text-sm text-muted-foreground">
            Permissões atribuídas diretamente ao usuário (além das herdadas pelos papéis).
          </p>
        </CardHeader>
        <CardContent>
          {allPermissions && allPermissions.length > 0 ? (
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
              {allPermissions.map((permission) => (
                <div key={permission.id} className="flex items-start gap-3">
                  <Checkbox
                    id={`perm-${permission.id}`}
                    checked={selectedPermissions.includes(permission.id)}
                    onCheckedChange={() => handleTogglePermission(permission.id)}
                  />
                  <div className="space-y-0.5">
                    <Label htmlFor={`perm-${permission.id}`} className="cursor-pointer">
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
          disabled={setAclMutation.isPending || isSelfEditBlocked}
        >
          {setAclMutation.isPending ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : null}
          Salvar ACL
        </Button>
      </div>
    </div>
  );
};

export default UserAcl;
