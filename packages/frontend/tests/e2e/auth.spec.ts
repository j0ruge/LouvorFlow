/**
 * Testes E2E de autenticação e componente PasswordInput.
 *
 * Verifica o fluxo de login (sucesso e erro), o toggle de visibilidade
 * de senha (ícone Eye/EyeOff) em todas as páginas que possuem campos
 * de senha: Login, ResetPassword, Profile, Users (admin) e IntegranteForm.
 */

import { test, expect } from "@playwright/test";
import { loginAsAdmin } from "./helpers/login";

test.describe("Login", () => {
  /** Verifica que o login com credenciais corretas redireciona ao Dashboard. */
  test("deve realizar login com credenciais válidas", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("textbox", { name: "E-mail" }).fill("admin@louvorflow.com");
    await page.getByRole("textbox", { name: "Senha" }).fill("Admin@123");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page).toHaveURL("/", { timeout: 10_000 });
    await expect(page.getByRole("heading", { name: "Dashboard" })).toBeVisible();
  });

  /** Verifica que credenciais inválidas exibem mensagem de erro. */
  test("deve exibir erro com credenciais inválidas", async ({ page }) => {
    await page.goto("/login");
    await page.getByRole("textbox", { name: "E-mail" }).fill("invalido@email.com");
    await page.getByRole("textbox", { name: "Senha" }).fill("senhaErrada");
    await page.getByRole("button", { name: "Entrar" }).click();

    await expect(page.locator(".bg-destructive\\/10")).toBeVisible({ timeout: 5_000 });
  });
});

test.describe("PasswordInput — Toggle de visibilidade", () => {
  /** Verifica toggle no campo de senha da página de Login. */
  test("deve alternar visibilidade da senha no Login", async ({ page }) => {
    await page.goto("/login");
    const senhaInput = page.getByRole("textbox", { name: "Senha" });
    await senhaInput.fill("MinhaSenha123");

    /** Verifica que o campo começa como password (texto oculto). */
    await expect(senhaInput).toHaveAttribute("type", "password");

    /** Clica no botão de toggle e verifica que o texto fica visível. */
    await page.getByRole("button", { name: "Mostrar senha" }).click();
    await expect(senhaInput).toHaveAttribute("type", "text");
    await expect(senhaInput).toHaveValue("MinhaSenha123");

    /** Clica novamente para ocultar. */
    await page.getByRole("button", { name: "Ocultar senha" }).click();
    await expect(senhaInput).toHaveAttribute("type", "password");
  });

  /** Verifica toggle nos 2 campos de senha da página de ResetPassword. */
  test("deve alternar visibilidade nos campos de ResetPassword", async ({ page }) => {
    await page.goto("/redefinir-senha?token=fake-token-e2e");

    const novaSenha = page.getByRole("textbox", { name: "Nova Senha" });
    const confirmarSenha = page.getByRole("textbox", { name: "Confirmar Senha" });

    await expect(novaSenha).toBeVisible();
    await expect(confirmarSenha).toBeVisible();

    /** Verifica que ambos os campos têm botão de toggle. */
    const toggleButtons = page.getByRole("button", { name: "Mostrar senha" });
    await expect(toggleButtons).toHaveCount(2);

    /** Testa toggle do primeiro campo. */
    await novaSenha.fill("NovaSenha123");
    await toggleButtons.first().click();
    await expect(novaSenha).toHaveAttribute("type", "text");
    await expect(novaSenha).toHaveValue("NovaSenha123");
  });

  /** Verifica toggle nos 2 campos de senha da página de Profile. */
  test("deve alternar visibilidade nos campos de Profile", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/perfil");

    await expect(page.getByRole("heading", { name: "Meu Perfil" })).toBeVisible();

    const senhaAtual = page.getByRole("textbox", { name: "Senha Atual" });
    const novaSenha = page.getByRole("textbox", { name: "Nova Senha" });

    await expect(senhaAtual).toBeVisible();
    await expect(novaSenha).toBeVisible();

    /** Verifica que ambos os campos têm botão de toggle. */
    const toggleButtons = page.getByRole("button", { name: "Mostrar senha" });
    await expect(toggleButtons).toHaveCount(2);

    /** Testa toggle do campo Senha Atual. */
    await senhaAtual.fill("SenhaAtual123");
    await toggleButtons.first().click();
    await expect(senhaAtual).toHaveAttribute("type", "text");
    await expect(senhaAtual).toHaveValue("SenhaAtual123");
  });

  /** Verifica toggle no campo de senha do dialog Novo Usuário (admin). */
  test("deve alternar visibilidade no dialog Novo Usuário", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/admin/usuarios");

    await page.getByRole("button", { name: "Novo Usuário" }).click();
    await expect(page.getByRole("heading", { name: "Criar Novo Usuário" })).toBeVisible();

    const senhaInput = page.getByRole("textbox", { name: "Senha" });
    await senhaInput.fill("SenhaUsuario123");

    await page.getByRole("button", { name: "Mostrar senha" }).click();
    await expect(senhaInput).toHaveAttribute("type", "text");
    await expect(senhaInput).toHaveValue("SenhaUsuario123");
  });

  /** Verifica toggle no campo de senha do dialog Novo Integrante. */
  test("deve alternar visibilidade no dialog Novo Integrante", async ({ page }) => {
    await loginAsAdmin(page);
    await page.goto("/integrantes");

    await page.getByRole("button", { name: "Novo Integrante" }).click();
    await expect(page.getByRole("heading", { name: "Novo Integrante" })).toBeVisible();

    const senhaInput = page.getByRole("textbox", { name: "Senha" });
    await senhaInput.fill("SenhaIntegrante123");

    await page.getByRole("button", { name: "Mostrar senha" }).click();
    await expect(senhaInput).toHaveAttribute("type", "text");
    await expect(senhaInput).toHaveValue("SenhaIntegrante123");
  });
});
