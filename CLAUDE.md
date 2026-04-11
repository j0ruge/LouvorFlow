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

<CRITICAL>
## Princípio de Elegância

A elegância visual é prioridade máxima nas decisões de UI/UX. Ao escolher entre abordagens, **sempre preferir a mais elegante**, mesmo que exija mais esforço. Overlays sobre deslocamento de conteúdo, transições suaves, espaço para respirar, ícones semânticos e feedback claro ao usuário. Consultar `packages/frontend/.interface-design/system.md` (seção "Princípio de Elegância") para detalhes completos.
</CRITICAL>

<CRITICAL>
## Mobile-First — Regra Inviolável

Este app é usado **primariamente em dispositivos móveis** (Galaxy S8, 360×740). Todo código de UI DEVE ser desenvolvido com abordagem **mobile-first**: escrever para mobile primeiro, depois adaptar para desktop com breakpoints `sm:`, `md:`, `lg:`.

**Antes de considerar QUALQUER task de frontend como completa:**

1. Verificar visualmente o componente em viewport **360px de largura** (mobile)
2. Verificar que não há overflow horizontal, texto cortado ou botões inacessíveis
3. Verificar que não há classes de largura fixa (`w-48`, `w-64`, `w-32`) sem variante responsiva (`w-full sm:w-48`)
4. Verificar que inputs e selects usam `w-full sm:w-XX`
5. Verificar que flex rows usam `flex-col sm:flex-row` ou `flex-wrap`
6. Verificar que textos dinâmicos usam `truncate` + `min-w-0` no container pai

Se um componente funciona no desktop mas quebra no mobile, **a implementação está incorreta** — mobile é o target primário. Consultar `.claude/rules/frontend-react.md` (seção "Responsividade Mobile") e `packages/frontend/.interface-design/system.md` (seção "Mobile Adaptations") para padrões obrigatórios.
</CRITICAL>

## Stack Tecnológico

| Camada        | Tecnologia                                |
|---------------|-------------------------------------------|
| **Backend**   | Node.js (>=18), Express 5, TypeScript 5.9 |
| **Frontend**  | React 18, Vite, TailwindCSS, shadcn/ui    |
| **Banco**     | PostgreSQL 17                             |
| **ORM**       | Prisma 6                                  |
| **Validação** | Zod                                       |
| **Auth**      | bcryptjs, jsonwebtoken, dayjs, nodemailer  |
| **Testes**    | Vitest 4                                  |
| **Infra**     | Docker Compose                            |

## Estrutura do Monorepo

```text
packages/
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
- Se mudar qualquer coisa nos dados de API o `packages/backend/docs/openapi.json` deve ser atualizado.

A task não pode ser considerada completa enquanto essa documentação e rules não estiverem atualizadas. 

</CRITICAL>

## Finalização de Tasks

<CRITICAL>
**OBRIGATÓRIO**: Um pool de tasks NÃO pode ser considerado finalizado enquanto TODA a documentação do projeto não estiver atualizada e sincronizada com as mudanças implementadas. Isso inclui:

- Docstrings JSDoc em PT-BR em todo código novo ou modificado.
- `packages/backend/docs/openapi.json` refletindo qualquer alteração de API.
- `.claude/rules/backend-api.md` e `.claude/rules/frontend-react.md` atualizados com novos padrões, diretórios ou convenções introduzidos.
- `CLAUDE.md` atualizado se houver mudança na stack, estrutura do monorepo ou regras gerais.
- `README.md` atualizado se houver mudança em funcionalidades, stack, estrutura do projeto, rotas de API ou roadmap.
- MEMORY.md atualizado com novos padrões ou correções de informações desatualizadas.
- **Responsividade mobile verificada**: todo componente de UI testado em viewport 360px (mobile) e 1024px (desktop). Sem overflow, sem larguras fixas sem breakpoint, sem texto cortado.

Se a documentação não estiver 100% sincronizada com o código **ou a responsividade mobile não estiver verificada**, a implementação está **INCOMPLETA** — independentemente de todos os testes passarem.
</CRITICAL>

## Integração com Ferramentas

- Use Plan Mode para grandes alterações arquiteturais.
- Use o diretório `.claude/rules/` para regras específicas de domínio.
