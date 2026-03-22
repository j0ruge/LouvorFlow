/**
 * Componente de alternância de tenant (organização) para usuários multi-tenant.
 *
 * Exibe um botão dropdown com o nome do tenant ativo. Ao abrir, lista todos os
 * tenants disponíveis para o usuário. Clicar em um tenant diferente do ativo
 * chama `switchTenant()` do AuthContext, que troca a sessão sem re-login.
 *
 * Só é renderizado quando o usuário possui mais de um tenant disponível.
 * Design mobile-first usando shadcn/ui DropdownMenu.
 */

import { useState } from "react";
import { Building2, ChevronsUpDown, Check, Loader2 } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

/**
 * Componente TenantSwitcher — alternância de organização no sidebar.
 *
 * Renderiza um botão que exibe o tenant ativo e um dropdown com todos os
 * tenants do usuário. Ao selecionar outro tenant, realiza a troca via API.
 * Retorna `null` se o usuário possui apenas um tenant ou nenhum.
 *
 * @returns Elemento JSX com o seletor de tenant ou `null`.
 */
export function TenantSwitcher() {
  const { currentTenant, availableTenants, switchTenant } = useAuth();
  const [switchingTenantId, setSwitchingTenantId] = useState<string | null>(null);

  if (availableTenants.length <= 1) {
    return null;
  }

  /**
   * Processa a troca de tenant ao clicar em um item do dropdown.
   *
   * Ignora cliques no tenant já ativo e evita chamadas duplicadas
   * enquanto uma troca está em andamento.
   *
   * @param tenantId - UUID do tenant selecionado.
   */
  async function handleSwitch(tenantId: string) {
    if (tenantId === currentTenant?.id) return;
    if (switchingTenantId) return;

    setSwitchingTenantId(tenantId);
    try {
      await switchTenant(tenantId);
      const tenant = availableTenants.find((t) => t.id === tenantId);
      toast.success(`Organização alterada para ${tenant?.name ?? "nova organização"}`);
    } catch (err) {
      toast.error(
        err instanceof Error
          ? err.message
          : "Não foi possível trocar de organização. Tente novamente.",
      );
    } finally {
      setSwitchingTenantId(null);
    }
  }

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button
          variant="ghost"
          className="w-full justify-between px-3 h-10 text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
          disabled={switchingTenantId !== null}
          aria-label="Selecionar organização"
        >
          <div className="flex items-center gap-2 min-w-0">
            <Building2 className="h-4 w-4 shrink-0 text-sidebar-foreground/70" />
            <span className="truncate text-sm font-medium">
              {currentTenant?.name ?? "Sem organização"}
            </span>
          </div>
          <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="bottom"
        align="start"
        className="w-[--radix-dropdown-menu-trigger-width] min-w-48"
      >
        <DropdownMenuLabel className="text-xs text-muted-foreground font-normal">
          Suas organizações
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {availableTenants.map((tenant) => {
          const isActive = tenant.id === currentTenant?.id;
          const isSwitching = switchingTenantId === tenant.id;

          return (
            <DropdownMenuItem
              key={tenant.id}
              onClick={() => handleSwitch(tenant.id)}
              disabled={switchingTenantId !== null}
              className="cursor-pointer flex items-center gap-2"
            >
              <div className="flex items-center gap-2 flex-1 min-w-0">
                {isSwitching ? (
                  <Loader2 className="h-4 w-4 shrink-0 animate-spin text-primary" />
                ) : (
                  <Building2 className="h-4 w-4 shrink-0 text-muted-foreground" />
                )}
                <span className="truncate text-sm">{tenant.name}</span>
              </div>
              {isActive && !isSwitching && (
                <Check className="h-4 w-4 shrink-0 text-primary" />
              )}
            </DropdownMenuItem>
          );
        })}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
