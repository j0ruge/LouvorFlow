/**
 * Componente de proteção de rota administrativa.
 *
 * Exibe a página de Acesso Negado (403) quando o usuário autenticado
 * não possui a role "admin". Deve ser usado dentro de um `ProtectedRoute`
 * para garantir que o usuário já esteja autenticado.
 */

import { useAuth } from "@/hooks/use-auth";
import Forbidden from "@/pages/Forbidden";

/**
 * Wrapper de rota que exige role "admin".
 *
 * Se o usuário possui a role "admin", renderiza os filhos.
 * Caso contrário, exibe a página de Acesso Negado.
 *
 * @param children - Conteúdo a ser renderizado quando admin.
 * @returns Elemento React com proteção de admin.
 */
export function AdminRoute({ children }: { children: React.ReactNode }) {
  const { isAdmin } = useAuth();

  if (!isAdmin) {
    return <Forbidden />;
  }

  return <>{children}</>;
}
