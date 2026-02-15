
# Padrão de Arquitetura

## Visão Geral

<IMPORTANTE>
No desenvolvimento de APIs RESTful para o projeto, é crucial seguir as melhores práticas de design e arquitetura para garantir escalabilidade, manutenibilidade e facilidade de uso. As seguintes regras e convenções devem ser rigorosamente seguidas por todos os desenvolvedores envolvidos no projeto.
1- Respeitar a Lei de Demeter, para desacoplamento
2- Tell Dont Ask
3- Acoplamento Temporal
4- Clean Code
5- SOLID
6- DRY
7- KISS (Keep It Simple, Stupid)

</IMPORTANTE>

Use RESTful APIs com verbos HTTP padrão (GET, POST, PUT, DELETE).
Estrutura de projeto recomendada:
api/
├── src/
│   ├── controllers/     # Manipuladores de requisição
│   ├── routes/          # Definições de rota
│   ├── services/        # Lógica de negócio
│   ├── models/          # Modelos de dados
│   ├── middleware/      # Middleware de requisição
│   └── utils/           # Funções auxiliares
├── tests/               # Arquivos de teste
├── docs/                # Documentação (OpenAPI)
└── migrations/          # Migrações de banco de dados

Regras Obrigatórias (MANDATORY RULE):
Todas as operações devem ser concorrentes/paralelas em projetos de API.
Crie endpoints, modelos de banco de dados, testes e documentação simultaneamente.
Exemplo de padrão correto:

- Write("src/routes/users.ts", userRoutes)
- Write("src/controllers/UserController.ts", userController)
- Write("src/services/UserService.ts", userService)
- Write("src/models/User.ts", userModel)
- Write("tests/routes/users.test.ts", userRouteTests)
- Write("docs/openapi.yaml", openApiSpec)

## Convenções de Código

Validação de entrada obrigatória (ex: usando Zod ou Pydantic).
Formato de erros consistente em todas as respostas da API.

Documentação OpenAPI para todos os endpoints.
Códigos de status HTTP apropriados (200, 201, 400, 401, 404, 500).
Versionamento por URL (/v1/, /v2/) para mudanças quebradoras.
Gerenciamento de Contexto com Regras Condicionais:
Use o diretório .claude/rules/ para regras específicas de domínio. Exemplo para APIs REST
---

paths: src/api/**/*.ts

---

## Regras para desenvolvimento de API

- Todos os endpoints devem ter validação de entrada
- Retornar erros no formato padrão: { erro: "mensagem", codigo: 400 }
- Incluir comentários OpenAPI para cada rota

Integração com Ferramentas:
Use hooks para validar automaticamente:
Linting (npm run lint) antes do commit.
Testes passando antes da submissão.
Integre com GitHub Actions para CI/CD com validação baseada em CLAUDE.md.
Dicas para Melhor Desempenho:
Use Plan Mode para grandes alterações.
Evite mudanças não solicitadas: inclua em CLAUDE.md a regra:
"Nunca refatore código a menos que explicitamente solicitado."
Mantenha o arquivo curto, focado e atualizado.  Use @path/to/file para importar regras detalhadas.
