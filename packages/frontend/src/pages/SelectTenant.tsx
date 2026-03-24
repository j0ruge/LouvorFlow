/**
 * Página de seleção de organização (tenant) no fluxo de login multi-tenant.
 *
 * Exibida quando o usuário pertence a mais de uma organização/igreja. Apresenta
 * uma lista de cards com os tenants disponíveis para o usuário selecionar.
 * Após a seleção, chama `POST /api/sessions/select-tenant` e completa o login
 * redirecionando ao dashboard.
 *
 * Espera receber via `location.state`:
 * - `tenants`: lista de organizações disponíveis.
 * - `selection_token`: token temporário de seleção retornado pelo login.
 */

import { useState } from "react";
import { useNavigate, useLocation, Navigate } from "react-router-dom";
import { Music, Building2, Loader2 } from "lucide-react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/hooks/use-auth";
import { selectTenant } from "@/services/auth";
import type { Tenant } from "@/schemas/auth";

/** Estado esperado em `location.state` ao navegar para esta página. */
interface SelectTenantLocationState {
  /** Lista de organizações disponíveis para o usuário. */
  tenants: Tenant[];
  /** Token temporário de seleção, válido por tempo limitado. */
  selection_token: string;
}

/**
 * Componente da página de seleção de organização.
 *
 * Renderiza cards clicáveis para cada tenant disponível. Ao clicar,
 * realiza a chamada ao backend para completar a autenticação e
 * redireciona ao dashboard.
 *
 * @returns Elemento JSX com a página de seleção de tenant.
 */
const SelectTenant = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { completeTenantLogin, isAuthenticated } = useAuth();
  const [selectedTenantId, setSelectedTenantId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  /**
   * Valida em runtime o state recebido via navegação.
   * Usa sessionStorage como fallback para o selection_token,
   * permitindo sobreviver a recarregamentos (F5).
   */
  const rawState = location.state as Record<string, unknown> | null;
  const hasTenants = rawState != null && Array.isArray(rawState.tenants);
  const selectionToken =
    (typeof rawState?.selection_token === "string" ? rawState.selection_token : null)
    ?? sessionStorage.getItem('selection_token');
  const state: SelectTenantLocationState | null =
    hasTenants && selectionToken
      ? { tenants: rawState.tenants as Tenant[], selection_token: selectionToken }
      : null;

  // Redireciona ao login se não houver state válido (acesso direto à URL)
  if (!state?.tenants || !state?.selection_token) {
    sessionStorage.removeItem('selection_token');
    return <Navigate to="/login" replace />;
  }

  // Se já autenticado, não há motivo para estar nesta página
  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  const { tenants, selection_token } = state;

  /**
   * Processa a seleção de um tenant pelo usuário.
   *
   * @param tenantId - UUID do tenant selecionado.
   */
  async function handleSelectTenant(tenantId: string) {
    if (selectedTenantId) return; // Evita cliques duplos durante carregamento

    setSelectedTenantId(tenantId);
    setError(null);

    try {
      const response = await selectTenant(selection_token, tenantId);
      /** Limpa o selection_token do sessionStorage após seleção bem-sucedida. */
      sessionStorage.removeItem('selection_token');
      completeTenantLogin(response.user, response.token, response.refresh_token, tenants);
      navigate("/", { replace: true });
    } catch (err) {
      setError(
        err instanceof Error
          ? err.message
          : "Não foi possível selecionar a organização. Tente novamente.",
      );
      setSelectedTenantId(null);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-subtle px-4">
      <Card className="w-full max-w-md shadow-soft border-0">
        <CardHeader className="text-center space-y-2 pb-2">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Music className="h-8 w-8 text-primary" />
            <h1 className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              LouvorFlow
            </h1>
          </div>
          <p className="text-muted-foreground text-sm">
            Selecione a organização que deseja acessar
          </p>
        </CardHeader>

        <CardContent className="space-y-3">
          {error && (
            <div className="rounded-md bg-destructive/10 border border-destructive/20 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          {tenants.map((tenant) => {
            const isLoading = selectedTenantId === tenant.id;

            return (
              <Button
                key={tenant.id}
                variant="outline"
                className="w-full h-auto py-4 px-4 flex items-center gap-3 justify-start text-left hover:bg-primary/5 hover:border-primary/40 transition-colors"
                disabled={selectedTenantId !== null}
                onClick={() => handleSelectTenant(tenant.id)}
              >
                <div className="flex items-center justify-center h-9 w-9 rounded-full bg-primary/10 shrink-0">
                  {isLoading ? (
                    <Loader2 className="h-4 w-4 text-primary animate-spin" />
                  ) : (
                    <Building2 className="h-4 w-4 text-primary" />
                  )}
                </div>
                <span className="font-medium text-sm truncate">{tenant.name}</span>
              </Button>
            );
          })}

          <div className="pt-2 text-center">
            <Button
              variant="ghost"
              size="sm"
              className="text-muted-foreground hover:text-foreground text-xs"
              disabled={selectedTenantId !== null}
              onClick={() => navigate("/login", { replace: true })}
            >
              Voltar ao login
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default SelectTenant;
