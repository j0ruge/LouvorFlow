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
  SingleTenantLoginResponseSchema,
} from "@/schemas/auth";
import type {
  LoginForm,
  LoginResponse,
  RefreshTokenResponse,
  AuthUser,
  UpdateProfileForm,
  ForgotPasswordForm,
  ResetPasswordForm,
  SingleTenantLoginResponse,
} from "@/schemas/auth";

/**
 * Realiza o login do usuário criando uma nova sessão.
 *
 * @param dados - Credenciais do formulário de login (email e senha).
 * @returns Resposta contendo token de acesso, refresh token e dados do usuário.
 */
export async function login(dados: LoginForm) {
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
 * Seleciona um tenant (organização) após o login multi-tenant.
 *
 * Chamado quando a resposta de login retorna `requires_tenant_selection: true`.
 * Envia o token de seleção temporário e o tenant escolhido para completar
 * a autenticação, retornando os tokens de acesso e dados do usuário.
 *
 * @param selectionToken - Token temporário recebido na resposta de login multi-tenant.
 * @param tenantId - UUID do tenant selecionado pelo usuário.
 * @returns Resposta de login completa com token de acesso e dados do usuário.
 */
export async function selectTenant(
  selectionToken: string,
  tenantId: string,
) {
  const data = await apiFetch<unknown>("/sessions/select-tenant", {
    method: "POST",
    body: JSON.stringify({ selection_token: selectionToken, tenant_id: tenantId }),
  });
  return SingleTenantLoginResponseSchema.parse(data);
}

/**
 * Troca o tenant ativo do usuário autenticado (Phase 7 — switch de organização).
 *
 * Permite que um usuário membro de múltiplas igrejas alterne entre elas
 * sem precisar fazer logout. Retorna novos tokens para o tenant selecionado.
 *
 * @param tenantId - UUID do tenant para o qual deseja alternar.
 * @returns Resposta de login completa com novos tokens e dados do usuário.
 */
export async function switchTenant(tenantId: string) {
  const data = await apiFetch<unknown>("/sessions/switch-tenant", {
    method: "POST",
    body: JSON.stringify({ tenant_id: tenantId }),
  });
  return SingleTenantLoginResponseSchema.parse(data);
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
