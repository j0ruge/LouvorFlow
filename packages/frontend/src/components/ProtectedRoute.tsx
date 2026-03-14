/**
 * Componente de proteção de rota autenticada.
 *
 * Redireciona o usuário para a tela de login se não estiver autenticado,
 * preservando a URL de destino original para redirecionamento pós-login.
 * Exibe um indicador de carregamento durante a verificação inicial da sessão.
 */

import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "@/hooks/use-auth";
import { Loader2 } from "lucide-react";

/**
 * Wrapper de rota que exige autenticação.
 *
 * Se o usuário está autenticado, renderiza os filhos.
 * Se não está autenticado, redireciona ao `/login` preservando
 * a URL atual como query parameter `redirect`.
 * Durante a verificação inicial, exibe spinner de carregamento.
 *
 * @param children - Conteúdo a ser renderizado quando autenticado.
 * @returns Elemento React com proteção de autenticação.
 */
export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, isLoading } = useAuth();
  const location = useLocation();

  if (isLoading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!isAuthenticated) {
    const redirectTo = location.pathname + location.search;
    return <Navigate to={`/login?redirect=${encodeURIComponent(redirectTo)}`} replace />;
  }

  return <>{children}</>;
}
