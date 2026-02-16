# LouvorFlow — Padrão de Arquitetura

## Visão Geral

<IMPORTANTE>
No desenvolvimento de APIs RESTful para o projeto, é crucial seguir as melhores práticas de design e arquitetura para garantir escalabilidade, manutenibilidade e facilidade de uso. As seguintes regras e convenções devem ser rigorosamente seguidas por todos os desenvolvedores envolvidos no projeto.

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

## Arquitetura em Camadas

```text
Request → Routes → Controllers → Services → Repositories → Prisma → PostgreSQL
```

Estrutura do backend:

```text
src/backend/
├── src/
│   ├── routes/          # Definições de rota
│   ├── controllers/     # Manipuladores de requisição HTTP
│   ├── services/        # Lógica de negócio e validações
│   ├── repositories/    # Acesso a dados (Prisma ORM)
│   ├── errors/          # AppError (erro padronizado)
│   └── types/           # Interfaces TypeScript
├── prisma/
│   ├── schema.prisma    # Schema do banco (13 entidades)
│   ├── cliente.ts       # Singleton do Prisma Client
│   └── migrations/      # Migrações do banco
├── tests/
│   ├── services/        # Testes unitários dos services
│   └── fakes/           # Repositórios falsos para testes
├── docs/
│   └── openapi.json     # Especificação OpenAPI 3.0
└── index.ts             # Entry point (porta 3000)
```

## Regras Obrigatórias

### Criação paralela de artefatos (MANDATORY RULE)

Todas as operações devem ser concorrentes/paralelas em projetos de API.
Crie endpoints, modelos de banco de dados, testes e documentação simultaneamente.
Exemplo de padrão correto:

```text
- Write("src/backend/src/routes/recurso.routes.ts", routes)
- Write("src/backend/src/controllers/recurso.controller.ts", controller)
- Write("src/backend/src/services/recurso.service.ts", service)
- Write("src/backend/src/repositories/recurso.repository.ts", repository)
- Write("src/backend/tests/services/recurso.service.test.ts", tests)
- Write("src/backend/docs/openapi.json", spec)  # atualizar
```

### Formato de erros

Todas as respostas de erro devem seguir o formato padronizado usando `AppError`:

```json
{ "erro": "Mensagem descritiva do erro", "codigo": 400 }
```

Códigos HTTP utilizados: `200`, `201`, `400`, `404`, `409`, `500`.

### Validação de entrada

Validação de entrada obrigatória usando **Zod** em todos os endpoints.

## Convenções de Código

- Use RESTful APIs com verbos HTTP padrão (GET, POST, PUT, DELETE).
- Documentação OpenAPI para todos os endpoints.
- Versionamento por URL (`/v1/`, `/v2/`) para mudanças quebradoras.
- Use o diretório `.claude/rules/` para regras específicas de domínio.

## Docstrings

- **OBRIGATÓRIO**: Todo código (classes, métodos, funções e interfaces públicas) deve conter docstrings claras, escritas em **português do Brasil**.
- As docstrings devem descrever o propósito, os parâmetros e o retorno de forma objetiva.
- Utilize o formato JSDoc (`/** ... */`) para projetos TypeScript/JavaScript.

## Testes

- Framework: **Vitest** com `globals: true` e ambiente `node`.
- Padrão: testes unitários dos **services** com **repositórios falsos** (fakes).
- Fakes ficam em `tests/fakes/` e implementam a mesma interface dos repositórios reais.
- Dados mock compartilhados em `tests/fakes/mock-data.ts`.
- Scripts: `npm run test` (execução única), `npm run test:watch` (modo watch).

## Banco de Dados

- ORM: **Prisma 6** com PostgreSQL 17.
- Schema: `src/backend/prisma/schema.prisma` (13 entidades).
- Singleton do client: `src/backend/prisma/cliente.ts`.
- Migrações via `npx prisma migrate dev`. Nunca usar SQL direto para alterar schema.
- Convenção de FK: `fk_nome_entidade` para 1:N, `[entidade]_id` para N:N.

## Regras de Markdown

- **OBRIGATÓRIO**: Todo bloco de código cercado (fenced code block) deve ter o identificador de linguagem após os três backticks de abertura. Exemplo: ` ```typescript `, ` ```json `, ` ```text `. Nunca usar ` ``` ` sem especificar a linguagem — isso viola a regra MD040 (fenced-code-language) do markdown-lint.

## Manutenção de Documentação

**OBRIGATÓRIO**: Toda mudança de código deve ser acompanhada por atualização de documentação relevante.

- Após nova funcionalidade: atualizar `src/backend/docs/openapi.json`.
- Após modificação de API (rotas, contratos): atualizar spec OpenAPI.
- Novas entidades/modelos: atualizar `src/backend/prisma/schema.prisma` e documentar.
- Docstrings em português em todo código novo ou modificado.
- Ao final de cada tarefa: revisar se toda documentação está sincronizada.

## Integração com Ferramentas

- Use `npm run typecheck` para verificação de tipos antes de commitar.
- Use `npm run test` para garantir que testes passam antes de submeter.
- Use Plan Mode para grandes alterações arquiteturais.
