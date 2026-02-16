# LouvorFlow — Padrão de Arquitetura

## Visão Geral

<IMPORTANTE>
No desenvolvimento do projeto, é crucial seguir as melhores práticas de design e arquitetura para garantir escalabilidade, manutenibilidade e facilidade de uso. As seguintes regras e convenções devem ser rigorosamente seguidas por todos os desenvolvedores envolvidos no projeto.

1. Respeitar a Lei de Demeter, para desacoplamento
2. Tell, Don't Ask
3. Evitar Acoplamento Temporal
4. Clean Code
5. SOLID
6. DRY
7. KISS (Keep It Simple, Stupid)

Nunca refatore código a menos que explicitamente solicitado.
</IMPORTANTE>

## Stack Tecnológico

| Camada        | Tecnologia                                |
|---------------|-------------------------------------------|
| **Backend**   | Node.js (>=18), Express 5, TypeScript 5.9 |
| **Frontend**  | React 18, Vite, TailwindCSS, shadcn/ui    |
| **Banco**     | PostgreSQL 17                             |
| **ORM**       | Prisma 6                                  |
| **Validação** | Zod                                       |
| **Testes**    | Vitest 4                                  |
| **Infra**     | Docker Compose                            |

## Estrutura do Monorepo

```text
src/
├── backend/     # API RESTful (Express + Prisma)
└── frontend/    # SPA (React + Vite + shadcn/ui)
```

Regras específicas de cada camada estão em `.claude/rules/`:

- [`.claude/rules/backend-api.md`](.claude/rules/backend-api.md) — Arquitetura em camadas, AppError, Zod, Prisma, testes, OpenAPI.
- [`.claude/rules/frontend-react.md`](.claude/rules/frontend-react.md) — React, TailwindCSS, shadcn/ui, React Query, roteamento.

## Docstrings

- **OBRIGATÓRIO**: Todo código (classes, métodos, funções e interfaces públicas) deve conter docstrings claras, escritas em **português do Brasil**.
- As docstrings devem descrever o propósito, os parâmetros e o retorno de forma objetiva.
- Utilize o formato JSDoc (`/** ... */`) para projetos TypeScript/JavaScript.

## Regras de Markdown

- **OBRIGATÓRIO**: Todo bloco de código cercado (fenced code block) deve ter o identificador de linguagem após os três backticks de abertura. Exemplo: ` ```typescript `, ` ```json `, ` ```text `. Nunca usar ` ``` ` sem especificar a linguagem — isso viola a regra MD040 (fenced-code-language) do markdown-lint.

## Manutenção de Documentação

**OBRIGATÓRIO**: Toda mudança de código deve ser acompanhada por atualização de documentação relevante.

- Docstrings em português em todo código novo ou modificado.
- Ao final de cada tarefa: revisar se toda documentação está sincronizada.

## Integração com Ferramentas

- Use Plan Mode para grandes alterações arquiteturais.
- Use o diretório `.claude/rules/` para regras específicas de domínio.
