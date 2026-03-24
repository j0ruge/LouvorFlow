/**
 * Contexto global de autenticação da aplicação.
 *
 * Fornece o estado do usuário autenticado, funções de login/logout,
 * e flags derivadas (isAuthenticated, isAdmin). Gerencia o ciclo de vida
 * dos tokens (access em memória, refresh em localStorage) e a inicialização
 * automática da sessão via refresh token ao carregar a aplicação.
 *
 * Suporta o fluxo multi-tenant: quando o login retorna
 * `requires_tenant_selection: true`, o `signIn` navega para a página de
 * seleção de organização em vez de completar o login imediatamente.
 * A lista de tenants disponíveis é persistida em localStorage para permitir
 * o TenantSwitcher mesmo após reload da página.
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
import { useNavigate } from "react-router-dom";
import { toast } from "sonner";
import {
  setAccessToken,
  setRefreshToken,
  getRefreshToken,
  clearTokens,
  setOnAuthFailure,
} from "@/lib/api";
import { login as loginService, refreshToken as refreshTokenService, logout as logoutService, getProfile, switchTenant as switchTenantService } from "@/services/auth";
import { useQueryClient } from "@tanstack/react-query";
import type { AuthUser, LoginForm, Tenant } from "@/schemas/auth";
import { TenantSchema } from "@/schemas/auth";
import { z } from "zod";

/** Chave utilizada para persistir a lista de tenants do usuário no localStorage. */
const TENANTS_STORAGE_KEY = "louvorflow_user_tenants";

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
  /** `true` se o usuário possui a role "super-admin". */
  isSuperAdmin: boolean;
  /** Tenant (organização) ativo do usuário ou `null` se não definido. */
  currentTenant: Tenant | null;
  /** Lista de todos os tenants disponíveis para o usuário (multi-tenant). */
  availableTenants: Tenant[];
  /**
   * Realiza login com e-mail e senha.
   * No fluxo multi-tenant, navega para `/selecionar-igreja` em vez de
   * completar o login diretamente.
   * @returns `true` se o login completou (single-tenant), `false` se precisa de seleção de tenant.
   */
  signIn: (dados: LoginForm) => Promise<boolean>;
  /** Encerra a sessão e limpa todos os dados locais. */
  signOut: () => Promise<void>;
  /** Atualiza os dados do usuário no contexto (ex: após edição de perfil). */
  updateUser: (user: AuthUser) => void;
  /**
   * Completa o login após seleção de tenant (chamado pela SelectTenantPage).
   *
   * @param user - Dados do usuário retornados após seleção do tenant.
   * @param token - Novo access token.
   * @param refreshTokenValue - Novo refresh token.
   * @param tenants - Lista completa de tenants disponíveis para persistência.
   */
  completeTenantLogin: (user: AuthUser, token: string, refreshTokenValue: string, tenants?: Tenant[]) => void;
  /**
   * Troca o tenant ativo sem necessidade de re-login.
   *
   * Chama `POST /api/sessions/switch-tenant`, atualiza tokens e estado do
   * usuário, e invalida o cache do React Query para forçar novo fetch
   * de dados do tenant selecionado.
   *
   * @param tenantId - UUID do tenant para o qual alternar.
   */
  switchTenant: (tenantId: string) => Promise<void>;
}

const AuthContext = createContext<AuthContextData>({} as AuthContextData);

/** Props do AuthProvider. */
interface AuthProviderProps {
  /** Componentes filhos a serem envolvidos. */
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
  const navigate = useNavigate();
  const [user, setUser] = useState<AuthUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [currentTenant, setCurrentTenant] = useState<Tenant | null>(null);
  const [availableTenants, setAvailableTenants] = useState<Tenant[]>(() => {
    try {
      const stored = localStorage.getItem(TENANTS_STORAGE_KEY);
      if (!stored) return [];
      const parsed = z.array(TenantSchema).safeParse(JSON.parse(stored));
      return parsed.success ? parsed.data : [];
    } catch {
      return [];
    }
  });

