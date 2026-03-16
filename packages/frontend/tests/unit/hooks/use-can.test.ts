/**
 * Testes unitários para as funções puras de verificação de permissões.
 *
 * Cobre `computeEffectivePermissions` e `checkPermission` — a lógica
 * pura de cálculo de permissões efetivas e verificação de acesso.
 * Os hooks (`useCan`, `useEffectivePermissions`) delegam a essas funções.
 */

import { describe, it, expect } from "vitest";
import { computeEffectivePermissions, checkPermission } from "@/hooks/use-can";
import type { AuthUser } from "@/schemas/auth";

/** Permissão auxiliar para construção de dados de teste. */
const perm = (name: string) => ({
  id: `perm-${name}`,
  name,
  description: `Permissão ${name}`,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
});

/** Role auxiliar para construção de dados de teste. */
const role = (name: string, permissions: ReturnType<typeof perm>[]) => ({
  id: `role-${name}`,
  name,
  description: `Role ${name}`,
  permissions,
  created_at: "2026-01-01T00:00:00Z",
  updated_at: "2026-01-01T00:00:00Z",
});

/** Cria um AuthUser de teste com roles e permissões especificadas. */
function makeUser(
  roles: ReturnType<typeof role>[] = [],
  directPermissions: ReturnType<typeof perm>[] = [],
): AuthUser {
  return {
    id: "user-uuid",
    name: "Teste",
    email: "teste@test.com",
    avatar: null,
    avatar_url: null,
    roles,
    permissions: directPermissions,
    created_at: "2026-01-01T00:00:00Z",
    updated_at: "2026-01-01T00:00:00Z",
  };
}

describe("computeEffectivePermissions", () => {
  /** Retorna Set vazio quando user é null. */
  it("retorna Set vazio para user null", () => {
    const result = computeEffectivePermissions(null);
    expect(result.size).toBe(0);
  });

  /** Retorna Set vazio para usuário sem roles nem permissões. */
  it("retorna Set vazio para usuário sem permissões", () => {
    const user = makeUser();
    const result = computeEffectivePermissions(user);
    expect(result.size).toBe(0);
  });

  /** Extrai permissões de roles corretamente. */
  it("extrai permissões herdadas via roles", () => {
    const user = makeUser([
      role("lider", [perm("musicas.write"), perm("escalas.write")]),
    ]);
    const result = computeEffectivePermissions(user);
    expect(result.has("musicas.write")).toBe(true);
    expect(result.has("escalas.write")).toBe(true);
    expect(result.size).toBe(2);
  });

  /** Extrai permissões diretas corretamente. */
  it("extrai permissões diretas do usuário", () => {
    const user = makeUser([], [perm("configuracoes.write")]);
    const result = computeEffectivePermissions(user);
    expect(result.has("configuracoes.write")).toBe(true);
    expect(result.size).toBe(1);
  });

  /** Combina permissões diretas e de roles sem duplicatas. */
  it("combina diretas e de roles, desduplicando", () => {
    const user = makeUser(
      [role("lider", [perm("musicas.write")])],
      [perm("musicas.write"), perm("integrantes.write")],
    );
    const result = computeEffectivePermissions(user);
    expect(result.has("musicas.write")).toBe(true);
    expect(result.has("integrantes.write")).toBe(true);
    expect(result.size).toBe(2);
  });

  /** Combina permissões de múltiplas roles. */
  it("combina permissões de múltiplas roles", () => {
    const user = makeUser([
      role("lider", [perm("musicas.write")]),
      role("admin", [perm("admin_full_access")]),
    ]);
    const result = computeEffectivePermissions(user);
    expect(result.has("musicas.write")).toBe(true);
    expect(result.has("admin_full_access")).toBe(true);
    expect(result.size).toBe(2);
  });
});

describe("checkPermission", () => {
  /** Admin com admin_full_access tem acesso a qualquer permissão. */
  it("retorna true para admin independente da permissão", () => {
    const perms = new Set(["admin_full_access"]);
    expect(checkPermission(perms, "musicas.write")).toBe(true);
    expect(checkPermission(perms, "qualquer.coisa")).toBe(true);
  });

  /** Usuário com a permissão específica tem acesso. */
  it("retorna true quando permissão está presente", () => {
    const perms = new Set(["musicas.write", "escalas.write"]);
    expect(checkPermission(perms, "musicas.write")).toBe(true);
  });

  /** Usuário sem a permissão específica não tem acesso. */
  it("retorna false quando permissão não está presente", () => {
    const perms = new Set(["musicas.write"]);
    expect(checkPermission(perms, "configuracoes.write")).toBe(false);
  });

  /** Set vazio significa sem acesso. */
  it("retorna false para Set vazio", () => {
    const perms = new Set<string>();
    expect(checkPermission(perms, "musicas.write")).toBe(false);
  });
});
