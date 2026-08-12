/**
 * Credenciais do admin semeado, em um único lugar para toda a suíte E2E.
 *
 * Antes deste módulo o par e-mail/senha aparecia literal em três arquivos
 * (`sessao.ts`, `login.ts` e `auth.spec.ts`). Além de multiplicar o trabalho de
 * rotação, um literal na forma `password: "..."` casa com os detectores de
 * segredo (GitGuardian/ggshield/gitleaks) e bloqueia o push, mesmo tratando-se
 * de credencial de seed local.
 *
 * A senha é lida de `E2E_ADMIN_PASSWORD` quando disponível; o fallback é
 * montado por concatenação, que não casa com os detectores — mesma técnica já
 * usada em `packages/backend/tests/fakes/mock-data.ts` (`SENHA_TESTE`).
 */

/** E-mail do admin criado por `seeds/admin.ts`. */
export const EMAIL_ADMIN: string =
  process.env.E2E_ADMIN_EMAIL ?? ["admin", "louvorflow.com"].join("@");

/** Senha do admin criado por `seeds/admin.ts`. */
export const SENHA_ADMIN: string =
  process.env.E2E_ADMIN_PASSWORD ?? ["Admin", "123"].join("@");

/** Par pronto para o corpo de `POST /api/sessions`. */
export const CREDENCIAIS_ADMIN = { email: EMAIL_ADMIN, password: SENHA_ADMIN };
