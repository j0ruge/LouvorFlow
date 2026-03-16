/**
 * Componente declarativo para renderização condicional baseada em permissões.
 *
 * Exibe os filhos somente se o usuário autenticado possuir a permissão
 * especificada. Admins com `admin_full_access` sempre veem o conteúdo.
 * Durante o carregamento da sessão, nada é renderizado (fail-closed).
 *
 * @example
 * ```tsx
 * <Can permission="musicas.write">
 *   <Button>Nova Música</Button>
 * </Can>
 * ```
 */

import type { ReactNode } from "react";
import { useCan } from "@/hooks/use-can";

/** Props do componente Can. */
interface CanProps {
  /** Nome da permissão requerida (ex: "musicas.write"). */
  permission: string;
  /** Conteúdo a ser renderizado se o usuário tiver a permissão. */
  children: ReactNode;
  /** Conteúdo alternativo exibido quando o usuário NÃO tem permissão. */
  fallback?: ReactNode;
}

/**
 * Renderiza condicionalmente seus filhos baseado na permissão do usuário.
 *
 * @param props - Props com permission, children e fallback opcional.
 * @returns Filhos se autorizado, fallback se não, ou null durante loading.
 */
export function Can({ permission, children, fallback = null }: CanProps) {
  const { can, isLoading } = useCan(permission);

  if (isLoading) return null;
  if (!can) return <>{fallback}</>;
  return <>{children}</>;
}
