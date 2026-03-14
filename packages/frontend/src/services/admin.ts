/**
 * Serviço de administração — chamadas à API REST para CRUD de usuários, roles e permissões.
 *
 * Funções para listar, criar e gerenciar usuários, roles, permissões e ACLs,
 * com parsing Zod para garantir conformidade com o contrato.
 */

import { z } from "zod";
import { apiFetch } from "@/lib/api";
import {
  AuthUserSchema,
  UserAclSchema,
  RoleSchema,
  PermissionSchema,
} from "@/schemas/auth";
import type {
  AuthUser,
  UserAcl,
  Role,
  Permission,
  CreateUserForm,
  UserAclForm,
  CreateRoleForm,
  RolePermissionsForm,
  CreatePermissionForm,
} from "@/schemas/auth";

/* ========== Usuários ========== */

/**
 * Busca todos os usuários cadastrados.
 *
 * @returns Lista de usuários parseados pelo schema Zod.
 */
export async function listUsers(): Promise<AuthUser[]> {
  const response = await apiFetch<{ data: unknown[] }>("/users");
  return z.array(AuthUserSchema).parse(response.data);
}

/**
 * Cria um novo usuário.
 *
 * @param dados - Dados do formulário de criação de usuário.
 * @returns Usuário criado, parseado pelo schema Zod.
 */
export async function createUser(dados: CreateUserForm): Promise<AuthUser> {
  const data = await apiFetch<unknown>("/users", {
    method: "POST",
    body: JSON.stringify(dados),
  });
  return AuthUserSchema.parse(data);
}

/**
 * Busca a ACL (roles e permissões) de um usuário específico.
 *
 * @param userId - UUID do usuário.
 * @returns ACL do usuário parseada pelo schema Zod.
 */
export async function getUserAcl(userId: string): Promise<UserAcl> {
  const data = await apiFetch<unknown>(`/users/acl/${userId}`);
  return UserAclSchema.parse(data);
}

/**
 * Define a ACL (roles e permissões) de um usuário.
 *
 * @param userId - UUID do usuário.
 * @param dados - Dados do formulário de ACL do usuário.
 * @returns Usuário atualizado, parseado pelo schema Zod.
 */
export async function setUserAcl(
  userId: string,
  dados: UserAclForm,
): Promise<AuthUser> {
  const data = await apiFetch<unknown>(`/users/acl/${userId}`, {
    method: "POST",
    body: JSON.stringify(dados),
  });
  return AuthUserSchema.parse(data);
}

/* ========== Roles ========== */

/**
 * Busca todas as roles cadastradas.
 *
 * @returns Lista de roles parseadas pelo schema Zod.
 */
export async function listRoles(): Promise<Role[]> {
  const response = await apiFetch<{ data: unknown[] }>("/roles");
  return z.array(RoleSchema).parse(response.data);
}

/**
 * Cria uma nova role.
 *
 * @param dados - Dados do formulário de criação de role.
 * @returns Role criada, parseada pelo schema Zod.
 */
export async function createRole(dados: CreateRoleForm): Promise<Role> {
  const data = await apiFetch<unknown>("/roles", {
    method: "POST",
    body: JSON.stringify(dados),
  });
  return RoleSchema.parse(data);
}

/**
 * Define as permissões de uma role.
 *
 * @param roleId - UUID da role.
 * @param dados - Dados do formulário com as permissões a associar.
 * @returns Role atualizada, parseada pelo schema Zod.
 */
export async function setRolePermissions(
  roleId: string,
  dados: RolePermissionsForm,
): Promise<Role> {
  const data = await apiFetch<unknown>(`/roles/${roleId}/permissions`, {
    method: "POST",
    body: JSON.stringify(dados),
  });
  return RoleSchema.parse(data);
}

/* ========== Permissões ========== */

/**
 * Busca todas as permissões cadastradas.
 *
 * @returns Lista de permissões parseadas pelo schema Zod.
 */
export async function listPermissions(): Promise<Permission[]> {
  const response = await apiFetch<{ data: unknown[] }>("/permissions");
  return z.array(PermissionSchema).parse(response.data);
}

/**
 * Cria uma nova permissão.
 *
 * @param dados - Dados do formulário de criação de permissão.
 * @returns Permissão criada, parseada pelo schema Zod.
 */
export async function createPermission(
  dados: CreatePermissionForm,
): Promise<Permission> {
  const data = await apiFetch<unknown>("/permissions", {
    method: "POST",
    body: JSON.stringify(dados),
  });
  return PermissionSchema.parse(data);
}
