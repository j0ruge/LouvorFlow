# Research: Integração Frontend-Backend (Fase 2)

**Branch**: `006-frontend-backend-phase2` | **Date**: 2026-02-17

## R-001: Padrão de Componente CRUD Reutilizável para Configurações

**Decision**: Criar um componente genérico `ConfigCrudSection<T>` que receba props de configuração (label, colunas, hooks de CRUD) e renderize lista + formulário inline para cada aba da página de Configurações.

**Rationale**: As 5 entidades auxiliares (Artistas, Tags, Funções, Tonalidades, Tipos de Evento) possuem estrutura idêntica: lista de itens com nome único, criar, editar e excluir. Um componente reutilizável evita duplicação de código e garante consistência visual e comportamental.

**Alternatives considered**:
- Componentes separados por entidade: rejeitado por violar DRY — 5 componentes quase idênticos.
- Componente via composição (render props): desnecessariamente complexo para entidades com estrutura tão uniforme.

---

## R-002: Estratégia de Filtragem Client-Side com React Query

**Decision**: Implementar filtragem local no componente de página usando `useMemo` sobre os dados já cacheados pelo React Query. Debounce de 300ms no input de busca.

**Rationale**: O volume de dados esperado é baixo (dezenas a centenas de registros). Filtragem local é instantânea, evita chamadas extras ao servidor, e mantém a UX fluida. O React Query já possui os dados em cache — basta aplicar um filtro sobre eles.

**Alternatives considered**:
- Endpoint de busca no backend: desnecessário para o volume atual e exigiria alteração no backend.
- Filtragem sem debounce: poderia causar re-renders excessivos em listas grandes.

---

## R-003: Página de Detalhes da Música — Arquitetura de Componentes

**Decision**: Criar a página `SongDetail.tsx` em `pages/` com rota `/musicas/:id`. A página conterá seções para: informações básicas (edição inline), versões, tags e funções. Cada seção de relação usará o padrão já estabelecido em `EventoDetail.tsx` (seletor + lista com botão de remoção).

**Rationale**: O `EventoDetail.tsx` já implementa exatamente este padrão para associar/desassociar músicas e integrantes a eventos. Reutilizar a mesma abordagem visual e de interação garante consistência e reduz curva de aprendizagem do usuário.

**Alternatives considered**:
- Formulário de edição em modal: rejeitado pela complexidade de gerenciar múltiplas relações em um espaço restrito.
- Accordion por seção: funcional, mas visualmente inferior a seções empilhadas com cabeçalho, que são mais escaneáveis.

---

## R-004: Testes E2E com Playwright MCP

**Decision**: Utilizar o Playwright MCP (disponível como ferramenta no ambiente de desenvolvimento) para validar navegabilidade e usabilidade após cada módulo implementado. Adicionalmente, configurar Playwright como framework de testes E2E com arquivos `.spec.ts` para testes automatizados reproduzíveis.

**Rationale**: O Playwright MCP permite validação interativa imediata durante o desenvolvimento — navegar pela aplicação, verificar snapshots de acessibilidade, testar formulários e confirmar notificações. Testes `.spec.ts` complementam com regressão automatizada.

**Alternatives considered**:
- Apenas testes manuais: não garante regressão.
- Cypress: ecossistema mais pesado; Playwright é mais rápido e já está disponível via MCP.
- Apenas Vitest com Testing Library: insuficiente para testes de navegação cross-page e fluxos E2E completos.

---

## R-005: Estratégia de Dashboard com Dados Reais

**Decision**: O Dashboard usará os hooks existentes (`useMusicas`, `useEventos`, `useIntegrantes`) para obter dados e calcular estatísticas localmente (contagem de registros, filtragem de próximos eventos por data).

**Rationale**: Não existem endpoints agregados no backend. Os endpoints de listagem já retornam todos os dados necessários. Para o volume esperado, carregar as listas completas e calcular no cliente é eficiente e evita alterações no backend.

**Alternatives considered**:
- Endpoints agregados no backend: exigiria implementação adicional no backend, fora do escopo desta fase.
- Cache compartilhado entre páginas: React Query já faz isso — se o Dashboard carrega integrantes, navegar para /integrantes usa o cache.

---

## R-006: Padrão de Diálogo de Confirmação de Exclusão

**Decision**: Criar um componente `DeleteConfirmDialog` reutilizável que receba `title`, `description`, `onConfirm` e `isLoading`. Usar o componente `AlertDialog` do shadcn/ui já disponível no projeto.

**Rationale**: Todas as operações de exclusão (músicas, escalas, artistas, entidades auxiliares, versões) requerem confirmação. Um componente reutilizável garante consistência visual e evita duplicação.

**Alternatives considered**:
- `window.confirm()`: sem estilização, quebra a experiência visual do shadcn/ui.
- Dialog genérico com props de ação: o AlertDialog do shadcn/ui já é semântica e visualmente adequado para este caso.

---

## R-007: Gestão de Funções do Integrante no Dialog Existente

**Decision**: Adicionar uma seção abaixo dos campos existentes no `IntegranteForm` com: lista de funções atribuídas como badges removíveis + seletor dropdown para adicionar novas funções. As operações de adicionar/remover funções usarão os endpoints `POST/DELETE /integrantes/:id/funcoes/:funcaoId` via mutations independentes.

**Rationale**: O dialog existente é simples (5 campos) e comporta uma seção adicional sem ficar sobrecarregado. Mutations independentes para funções evitam acoplamento com o formulário de dados pessoais do integrante.

**Alternatives considered**:
- Multi-select no formulário: mistura dados pessoais com associações, dificultando validação e envio.
- Seção separada fora do dialog: fragmenta a experiência — o usuário esperaria ver tudo sobre o integrante em um só lugar.