  /**
   * Persiste a lista de tenants disponíveis no localStorage e no estado.
   *
   * @param tenants - Lista de tenants a armazenar.
   */
  const persistAvailableTenants = useCallback((tenants: Tenant[]) => {
    setAvailableTenants(tenants);
    try {
      localStorage.setItem(TENANTS_STORAGE_KEY, JSON.stringify(tenants));
    } catch {
      // Ignora falha de localStorage (ex: modo privado com storage cheio)
    }
  }, []);

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
    localStorage.removeItem(TENANTS_STORAGE_KEY);
    setUser(null);
    setCurrentTenant(null);
    setAvailableTenants([]);
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
      localStorage.removeItem(TENANTS_STORAGE_KEY);
      setUser(null);
      setCurrentTenant(null);
      setAvailableTenants([]);
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
        setCurrentTenant(profile.tenant ?? null);
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
   * Se o backend retornar `requires_tenant_selection: true`, navega para
   * `/selecionar-igreja` passando os tenants disponíveis e o token de seleção
   * via `location.state`. Caso contrário, completa o login normalmente
   * armazenando tokens e dados do usuário.
   *
   * @param dados - Credenciais de login (email, password).
   */
  const signIn = useCallback(async (dados: LoginForm): Promise<boolean> => {
    const response = await loginService(dados);

    if ('requires_tenant_selection' in response && response.requires_tenant_selection) {
      persistAvailableTenants(response.tenants);
      /** Persiste o selection_token em sessionStorage para sobreviver a recarregamentos (F5). */
      sessionStorage.setItem('selection_token', response.selection_token);
      navigate("/selecionar-igreja", {
        state: {
          tenants: response.tenants,
          selection_token: response.selection_token,
        },
      });
      /** Retorna false para sinalizar que o login ainda não completou (precisa selecionar tenant). */
      return false;
    }

    /** Após excluir o fluxo de seleção de tenant, o response é do tipo single-tenant. */
    const loginResult = response as { user: AuthUser; token: string; refresh_token: string };
    setAccessToken(loginResult.token);
    setRefreshToken(loginResult.refresh_token);
    setUser(loginResult.user);
    setCurrentTenant(loginResult.user.tenant ?? null);
    if (loginResult.user.tenant) {
      persistAvailableTenants([loginResult.user.tenant]);
      toast.success(`Bem-vindo à ${loginResult.user.tenant.name}`);
    }
    return true;
  }, [navigate, persistAvailableTenants]);

  /**
   * Completa o login após o usuário selecionar seu tenant na página de seleção.
   *
   * Chamado pela `SelectTenantPage` após receber a resposta bem-sucedida de
   * `POST /api/sessions/select-tenant`. A lista de tenants passada aqui
   * é persistida para uso futuro pelo TenantSwitcher.
   *
   * @param selectedUser - Dados do usuário autenticado com o tenant selecionado.
   * @param token - Access token para o tenant selecionado.
   * @param refreshTokenValue - Refresh token para o tenant selecionado.
   * @param tenants - Lista completa de tenants disponíveis (opcional).
   */
  const completeTenantLogin = useCallback(
    (selectedUser: AuthUser, token: string, refreshTokenValue: string, tenants?: Tenant[]) => {
      setAccessToken(token);
      setRefreshToken(refreshTokenValue);
      setUser(selectedUser);
      setCurrentTenant(selectedUser.tenant ?? null);
      if (selectedUser.tenant) {
        toast.success(`Bem-vindo à ${selectedUser.tenant.name}`);
      }
      if (tenants && tenants.length > 0) {
        persistAvailableTenants(tenants);
      }
    },
    [persistAvailableTenants],
  );

  /**
   * Troca o tenant ativo da sessão sem necessidade de re-login.
   *
   * Chama `POST /api/sessions/switch-tenant`, atualiza os tokens de acesso
   * em memória e refresh no localStorage, atualiza o estado do usuário e
   * invalida o cache do React Query para que as queries sejam refeitas
   * com o contexto do novo tenant.
   *
   * @param tenantId - UUID do tenant para o qual alternar.
   */
  const switchTenant = useCallback(async (tenantId: string) => {
    try {
      const response = await switchTenantService(tenantId);
      setAccessToken(response.token);
      setRefreshToken(response.refresh_token);
      setUser(response.user);
      setCurrentTenant(response.user.tenant ?? null);
      queryClient.invalidateQueries();
    } catch (err) {
      /** Exibe toast de erro ao falhar na troca de tenant. */
      toast.error(
        err instanceof Error ? err.message : "Erro ao trocar de organização.",
      );
      throw err;
    }
  }, [queryClient]);

  /**
   * Atualiza os dados do usuário no contexto.
   *
   * @param updatedUser - Dados atualizados do usuário.
   */
  const updateUser = useCallback((updatedUser: AuthUser) => {
    setUser(updatedUser);
    setCurrentTenant(updatedUser.tenant ?? null);
  }, []);

  const value = useMemo<AuthContextData>(() => {
    const isAuthenticated = !!user;
    const isAdmin = user?.roles?.some((r) => r.name === "admin") ?? false;
    const isSuperAdmin = user?.roles?.some((r) => r.name === "super-admin") ?? false;

    return {
      user,
      isLoading,
      isAuthenticated,
      isAdmin,
      isSuperAdmin,
      currentTenant,
      availableTenants,
      signIn,
      signOut,
      updateUser,
      completeTenantLogin,
      switchTenant,
    };
  }, [user, isLoading, currentTenant, availableTenants, signIn, signOut, updateUser, completeTenantLogin, switchTenant]);

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
