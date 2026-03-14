/**
 * Serviço de autenticação — chamadas à API REST.
 *
 * Funções para login, refresh de token, logout, perfil do usuário
 * e recuperação de senha, com parsing Zod para garantir conformidade
 * com o contrato.
 */

import { apiFetch, ApiError, API_BASE_URL } from "@/lib/api";
import {
  LoginResponseSchema,
  RefreshTokenResponseSchema,
  AuthUserSchema,
} from "@/schemas/auth";
import type {
  LoginForm,
  LoginResponse,
  RefreshTokenResponse,
  AuthUser,
  UpdateProfileForm,
  ForgotPasswordForm,
  ResetPasswordForm,
} from "@/schemas/auth";

/**
 * Realiza o login do usuário criando uma nova sessão.
 *
 * @param dados - Credenciais do formulário de login (email e senha).
 * @returns Resposta contendo token de acesso, refresh token e dados do usuário.
 */
export async function login(dados: LoginForm): Promise<LoginResponse> {
  const data = await apiFetch<unknown>("/sessions", {
    method: "POST",
    body: JSON.stringify(dados),
  });
  return LoginResponseSchema.parse(data);
}

/**
 * Renova o token de acesso utilizando um refresh token válido.
 *
 * Usa `fetch` direto (sem `apiFetch`) para evitar que o interceptor
 * de 401 tente renovar o token recursivamente durante a inicialização.
 *
 * @param token - Refresh token obtido no login ou em renovação anterior.
 * @returns Resposta contendo novo token de acesso e novo refresh token.
 */
export async function refreshToken(
  token: string,
): Promise<RefreshTokenResponse> {
  const response = await fetch(`${API_BASE_URL}/sessions/refresh-token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ token }),
  });

  if (!response.ok) {
    let errorMessage = "Não foi possível renovar a sessão.";
    try {
      const body = await response.json();
      if (body.erro) errorMessage = body.erro;
    } catch {
      // Resposta sem corpo JSON — usa mensagem genérica
    }
    throw new ApiError(errorMessage, response.status);
  }

  const data = await response.json();
  return RefreshTokenResponseSchema.parse(data);
}

/**
 * Encerra a sessão do usuário autenticado (logout).
 *
 * @remarks O endpoint retorna 204 (sem corpo). A função `apiFetch` deve
 * suportar respostas sem corpo (tratamento adicionado em T004).
 */
export async function logout(): Promise<void> {
  await apiFetch<void>("/sessions/logout", {
    method: "POST",
  });
}

/**
 * Busca os dados do perfil do usuário autenticado.
 *
 * @returns Dados do usuário autenticado parseados pelo schema Zod.
 */
export async function getProfile(): Promise<AuthUser> {
  const data = await apiFetch<unknown>("/profile");
  return AuthUserSchema.parse(data);
}

/**
 * Atualiza os dados do perfil do usuário autenticado.
 *
 * @param dados - Dados do formulário de atualização de perfil.
 * @returns Dados atualizados do usuário parseados pelo schema Zod.
 */
export async function updateProfile(dados: UpdateProfileForm): Promise<AuthUser> {
  const data = await apiFetch<unknown>("/profile", {
    method: "PUT",
    body: JSON.stringify(dados),
  });
  return AuthUserSchema.parse(data);
}

/**
 * Solicita o envio de e-mail para recuperação de senha.
 *
 * @param dados - Dados do formulário contendo o e-mail do usuário.
 * @remarks O endpoint retorna 204 (sem corpo). A função `apiFetch` deve
 * suportar respostas sem corpo (tratamento adicionado em T004).
 */
export async function forgotPassword(dados: ForgotPasswordForm): Promise<void> {
  await apiFetch<void>("/password/forgot", {
    method: "POST",
    body: JSON.stringify(dados),
  });
}

/**
 * Redefine a senha do usuário utilizando o token de recuperação.
 *
 * @param dados - Dados do formulário contendo token e nova senha.
 * @remarks O endpoint retorna 204 (sem corpo). A função `apiFetch` deve
 * suportar respostas sem corpo (tratamento adicionado em T004).
 */
export async function resetPassword(dados: ResetPasswordForm): Promise<void> {
  await apiFetch<void>("/password/reset", {
    method: "POST",
    body: JSON.stringify(dados),
  });
}
