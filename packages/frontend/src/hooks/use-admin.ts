/**
 * Hooks React Query para o módulo de administração (RBAC).
 *
 * Encapsula listagem e criação de usuários, roles e permissões com
 * `useQuery` e `useMutation`, incluindo gerenciamento de ACL,
 * invalidação de cache e feedback via toast.
 */

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  listUsers,
  createUser,
  getUserAcl,
  setUserAcl,
  listRoles,
  createRole,
  setRolePermissions,
  listPermissions,
  createPermission,
} from "@/services/admin";
import type {
  CreateUserForm,
  UserAclForm,
  CreateRoleForm,
  RolePermissionsForm,
  CreatePermissionForm,
} from "@/schemas/auth";

/**
 * Hook para buscar a lista de todos os usuários cadastrados.
 *
 * @returns Resultado do useQuery com a lista de usuários.
 */
export function useUsers() {
  return useQuery({
    queryKey: ["admin", "users"],
    queryFn: listUsers,
  });
}

/**
 * Hook para criar um novo usuário via mutation.
 *
 * Invalida a query de listagem de usuários e exibe toast de sucesso/erro.
 *
 * @returns Resultado do useMutation para criação de usuário.
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dados: CreateUserForm) => createUser(dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      toast.success("Usuário criado com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook para buscar a ACL (roles e permissões) de um usuário específico.
 *
 * @param userId - UUID do usuário ou `null` para desabilitar a query.
 * @returns Resultado do useQuery com a ACL do usuário.
 */
export function useUserAcl(userId: string | null) {
  return useQuery({
    queryKey: ["admin", "users", userId, "acl"],
    queryFn: () => getUserAcl(userId!),
    enabled: !!userId,
  });
}

/**
 * Hook para definir a ACL de um usuário via mutation.
 *
 * Invalida as queries de listagem de usuários e ACL do usuário,
 * e exibe toast de sucesso/erro.
 *
 * @returns Resultado do useMutation para definição de ACL.
 */
export function useSetUserAcl() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ userId, dados }: { userId: string; dados: UserAclForm }) =>
      setUserAcl(userId, dados),
    onSuccess: (_data, { userId }) => {
      queryClient.invalidateQueries({ queryKey: ["admin", "users"] });
      queryClient.invalidateQueries({ queryKey: ["admin", "users", userId, "acl"] });
      toast.success("ACL do usuário atualizada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook para buscar a lista de todas as roles cadastradas.
 *
 * @returns Resultado do useQuery com a lista de roles.
 */
export function useRoles() {
  return useQuery({
    queryKey: ["admin", "roles"],
    queryFn: listRoles,
  });
}

/**
 * Hook para criar uma nova role via mutation.
 *
 * Invalida a query de listagem de roles e exibe toast de sucesso/erro.
 *
 * @returns Resultado do useMutation para criação de role.
 */
export function useCreateRole() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dados: CreateRoleForm) => createRole(dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
      toast.success("Role criada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook para definir as permissões de uma role via mutation.
 *
 * Invalida as queries de listagem de roles e exibe toast de sucesso/erro.
 *
 * @returns Resultado do useMutation para definição de permissões de role.
 */
export function useSetRolePermissions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ roleId, dados }: { roleId: string; dados: RolePermissionsForm }) =>
      setRolePermissions(roleId, dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "roles"] });
      toast.success("Permissões da role atualizadas com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}

/**
 * Hook para buscar a lista de todas as permissões cadastradas.
 *
 * @returns Resultado do useQuery com a lista de permissões.
 */
export function usePermissions() {
  return useQuery({
    queryKey: ["admin", "permissions"],
    queryFn: listPermissions,
  });
}

/**
 * Hook para criar uma nova permissão via mutation.
 *
 * Invalida a query de listagem de permissões e exibe toast de sucesso/erro.
 *
 * @returns Resultado do useMutation para criação de permissão.
 */
export function useCreatePermission() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (dados: CreatePermissionForm) => createPermission(dados),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin", "permissions"] });
      toast.success("Permissão criada com sucesso!");
    },
    onError: (error: Error) => {
      toast.error(error.message);
    },
  });
}
