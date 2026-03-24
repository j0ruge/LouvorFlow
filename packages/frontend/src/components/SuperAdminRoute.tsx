/**
 * Componente de proteção de rota para super-administradores.
 *
 * Exibe a página de Acesso Negado (403) quando o usuário autenticado
 * não possui a role "super-admin". Deve ser usado dentro de um `ProtectedRoute`
 * para garantir que o usuário já esteja autenticado.
 */

import { useAuth } from "@/hooks/use-auth";
import Forbidden from "@/pages/Forbidden";

/**
 * Wrapper de rota que exige role "super-admin".
 *
 * Se o usuário possui a role "super-admin", renderiza os filhos.
 * Caso contrário, exibe a página de Acesso Negado.
 *
 * @param children - Conteúdo a ser renderizado quando super-admin.
 * @returns Elemento React com proteção de super-admin.
 */
export function SuperAdminRoute({ children }: { children: React.ReactNode }) {
  const { isSuperAdmin } = useAuth();

  if (!isSuperAdmin) {
    return <Forbidden />;
  }

  return <>{children}</>;
}
