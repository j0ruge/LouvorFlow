# LouvorFlow

> Sistema de gerenciamento de escalas de louvor para ministérios de música.

[![License: MIT](https://img.shields.io/badge/license-MIT-blue.svg)](LICENSE)
[![Node.js](https://img.shields.io/badge/node-%3E%3D18-brightgreen.svg)](https://nodejs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.9-blue.svg)](https://www.typescriptlang.org/)
[![PostgreSQL](https://img.shields.io/badge/PostgreSQL-17-336791.svg)](https://www.postgresql.org/)
[![Prisma](https://img.shields.io/badge/Prisma-6-2D3748.svg)](https://www.prisma.io/)

O **LouvorFlow** é uma aplicação web para organizar escalas de músicas em cultos, gerenciar músicos, acompanhar repertório e facilitar a comunicação entre integrantes de ministérios de louvor.

## Sumário

- [Contexto](#contexto)
- [Funcionalidades](#funcionalidades)
- [Tecnologias](#tecnologias)
- [Instalação](#instalação)
  - [Início Rápido](#início-rápido)
  - [Pré-requisitos](#pré-requisitos)
  - [Banco de Dados](#1-banco-de-dados)
  - [Backend](#2-backend)
  - [Frontend](#3-frontend)
- [Uso](#uso)
- [API](#api)
- [Arquitetura](#arquitetura)
- [Estrutura do Projeto](#estrutura-do-projeto)
- [Roadmap](#roadmap)
- [Como Contribuir](#como-contribuir)
- [Documentação](#documentação)
- [Licença](#licença)

## Contexto

Esse projeto surgiu da necessidade de amigos que desejam aprender sobre desenvolvimento de sistemas, servindo como uma aplicação prática para explorar conceitos de engenharia de software, banco de dados e desenvolvimento web.

O problema que resolve: ministérios de louvor costumam gerenciar escalas em planilhas ou grupos de WhatsApp, sem histórico centralizado, sem controle de repertório e sem visibilidade sobre quais músicas são mais tocadas. O LouvorFlow organiza tudo isso em um único lugar.

## Funcionalidades

- **Gerenciamento de músicas** — Cadastro, edição, exclusão, com tonalidade, cifra, BPM, letra e versões por artista. Página de detalhes dedicada com gestão de versões, tags e funções requeridas.
- **Escalas de culto** — Criação, edição e exclusão de escalas com definição das músicas, ministros, cantores e músicos para cada evento.
- **Gerenciamento de integrantes** — Cadastro de membros com atribuição e remoção de funções (voz, guitarra, teclado, etc.).
- **Configurações** — Página dedicada com abas para gerenciar entidades auxiliares: Artistas, Tags, Funções, Tonalidades e Tipos de Evento.
- **Dashboard com dados reais** — Painel com estatísticas do servidor (total de músicas, escalas, integrantes) e próximas escalas.
- **Busca funcional** — Filtragem por nome nas listagens de músicas e integrantes com debounce.
- **Relatórios de execução** — Monitoramento das músicas mais tocadas ao longo do tempo.
- **Compartilhamento** — Envio de escalas via WhatsApp para os envolvidos.
- **Histórico de escalas** — Consulta de escalas anteriores.
- **Autenticação e RBAC** — Login com JWT (access + refresh token), recuperação de senha por e-mail, gestão de usuários, papéis (roles) e permissões. Painel administrativo com controle de acesso baseado em roles.
- **Perfil do usuário** — Edição de nome, e-mail e senha pelo próprio usuário.

## Tecnologias

| Camada         | Tecnologia                                  |
|----------------|---------------------------------------------|
| **Backend**    | Node.js (>=18), Express 5, TypeScript       |
| **Frontend**   | React 18, Vite, TailwindCSS, shadcn/ui      |
| **Banco**      | PostgreSQL 17                               |
| **ORM**        | Prisma 6                                    |
| **Validação**  | Zod                                         |
| **Auth**       | bcryptjs, jsonwebtoken, dayjs, nodemailer   |
| **Testes**     | Vitest 4 (unitários), Playwright (E2E)      |
| **Infra**      | Docker Compose                              |

## Instalação

### Pré-requisitos

- [Node.js](https://nodejs.org/) >= 18
- [Docker](https://www.docker.com/) e Docker Compose
- [Git](https://git-scm.com/)

### Início Rápido

Os scripts abaixo sobem toda a infraestrutura de desenvolvimento (Docker/PostgreSQL, backend e frontend) com um único comando:

**Linux / macOS:**

```bash
./dev.sh
```

**Windows (PowerShell):**

```powershell
powershell -ExecutionPolicy Bypass -File dev.ps1
```

> **Dica:** Pressione `Ctrl+C` para encerrar todos os processos de uma vez.

Se preferir controle granular sobre cada serviço, siga os passos manuais abaixo.

### 1. Banco de Dados

```bash
cd infra/postgres
cp .env.example .env
# Edite o .env com suas credenciais (opcional — valores padrão já funcionam)
docker-compose up -d
```

### 2. Backend

```bash
cd packages/backend
npm install
cp .env.example .env
# Edite o .env — a DATABASE_URL deve corresponder ao banco
# Configure também as variáveis de autenticação:
#   APP_SECRET, APP_SECRET_REFRESH_TOKEN — segredos JWT
#   ADMIN_EMAIL, ADMIN_PASSWORD, ADMIN_NAME — credenciais do admin inicial
#   SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS — servidor de e-mail (recuperação de senha)
npx prisma migrate dev
npx prisma db seed   # OBRIGATÓRIO — cria o usuário admin inicial
npm run dev
```

> **Importante:** O comando `npx prisma db seed` é **obrigatório** na primeira execução. Ele cria o usuário admin inicial necessário para login e acesso ao sistema. O seed é idempotente — pode ser re-executado com segurança. Se usar os scripts `dev.sh` ou `dev.ps1`, o seed é executado automaticamente.

O servidor inicia em `http://localhost:3000`.

### 3. Frontend

```bash
cd packages/frontend
npm install
npm run dev
```

O frontend inicia em `http://localhost:8080`.

Para rodar os testes E2E (requer backend e frontend em execução):

```bash
cd packages/frontend
npx playwright test
```

## Uso

Com o servidor rodando, faça requisições para a API REST. A maioria dos endpoints requer autenticação via JWT.

**1. Fazer login para obter o token:**

```bash
curl -X POST http://localhost:3000/api/sessions \
  -H "Content-Type: application/json" \
  -d '{"email": "admin@louvorflow.com", "password": "sua-senha"}'
```

```json
{
  "token": "eyJhbGciOiJIUzI1NiIs...",
  "refreshToken": "eyJhbGciOiJIUzI1NiIs...",
  "user": {
    "id": "uuid",
    "name": "Admin",
    "email": "admin@louvorflow.com",
    "roles": [{ "id": "uuid", "name": "admin" }],
    "permissions": []
  }
}
```

> **Nota:** Use o `token` retornado no header `Authorization: Bearer <token>` das requisições abaixo.

**2. Criar um artista:**

```bash
curl -X POST http://localhost:3000/api/artistas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"nome": "Aline Barros"}'
```

```json
{
  "msg": "Artista criado com sucesso",
  "artista": {
    "id": "550e8400-e29b-41d4-a716-446655440000",
    "nome": "Aline Barros"
  }
}
```

**3. Cadastrar uma música:**

```bash
curl -X POST http://localhost:3000/api/musicas \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer <token>" \
  -d '{"nome": "Rendido Estou", "fk_tonalidade": "tonalidade-id"}'
```

```json
{
  "msg": "Música criada com sucesso",
  "musica": {
    "id": "musica-id-456",
    "nome": "Rendido Estou",
    "tonalidade": { "id": "tonalidade-id", "tom": "G" }
  }
}
```

**4. Listar músicas com paginação:**

```bash
curl -H "Authorization: Bearer <token>" \
  "http://localhost:3000/api/musicas?page=1&limit=10"
```

```json
{
  "items": [
    {
      "id": "musica-id-456",
      "nome": "Rendido Estou",
      "tonalidade": { "id": "tonalidade-id", "tom": "G" },
      "tags": [{ "id": "tag-id-1", "nome": "Adoração" }],
      "versoes": [
        {
          "id": "versao-id-1",
          "artista": { "id": "artista-id", "nome": "Aline Barros" },
          "bpm": 72,
          "cifras": "G - C - Em - D",
          "lyrics": "Rendido estou...",
          "link_versao": null
        }
      ],
      "funcoes": [{ "id": "funcao-id-1", "nome": "Voz" }]
    }
  ],
  "meta": {
    "total": 45,
    "page": 1,
    "per_page": 10,
    "total_pages": 5
  }
}
```

**Resposta de erro (campo obrigatório ausente):**

```json
{
  "erro": "Nome da música é obrigatório",
  "codigo": 400
}
```

## API

Base URL: `http://localhost:3000/api`

### Recursos principais

| Recurso          | Rota base           | CRUD | Sub-recursos / Notas                   |
|------------------|---------------------|------|----------------------------------------|
| Artistas         | `/artistas`         | Sim  | —                                      |
| Músicas          | `/musicas`          | Sim  | `/versoes`, `/tags`, `/funcoes`        |
| Integrantes      | `/integrantes`      | Sim  | `/funcoes`                             |
| Eventos          | `/eventos`          | Sim  | `/musicas`, `/integrantes`             |
| Tags             | `/tags`             | Sim  | —                                      |
| Tonalidades      | `/tonalidades`      | Sim  | —                                      |
| Funções          | `/funcoes`          | Sim  | —                                      |
| Tipos de Eventos | `/tipos-eventos`    | Sim  | —                                      |
| Sessions         | `/sessions`         | —    | Login, refresh token, logout           |
| Users            | `/users`            | Sim  | Requer role `admin`                    |
| Roles            | `/roles`            | Sim  | `/permissions`. Requer role `admin`    |
| Permissions      | `/permissions`      | Sim  | Requer role `admin`                    |
| Profile          | `/profile`          | —    | Visualizar e editar perfil próprio     |
| Password         | `/password`         | —    | Esqueci senha, redefinir senha         |

### Padrão CRUD

Cada recurso segue o padrão:

| Método   | Rota          | Ação                   |
|----------|---------------|------------------------|
| `GET`    | `/recurso`    | Listar todos           |
| `GET`    | `/recurso/:id`| Buscar por ID          |
| `POST`   | `/recurso`    | Criar                  |
| `PUT`    | `/recurso/:id`| Atualizar              |
| `DELETE` | `/recurso/:id`| Remover                |

### Sub-recursos (exemplos)

```bash
# Versões de uma música (CRUD)
GET    /api/musicas/:musicaId/versoes
POST   /api/musicas/:musicaId/versoes
PUT    /api/musicas/:musicaId/versoes/:versaoId
DELETE /api/musicas/:musicaId/versoes/:versaoId

# Tags de uma música
GET    /api/musicas/:musicaId/tags
POST   /api/musicas/:musicaId/tags
DELETE /api/musicas/:musicaId/tags/:tagId

# Funções requeridas de uma música
GET    /api/musicas/:musicaId/funcoes
POST   /api/musicas/:musicaId/funcoes
DELETE /api/musicas/:musicaId/funcoes/:funcaoId

# Funções de um integrante
GET    /api/integrantes/:integranteId/funcoes
POST   /api/integrantes/:integranteId/funcoes
DELETE /api/integrantes/:integranteId/funcoes/:funcaoId

# Músicas e integrantes de um evento
GET    /api/eventos/:eventoId/musicas
POST   /api/eventos/:eventoId/musicas
DELETE /api/eventos/:eventoId/musicas/:musicaId
GET    /api/eventos/:eventoId/integrantes
POST   /api/eventos/:eventoId/integrantes
DELETE /api/eventos/:eventoId/integrantes/:integranteId
```

### Formato de erros

Todas as respostas de erro seguem o formato padronizado via `AppError`:

```json
{
  "erro": "Mensagem descritiva do erro",
  "codigo": 400
}
```

Códigos HTTP utilizados: `200`, `201`, `400`, `401`, `403`, `404`, `409`, `500`.

## Arquitetura

O backend segue uma arquitetura em camadas com separação clara de responsabilidades:

```text
Request → Routes → Middlewares → Controllers → Services → Repositories → Prisma → PostgreSQL
```

| Camada          | Responsabilidade                                           |
|-----------------|-----------------------------------------------------------|
| **Routes**      | Definição de rotas e mapeamento para controllers           |
| **Middlewares**  | Autenticação (JWT), autorização (roles/permissions), validação (Zod) |
| **Controllers** | Receber requisição HTTP e devolver resposta                |
| **Services**    | Lógica de negócio, validações e regras                     |
| **Repositories**| Acesso a dados via Prisma ORM                              |

## Estrutura do Projeto

```text
LouvorFlow/
├── packages/
│   ├── backend/                  # API REST
│   │   ├── src/
│   │   │   ├── routes/           # Definições de rotas
│   │   │   │   └── auth/        # Rotas de auth (sessions, users, roles, permissions, profile, password)
│   │   │   ├── controllers/      # Handlers HTTP
│   │   │   ├── services/         # Regras de negócio
│   │   │   ├── repositories/     # Acesso a dados (Prisma)
│   │   │   ├── middlewares/      # Auth (JWT), autorização (roles/permissions), validação (Zod)
│   │   │   ├── providers/        # Hash, Token, Date, Mail providers
│   │   │   ├── config/           # Configurações (auth, etc.)
│   │   │   ├── validators/       # Schemas Zod de validação
│   │   │   ├── errors/           # AppError
│   │   │   └── types/            # Interfaces TypeScript
│   │   ├── prisma/               # Schema e migrações
│   │   ├── seeds/                # Seed do admin inicial
│   │   ├── tests/                # Testes unitários (Vitest)
│   │   │   ├── services/         # Testes dos services
│   │   │   └── fakes/            # Repositórios falsos
│   │   └── docs/                 # Especificação OpenAPI
│   └── frontend/                 # SPA React (Vite + TailwindCSS)
│       └── src/
│           ├── pages/            # Páginas da aplicação
│           │   └── admin/       # Páginas administrativas (usuários, roles, permissões)
│           ├── components/       # Componentes React + shadcn/ui
│           ├── contexts/         # AuthContext (estado global de autenticação)
│           ├── hooks/            # Custom hooks (React Query, auth, admin)
│           ├── services/         # Serviços de acesso à API (auth, admin)
│           ├── schemas/          # Schemas Zod (auth, formulários)
│           ├── lib/              # Utilitários (apiFetch com auto-refresh)
│           └── tests/e2e/        # Testes E2E (Playwright)
├── infra/
│   └── postgres/                 # Docker Compose para PostgreSQL
├── specs/                        # Especificações de desenvolvimento
├── doc/                          # Modelagem do banco de dados
└── entrevistas/                  # Entrevistas com usuários
```

## Roadmap

- [x] Testes unitários com repositórios mockados
- [x] Integração frontend-backend — Fase 1 (listagem e criação de músicas, escalas, integrantes)
- [x] Integração frontend-backend — Fase 2 (CRUD completo, configurações, dashboard real, busca, testes E2E)
- [x] Autenticação com JWT e RBAC (backend + frontend)
- [ ] Seleção de versão ao associar música a escala (débito técnico)
- [ ] Compartilhamento de escalas via WhatsApp
- [ ] Relatórios de frequência de execução
- [ ] Histórico de escalas por período
- [ ] Busca avançada de músicas (por tag, tonalidade, artista)

## Como Contribuir

1. Faça um fork do repositório.
2. Clone o repositório:

   ```bash
   git clone https://github.com/seu-usuario/LouvorFlow.git
   ```

3. Instale as dependências do backend e/ou frontend (`npm install`).
4. Crie uma branch para sua feature:

   ```bash
   git checkout -b minha-feature
   ```

5. Implemente e faça commits organizados.
6. Envie um pull request.

Toda contribuição é bem-vinda — código, design, documentação ou testes!

> [!IMPORTANT]
> Os dados sensíveis estão descritos na página [ChewieSoft no Notion](https://www.notion.so/chewiesoft/LouvorFlow-29f87af01858809cb272f02e2f7b521d?source=copy_link).

## Documentação

| Recurso                  | Link                                            |
|--------------------------|-------------------------------------------------|
| Modelagem do Banco       | [`doc/readme.md`](./doc/readme.md)              |
| Infraestrutura (Docker)  | [`infra/README.md`](./infra/README.md)          |
| Especificações           | [`specs/`](./specs/)                            |
| OpenAPI (Swagger)        | [`packages/backend/docs/openapi.json`](./packages/backend/docs/openapi.json) |
| Entrevistas com Usuários | [`entrevistas/`](./entrevistas/)                |

## Licença

LouvorFlow é licenciado sob a licença [MIT](./LICENSE).
