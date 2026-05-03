/**
 * Componente de alternância de tenant (organização) para usuários multi-tenant.
 *
 * Renderizado no rodapé da sidebar como tile (ícone Building2 em quadrado +
 * nome da igreja + subtitle "Ministério de Louvor"). Para usuários multi-tenant
 * abre dropdown ao clicar; para single-tenant fica como display estático.
 * Retorna `null` se o usuário não possui nenhum tenant definido.
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
import { useAuth } from "@/hooks/use-auth";
import { toast } from "sonner";

/**
 * Conteúdo visual interno do tile (compartilhado entre single e multi-tenant).
 *
 * @param props - Props do tile.
 * @param props.name - Nome do tenant ativo.
 * @param props.showChevron - Se `true`, exibe o ícone de chevron à direita
 *   indicando que o tile é interativo (multi-tenant).
 * @returns Elemento React com o conteúdo do tile.
 */
function TenantTile({
  name,
  showChevron,
}: {
  name: string;
  showChevron: boolean;
}) {
  return (
    <>
      <div className="h-8 w-8 rounded-md bg-muted flex items-center justify-center shrink-0">
        <Building2 className="h-4 w-4 text-muted-foreground" />
      </div>
      <div className="min-w-0 flex-1 text-left">
        <p className="text-[13px] font-bold text-sidebar-foreground leading-tight truncate">
          {name}
        </p>
        <p className="text-[11px] text-muted-foreground mt-0.5 truncate">
          Ministério de Louvor
        </p>
      </div>
      {showChevron && (
        <ChevronsUpDown className="h-4 w-4 shrink-0 opacity-50" />
      )}
    </>
  );
}

/** Propriedades do TenantSwitcher. */
interface TenantSwitcherProps {
  /**
   * Quando `true`, renderiza apenas o ícone (modo sidebar colapsada),
   * mantendo o trigger do dropdown funcional para usuários multi-tenant.
   */
  compact?: boolean;
}

/**
 * Componente TenantSwitcher — alternância de organização no rodapé da sidebar.
 *
 * Para usuários multi-tenant renderiza um botão clicável que abre dropdown
 * com a lista de tenants disponíveis. Para single-tenant exibe o nome como
 * tile estático sem interação. Retorna `null` se não há tenant definido.
 * Em modo `compact` (sidebar colapsada) o trigger vira um ícone quadrado.
 *
 * @param props - Propriedades do componente.
 * @returns Elemento JSX com o seletor de tenant, exibição estática ou `null`.
 */
export function TenantSwitcher({ compact = false }: TenantSwitcherProps = {}) {
  const { currentTenant, availableTenants, switchTenant } = useAuth();
  const [switchingTenantId, setSwitchingTenantId] = useState<string | null>(
    null,
  );

  if (!currentTenant) return null;

  // Single-tenant: tile estático (compact = só o ícone)
  if (availableTenants.length <= 1) {
    if (compact) {
      return (
        <div
          className="h-8 w-8 rounded-md bg-sidebar-accent flex items-center justify-center mx-auto"
          aria-label={`Organização ativa: ${currentTenant.name}`}
          title={currentTenant.name}
        >
          <Building2 className="h-4 w-4 text-muted-foreground" />
        </div>
      );
    }
    return (
      <div className="flex items-center gap-2.5 px-2 py-1.5">
        <TenantTile name={currentTenant.name} showChevron={false} />
      </div>
    );
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
      toast.success(
        `Organização alterada para ${tenant?.name ?? "nova organização"}`,
      );
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

  // Multi-tenant: tile clicável com dropdown
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        {compact ? (
          <button
            type="button"
            className="h-8 w-8 mx-auto rounded-md bg-sidebar-accent flex items-center justify-center transition-colors hover:bg-sidebar-accent/80 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 disabled:opacity-50"
            disabled={switchingTenantId !== null}
            aria-label={`Selecionar organização (atual: ${currentTenant.name})`}
            title={currentTenant.name}
          >
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </button>
        ) : (
          <button
            type="button"
            className="w-full flex items-center gap-2.5 px-2 py-1.5 rounded-md transition-colors hover:bg-sidebar-accent focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-1 disabled:opacity-50"
            disabled={switchingTenantId !== null}
            aria-label="Selecionar organização"
          >
            <TenantTile name={currentTenant.name} showChevron={true} />
          </button>
        )}
      </DropdownMenuTrigger>
      <DropdownMenuContent
        side="top"
        align="start"
        className="w-[--radix-dropdown-menu-trigger-width] min-w-56"
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
