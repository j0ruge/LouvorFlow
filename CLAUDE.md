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

<CRITICAL>
- Todo código (classes, métodos, funções, callbacks de teste e interfaces públicas) DEVE conter docstrings claras, escritas em **português do Brasil**, no formato JSDoc (`/** ... */`).
- As docstrings devem descrever o propósito, os parâmetros e o retorno de forma objetiva.
- Isso se aplica a TODO código novo ou modificado, sem exceção — incluindo funções de teste (`test()`, `it()`, `describe()`), hooks, handlers e utilitários.
- Nunca considerar uma tarefa como concluída se houver função, método ou callback de teste sem docstring JSDoc em PT-BR.
</CRITICAL>

## Regras de Markdown

- **OBRIGATÓRIO**: Todo bloco de código cercado (fenced code block) deve ter o identificador de linguagem após os três backticks de abertura. Exemplo: ` ```typescript `, ` ```json `, ` ```text `. Nunca usar ` ``` ` sem especificar a linguagem — isso viola a regra MD040 (fenced-code-language) do markdown-lint.

<CRITICAL>  
**OBRIGATÓRIO**: Toda mudança de código deve ser acompanhada por atualização de documentação relevante.

- Docstrings em português em todo código novo ou modificado.
- Ao final de cada tarefa: revisar se toda documentação está sincronizada.
- Se mudar qualquer coisa nos dados de API o @src\backend\docs\openapi.json deve ser atualizado. 

A task não pode ser considerada completa enquanto essa documentação e rules não estiverem atualizadas. 

</CRITICAL>

## Integração com Ferramentas

- Use Plan Mode para grandes alterações arquiteturais.
- Use o diretório `.claude/rules/` para regras específicas de domínio.
