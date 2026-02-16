---
paths:
  - "src/backend/**"
---

# Backend — Regras de Desenvolvimento

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
│   ├── schema.prisma    # Schema do banco (14 modelos)
│   ├── cliente.ts       # Singleton do Prisma Client
│   └── migrations/      # Migrações do banco
├── tests/
│   ├── services/        # Testes unitários dos services
│   └── fakes/           # Repositórios falsos para testes
├── docs/
│   └── openapi.json     # Especificação OpenAPI 3.0
└── index.ts             # Entry point (porta 3000)
```

## Criação paralela de artefatos (MANDATORY RULE)

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

## Formato de erros

Todas as respostas de erro devem seguir o formato padronizado usando `AppError`:

```json
{ "erro": "Mensagem descritiva do erro", "codigo": 400 }
```

Códigos HTTP utilizados: `200`, `201`, `400`, `404`, `409`, `500`.

## Validação de entrada

Validação de entrada obrigatória usando **Zod** em todos os endpoints.

## Convenções de Código

- Use RESTful APIs com verbos HTTP padrão (GET, POST, PUT, DELETE).
- Documentação OpenAPI para todos os endpoints.
- Versionamento por URL (`/v1/`, `/v2/`) para mudanças quebradoras.

## Testes

- Framework: **Vitest** com `globals: true` e ambiente `node`.
- Padrão: testes unitários dos **services** com **repositórios falsos** (fakes).
- Fakes ficam em `tests/fakes/` e implementam a mesma interface dos repositórios reais.
- Dados mock compartilhados em `tests/fakes/mock-data.ts`.
- Scripts: `npm run test` (execução única), `npm run test:watch` (modo watch).

## Banco de Dados

- ORM: **Prisma 6** com PostgreSQL 17.
- Schema: `src/backend/prisma/schema.prisma` (14 modelos).
- Singleton do client: `src/backend/prisma/cliente.ts`.
- Migrações via `npx prisma migrate dev`. Nunca usar SQL direto para alterar schema.
- Convenção de FK: `fk_nome_entidade` para 1:N, `[entidade]_id` para N:N.

## Manutenção de Documentação

- Após nova funcionalidade: atualizar `src/backend/docs/openapi.json`.
- Após modificação de API (rotas, contratos): atualizar spec OpenAPI.
- Novas entidades/modelos: atualizar `src/backend/prisma/schema.prisma` e documentar.

## Integração com Ferramentas

- Use `npm run typecheck` para verificação de tipos antes de commitar.
- Use `npm run test` para garantir que testes passam antes de submeter.
