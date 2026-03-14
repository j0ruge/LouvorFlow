/**
 * Schemas Zod para o módulo de autenticação e RBAC.
 *
 * Define os formatos de resposta da API (login, refresh token, ACL)
 * e os schemas de validação dos formulários de auth.
 */

import { z } from "zod";

// ─── Entidades de resposta ─────────────────────────────────────────────────

/** Schema de uma permissão retornada pela API. */
export const PermissionSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  created_at: z.string(),
  updated_at: z.string(),
});

/** Tipo inferido de uma permissão. */
export type Permission = z.infer<typeof PermissionSchema>;

/** Schema de um papel (role) retornado pela API. */
export const RoleSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  description: z.string(),
  permissions: z.array(PermissionSchema),
  created_at: z.string(),
  updated_at: z.string(),
});

/** Tipo inferido de um papel. */
export type Role = z.infer<typeof RoleSchema>;

/** Schema do usuário autenticado retornado pelo login. */
export const AuthUserSchema = z.object({
  id: z.string().uuid(),
  name: z.string(),
  email: z.string().email(),
  avatar: z.string().nullable(),
  avatar_url: z.string().nullable(),
  roles: z.array(RoleSchema),
  permissions: z.array(PermissionSchema),
  created_at: z.string(),
  updated_at: z.string(),
});

/** Tipo inferido do usuário autenticado. */
export type AuthUser = z.infer<typeof AuthUserSchema>;

/** Schema da resposta de login (POST /api/sessions). */
export const LoginResponseSchema = z.object({
  user: AuthUserSchema,
  token: z.string(),
  refresh_token: z.string(),
});

/** Tipo inferido da resposta de login. */
export type LoginResponse = z.infer<typeof LoginResponseSchema>;

/** Schema da resposta de refresh token (POST /api/sessions/refresh-token). */
export const RefreshTokenResponseSchema = z.object({
  token: z.string(),
  refresh_token: z.string(),
});

/** Tipo inferido da resposta de refresh token. */
export type RefreshTokenResponse = z.infer<typeof RefreshTokenResponseSchema>;

/** Schema da ACL (Access Control List) de um usuário. */
export const UserAclSchema = z.object({
  userId: z.string().uuid(),
  name: z.string(),
  roles: z.array(RoleSchema),
  permissions: z.array(PermissionSchema),
});

/** Tipo inferido da ACL de um usuário. */
export type UserAcl = z.infer<typeof UserAclSchema>;

// ─── Formulários ───────────────────────────────────────────────────────────

/** Schema de validação do formulário de login. */
export const LoginFormSchema = z.object({
  email: z.string().min(1, "Email é obrigatório").email("Email deve ter um formato válido"),
  password: z.string().min(1, "Senha é obrigatória"),
});

/** Tipo inferido dos dados do formulário de login. */
export type LoginForm = z.infer<typeof LoginFormSchema>;

/** Schema de validação do formulário de atualização de perfil. */
export const UpdateProfileFormSchema = z
  .object({
    name: z.string().min(1, "Nome não pode ser vazio").optional(),
    email: z.string().email("Email deve ter um formato válido").optional(),
    old_password: z.string().optional(),
    password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres").optional(),
  })
  .refine(
    (data) => {
      if (data.password && !data.old_password) return false;
      if (data.old_password && !data.password) return false;
      return true;
    },
    {
      message: "Para alterar a senha, preencha a senha atual e a nova senha",
      path: ["old_password"],
    },
  );

/** Tipo inferido dos dados do formulário de atualização de perfil. */
export type UpdateProfileForm = z.infer<typeof UpdateProfileFormSchema>;

/** Schema de validação do formulário de recuperação de senha. */
export const ForgotPasswordFormSchema = z.object({
  email: z.string().min(1, "Email é obrigatório").email("Email deve ter um formato válido"),
});

/** Tipo inferido dos dados do formulário de recuperação de senha. */
export type ForgotPasswordForm = z.infer<typeof ForgotPasswordFormSchema>;

/** Schema de validação do formulário de redefinição de senha. */
export const ResetPasswordFormSchema = z
  .object({
    token: z.string().uuid("Token deve ser um UUID válido"),
    password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
    password_confirmation: z.string().min(1, "Confirmação de senha é obrigatória"),
  })
  .refine((data) => data.password === data.password_confirmation, {
    message: "Confirmação de senha não coincide",
    path: ["password_confirmation"],
  });

/** Tipo inferido dos dados do formulário de redefinição de senha. */
export type ResetPasswordForm = z.infer<typeof ResetPasswordFormSchema>;

/** Schema de validação do formulário de criação de usuário. */
export const CreateUserFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  email: z.string().min(1, "Email é obrigatório").email("Email deve ter um formato válido"),
  password: z.string().min(6, "Senha deve ter no mínimo 6 caracteres"),
});

/** Tipo inferido dos dados do formulário de criação de usuário. */
export type CreateUserForm = z.infer<typeof CreateUserFormSchema>;

/** Schema de validação do formulário de criação de papel (role). */
export const CreateRoleFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
});

/** Tipo inferido dos dados do formulário de criação de papel. */
export type CreateRoleForm = z.infer<typeof CreateRoleFormSchema>;

/** Schema de validação do formulário de criação de permissão. */
export const CreatePermissionFormSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
});

/** Tipo inferido dos dados do formulário de criação de permissão. */
export type CreatePermissionForm = z.infer<typeof CreatePermissionFormSchema>;

/** Schema de validação do formulário de associação de ACL a um usuário. */
export const UserAclFormSchema = z.object({
  roles: z.array(z.string().uuid()),
  permissions: z.array(z.string().uuid()),
});

/** Tipo inferido dos dados do formulário de ACL de usuário. */
export type UserAclForm = z.infer<typeof UserAclFormSchema>;

/** Schema de validação do formulário de associação de permissões a um papel. */
export const RolePermissionsFormSchema = z.object({
  permissions: z
    .array(z.string().uuid())
    .min(1, "Pelo menos uma permissão deve ser informada"),
});

/** Tipo inferido dos dados do formulário de permissões de papel. */
export type RolePermissionsForm = z.infer<typeof RolePermissionsFormSchema>;
