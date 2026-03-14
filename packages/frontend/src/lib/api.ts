/**
 * Cliente HTTP genérico para comunicação com a API REST do backend.
 *
 * Exporta a classe `ApiError` para erros HTTP e a função `apiFetch<T>()`
 * que encapsula o Fetch API com serialização JSON, extração de mensagens
 * de erro do formato `{ erro, codigo }` e fallback para erros de rede.
 *
 * Inclui interceptor de Authorization header e renovação automática
 * de access token via refresh token (padrão singleton promise).
 */

/**
 * URL base da API, configurável via variável de ambiente Vite.
 *
 * Em desenvolvimento, o proxy do Vite encaminha `/api` para o backend.
 * Em produção, defina `VITE_API_BASE_URL` ou sirva o frontend atrás de um
 * reverse proxy que roteia `/api` ao backend — caso contrário, as
 * requisições retornarão 404.
 */
export const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "/api";

/**
 * Erro HTTP retornado pela API.
 *
 * @param message - Mensagem de erro extraída do campo `erro` da resposta.
 * @param status - Código HTTP da resposta.
 */
export class ApiError extends Error {
  constructor(
    message: string,
    public readonly status: number,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

// ─── Token management ────────────────────────────────────────────────────────

/** Access token em memória (nunca persiste em localStorage). */
let accessToken: string | null = null;

/** Chave do refresh token em localStorage. */
const REFRESH_TOKEN_KEY = "louvorflow_refresh_token";

/** Promise singleton para evitar race conditions durante token refresh. */
let refreshPromise: Promise<string | null> | null = null;

/**
 * Define o access token em memória.
 *
 * @param token - JWT de acesso ou `null` para limpar.
 */
export function setAccessToken(token: string | null): void {
  accessToken = token;
}

/**
 * Retorna o access token atual em memória.
 *
 * @returns Access token ou `null` se não autenticado.
 */
export function getAccessToken(): string | null {
  return accessToken;
}

/**
 * Salva o refresh token em localStorage.
 *
 * @param token - JWT de refresh ou `null` para limpar.
 */
export function setRefreshToken(token: string | null): void {
  if (token) {
    localStorage.setItem(REFRESH_TOKEN_KEY, token);
  } else {
    localStorage.removeItem(REFRESH_TOKEN_KEY);
  }
}

/**
 * Retorna o refresh token salvo em localStorage.
 *
 * @returns Refresh token ou `null` se não disponível.
 */
export function getRefreshToken(): string | null {
  return localStorage.getItem(REFRESH_TOKEN_KEY);
}

/**
 * Limpa todos os tokens (access + refresh).
 * Usado durante logout ou quando o refresh token é inválido.
 */
export function clearTokens(): void {
  accessToken = null;
  localStorage.removeItem(REFRESH_TOKEN_KEY);
}

/**
 * Callback chamado quando a autenticação falha definitivamente
 * (refresh token expirado/revogado). Deve ser configurado pelo AuthContext
 * para redirecionar ao login.
 */
let onAuthFailure: (() => void) | null = null;

/**
 * Registra o callback de falha de autenticação.
 *
 * @param callback - Função a ser chamada quando o refresh falhar.
 */
export function setOnAuthFailure(callback: (() => void) | null): void {
  onAuthFailure = callback;
}

/**
 * Tenta renovar o access token usando o refresh token.
 * Usa padrão singleton promise para serializar requisições concorrentes.
 *
 * @returns Novo access token ou `null` se falhou.
 */
async function tryRefreshToken(): Promise<string | null> {
  if (refreshPromise) {
    return refreshPromise;
  }

  const currentRefreshToken = getRefreshToken();
  if (!currentRefreshToken) {
    return null;
  }

  refreshPromise = (async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/sessions/refresh-token`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: currentRefreshToken }),
      });

      if (!response.ok) {
        clearTokens();
        return null;
      }

      const data = await response.json();
      setAccessToken(data.token);
      setRefreshToken(data.refresh_token);
      return data.token as string;
    } catch {
      clearTokens();
      return null;
    } finally {
      refreshPromise = null;
    }
  })();

  return refreshPromise;
}

// ─── apiFetch ────────────────────────────────────────────────────────────────

/**
 * Realiza uma requisição HTTP à API e retorna o corpo parseado como JSON.
 *
 * Injeta automaticamente o header `Authorization: Bearer <token>` quando
 * o usuário está autenticado. Em caso de resposta 401, tenta renovar o
 * access token via refresh token e retransmite a requisição original.
 *
 * @typeParam T - Tipo esperado da resposta.
 * @param path - Caminho relativo ao `API_BASE_URL` (ex.: `/integrantes`).
 * @param options - Opções adicionais do Fetch (method, body, headers, etc.).
 * @returns Promessa resolvida com o corpo da resposta tipado como `T`.
 * @throws {ApiError} Quando a resposta HTTP indica erro (status >= 400).
 * @throws {Error} Quando ocorre falha de rede ou erro inesperado.
 */
export async function apiFetch<T>(
  path: string,
  options?: RequestInit,
): Promise<T> {
  const doFetch = async (token: string | null): Promise<Response> => {
    const isFormData = options?.body instanceof FormData;
    const headers: HeadersInit = {
      ...(isFormData ? {} : { "Content-Type": "application/json" }),
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...options?.headers,
    };

    return fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers,
    });
  };

  let response: Response;

  try {
    response = await doFetch(accessToken);
  } catch {
    throw new Error("Não foi possível conectar ao servidor. Verifique sua rede.");
  }

  if (response.status === 401 && accessToken) {
    const newToken = await tryRefreshToken();
    if (newToken) {
      try {
        response = await doFetch(newToken);
      } catch {
        throw new Error("Não foi possível conectar ao servidor. Verifique sua rede.");
      }
    } else {
      onAuthFailure?.();
      throw new ApiError("Sessão expirada. Faça login novamente.", 401);
    }
  }

  if (!response.ok) {
    let errorMessage = "Ocorreu um erro inesperado. Tente novamente.";

    try {
      const body = await response.json();
      if (body.erro) {
        errorMessage = body.erro;
      }
    } catch {
      // Resposta sem corpo JSON — usa mensagem genérica
    }

    throw new ApiError(errorMessage, response.status);
  }

  if (response.status === 204) {
    return undefined as unknown as T;
  }

  return response.json() as Promise<T>;
}
