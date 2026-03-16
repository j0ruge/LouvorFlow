/**
 * Hook e utilitários para verificação de permissões no frontend.
 *
 * Fornece `useEffectivePermissions()` para computar o conjunto de permissões
 * efetivas do usuário (diretas + herdadas via roles) e `useCan()` para
 * verificar se o usuário possui uma permissão específica.
 *
 * O admin (possuidor de `admin_full_access`) obtém bypass automático em
 * todas as verificações. Durante o carregamento da sessão, retorna
 * `can: false` (fail-closed) para evitar flicker visual.
 */

import { useMemo } from "react";
import { useAuth } from "@/contexts/AuthContext";
import type { AuthUser } from "@/schemas/auth";

/**
 * Computa o conjunto de nomes de permissões efetivas a partir de um objeto de usuário.
 *
 * Função pura que combina permissões diretas (`user.permissions`) com
 * permissões herdadas via roles (`user.roles[].permissions[]`) em um Set.
 *
 * @param user - Objeto do usuário autenticado ou `null`.
 * @returns Set com os nomes de todas as permissões efetivas.
 */
export function computeEffectivePermissions(user: AuthUser | null): Set<string> {
  if (!user) return new Set<string>();

  const directPermissions = user.permissions?.map((p) => p.name) ?? [];
  const rolePermissions =
    user.roles?.flatMap((r) => r.permissions?.map((p) => p.name) ?? []) ?? [];

  return new Set([...directPermissions, ...rolePermissions]);
}

/**
 * Verifica se o usuário possui uma permissão específica dado um Set de permissões efetivas.
 *
 * Admins com `admin_full_access` recebem bypass automático.
 *
 * @param effectivePermissions - Set de permissões efetivas do usuário.
 * @param permission - Nome da permissão a verificar.
 * @returns `true` se o usuário tem a permissão ou é admin.
 */
export function checkPermission(effectivePermissions: Set<string>, permission: string): boolean {
  if (effectivePermissions.has("admin_full_access")) return true;
  return effectivePermissions.has(permission);
}

/**
 * Hook que computa o conjunto de permissões efetivas do usuário autenticado.
 *
 * @returns Set com os nomes de todas as permissões efetivas.
 */
export function useEffectivePermissions(): Set<string> {
  const { user } = useAuth();
  return useMemo(() => computeEffectivePermissions(user), [user]);
}

/**
 * Resultado da verificação de permissão.
 */
interface UseCanResult {
  /** `true` se o usuário possui a permissão (ou é admin). */
  can: boolean;
  /** `true` enquanto o contexto de autenticação está carregando. */
  isLoading: boolean;
}

/**
 * Verifica se o usuário autenticado possui uma permissão específica.
 *
 * Retorna `{ can: false, isLoading: true }` durante o carregamento
 * da sessão (fail-closed — botões não aparecem até confirmar permissão).
 *
 * Usuários com `admin_full_access` recebem bypass automático.
 *
 * @param permission - Nome da permissão a verificar (ex: "musicas.write").
 * @returns Objeto com `can` (boolean) e `isLoading` (boolean).
 */
export function useCan(permission: string): UseCanResult {
  const { isLoading } = useAuth();
  const effectivePermissions = useEffectivePermissions();

  const can = useMemo(() => {
    if (isLoading) return false;
    return checkPermission(effectivePermissions, permission);
  }, [isLoading, effectivePermissions, permission]);

  return { can, isLoading };
}
