/**
 * Contexto global de autenticação da aplicação.
 *
 * Fornece o estado do usuário autenticado, funções de login/logout,
 * e flags derivadas (isAuthenticated, isAdmin). Gerencia o ciclo de vida
 * dos tokens (access em memória, refresh em localStorage) e a inicialização
 * automática da sessão via refresh token ao carregar a aplicação.
 */

import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
  useMemo,
  type ReactNode,
} from "react";
import {
  setAccessToken,
  setRefreshToken,
  getRefreshToken,
  clearTokens,
  setOnAuthFailure,
} from "@/lib/api";
import { login as loginService, refreshToken as refreshTokenService, logout as logoutService, getProfile } from "@/services/auth";
import { useQueryClient } from "@tanstack/react-query";
import type { AuthUser, LoginForm } from "@/schemas/auth";

/** Estado de autenticação exposto pelo contexto. */
interface AuthContextData {
  /** Usuário autenticado ou `null` se não logado. */
  user: AuthUser | null;
  /** `true` enquanto a sessão está sendo verificada no carregamento inicial. */
  isLoading: boolean;
  /** `true` se o usuário está autenticado. */
  isAuthenticated: boolean;
  /** `true` se o usuário possui a role "admin". */
  isAdmin: boolean;
  /** Realiza login com e-mail e senha. */
  signIn: (dados: LoginForm) => Promise<void>;
  /** Encerra a sessão e limpa todos os dados locais. */
  signOut: () => Promise<void>;
  /** Atualiza os dados do usuário no contexto (ex: após edição de perfil). */
  updateUser: (user: AuthUser) => void;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

/** Props do AuthProvider. */
interface AuthProviderProps {
  children: ReactNode;
}

/**
 * Provider de autenticação que envolve a aplicação.
 *
 * No carregamento inicial, verifica se há refresh token em localStorage
 * e tenta renovar a sessão automaticamente. Configura o callback de falha
 * de autenticação no `apiFetch` para redirecionar ao login.
 *
 * @param children - Componentes filhos a serem envolvidos.
 * @returns Elemento React com o AuthProvider.
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const queryClient = useQueryClient();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  /**
   * Encerra a sessão: revoga tokens no backend, limpa estado local
   * e redireciona ao login.
   */
  const signOut = useCallback(async () => {
    try {
      await logoutService();
    } catch {
      // Ignora erro de logout — limpa localmente de qualquer forma
    }
    clearTokens();
    setUser(null);
    queryClient.clear();
  }, [queryClient]);

  /**
   * Configura o callback de falha de autenticação no apiFetch.
   * Limpa tokens e estado do usuário, forçando o ProtectedRoute
   * a redirecionar ao login via React Router (sem reload da página).
   */
  useEffect(() => {
    setOnAuthFailure(() => {
      clearTokens();
      setUser(null);
      queryClient.clear();
    });

    return () => {
      setOnAuthFailure(null);
    };
  }, [queryClient]);

  /**
   * Inicializa a sessão ao carregar a aplicação.
   * Se há refresh token em localStorage, tenta renová-lo
   * e carrega o perfil do usuário.
   */
  useEffect(() => {
    async function initAuth() {
      const storedRefreshToken = getRefreshToken();

      if (!storedRefreshToken) {
        setIsLoading(false);
        return;
      }

      try {
        const response = await refreshTokenService(storedRefreshToken);
        setAccessToken(response.token);
        setRefreshToken(response.refresh_token);

        const profile = await getProfile();
        setUser(profile);
      } catch {
        clearTokens();
      } finally {
        setIsLoading(false);
      }
    }

    initAuth();
  }, []);

  /**
   * Realiza login com e-mail e senha.
   *
   * @param dados - Credenciais de login (email, password).
   */
  const signIn = useCallback(async (dados: LoginForm) => {
    const response = await loginService(dados);
    setAccessToken(response.token);
    setRefreshToken(response.refresh_token);
    setUser(response.user);
  }, []);

  /**
   * Atualiza os dados do usuário no contexto.
   *
   * @param updatedUser - Dados atualizados do usuário.
   */
  const updateUser = useCallback((updatedUser: AuthUser) => {
    setUser(updatedUser);
  }, []);

  const value = useMemo<AuthContextData>(() => {
    const isAuthenticated = !!user;
    const isAdmin = user?.roles?.some((r) => r.name === "admin") ?? false;

    return {
      user,
      isLoading,
      isAuthenticated,
      isAdmin,
      signIn,
      signOut,
      updateUser,
    };
  }, [user, isLoading, signIn, signOut, updateUser]);

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

/**
 * Hook para acessar o contexto de autenticação.
 *
 * @returns Estado e funções de autenticação.
 * @throws {Error} Se usado fora do AuthProvider.
 */
export function useAuth(): AuthContextData {
  const context = useContext(AuthContext);

  if (!context || Object.keys(context).length === 0) {
    throw new Error("useAuth deve ser usado dentro de um AuthProvider");
  }

  return context;
}
