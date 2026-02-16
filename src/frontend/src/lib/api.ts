/**
 * Cliente HTTP genérico para comunicação com a API REST do backend.
 *
 * Exporta a classe `ApiError` para erros HTTP e a função `apiFetch<T>()`
 * que encapsula o Fetch API com serialização JSON, extração de mensagens
 * de erro do formato `{ erro, codigo }` e fallback para erros de rede.
 */

/** URL base da API, configurável via variável de ambiente Vite. */
const API_BASE_URL =
  import.meta.env.VITE_API_BASE_URL ?? "http://localhost:3000/api";

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

/**
 * Realiza uma requisição HTTP à API e retorna o corpo parseado como JSON.
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
  let response: Response;

  try {
    response = await fetch(`${API_BASE_URL}${path}`, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        ...options?.headers,
      },
    });
  } catch {
    throw new Error("Erro de conexão com o servidor. Verifique sua rede.");
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

  return response.json() as Promise<T>;
}
