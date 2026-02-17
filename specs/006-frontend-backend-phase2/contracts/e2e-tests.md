# E2E Tests Contract: Navegabilidade e Usabilidade

**Branch**: `006-frontend-backend-phase2` | **Date**: 2026-02-17

Este documento define os testes de navegabilidade e usabilidade a serem executados com Playwright MCP após cada módulo implementado, e os testes E2E automatizados a serem criados.

---

## 1. Testes com Playwright MCP (Validação Interativa)

Após a implementação de cada módulo, usar as ferramentas do Playwright MCP para validação manual assistida:

### Ferramentas Utilizadas

- `browser_navigate`: Navegar para páginas/rotas específicas
- `browser_snapshot`: Capturar snapshot de acessibilidade (preferível a screenshot)
- `browser_click`: Interagir com botões, links, itens de lista
- `browser_fill_form`: Preencher formulários de criação/edição
- `browser_take_screenshot`: Capturar evidência visual
- `browser_wait_for`: Aguardar carregamento de dados/notificações
- `browser_console_messages`: Verificar erros no console

### Checklist por Módulo

#### Módulo: Músicas (Gestão Completa)

- [ ] Navegar para `/musicas`
- [ ] Clicar em uma música → verificar navegação para `/musicas/:id`
- [ ] Snapshot de acessibilidade na página de detalhes
- [ ] Editar nome/tonalidade → verificar notificação de sucesso
- [ ] Adicionar versão (com artista, BPM) → verificar na lista
- [ ] Remover versão → verificar remoção
- [ ] Adicionar tag → verificar badge
- [ ] Remover tag → verificar remoção
- [ ] Adicionar função → verificar badge
- [ ] Remover função → verificar remoção
- [ ] Excluir música → verificar confirmação → verificar redirecionamento
- [ ] Testar busca: digitar termo, verificar filtragem
- [ ] Testar busca: limpar campo, verificar lista completa
- [ ] Verificar console sem erros

#### Módulo: Escalas/Eventos

- [ ] Navegar para `/escalas`
- [ ] Clicar "Editar" em uma escala → verificar formulário preenchido
- [ ] Alterar descrição → salvar → verificar notificação
- [ ] Clicar "Excluir" → verificar diálogo de confirmação
- [ ] Confirmar exclusão → verificar remoção da lista
- [ ] Verificar console sem erros

#### Módulo: Integrantes (Funções)

- [ ] Navegar para `/integrantes`
- [ ] Clicar "Editar" em um integrante → verificar seção de funções
- [ ] Adicionar função via seletor → verificar badge adicionada
- [ ] Remover função clicando no badge → verificar remoção
- [ ] Salvar → verificar badges atualizadas na lista
- [ ] Testar busca: digitar nome, verificar filtragem
- [ ] Verificar console sem erros

#### Módulo: Configurações

- [ ] Navegar para `/configuracoes`
- [ ] Snapshot de acessibilidade → verificar 5 abas visíveis
- [ ] Aba Artistas: criar, editar, excluir artista
- [ ] Aba Tags: criar, editar, excluir tag
- [ ] Aba Funções: criar, editar, excluir função
- [ ] Aba Tonalidades: criar, editar, excluir tonalidade
- [ ] Aba Tipos de Evento: criar, editar, excluir tipo
- [ ] Testar duplicidade: criar com nome existente → verificar erro
- [ ] Verificar console sem erros

#### Módulo: Dashboard

- [ ] Navegar para `/` (Dashboard)
- [ ] Verificar cards com números reais (não fictícios)
- [ ] Verificar seção "Próximas Escalas" com dados do servidor
- [ ] Criar integrante em `/integrantes` → voltar ao Dashboard → verificar contagem atualizada
- [ ] Verificar console sem erros

#### Navegabilidade Geral

- [ ] Verificar todos os itens do menu lateral navegam corretamente
- [ ] Verificar item "Configurações" no menu lateral
- [ ] Verificar navegação com botão voltar do browser
- [ ] Verificar rota inexistente → página 404
- [ ] Verificar alternância de tema (claro/escuro)

---

## 2. Testes E2E Automatizados (Playwright Test Framework)

### Configuração

- Framework: Playwright Test
- Base URL: `http://localhost:8080`
- Pré-requisito: Frontend e Backend em execução

### Arquivos de Teste

#### `tests/e2e/navigation.spec.ts`

```text
Testes:
- "deve navegar para todas as páginas do menu lateral"
- "deve exibir página 404 para rotas inexistentes"
- "deve alternar entre tema claro e escuro"
- "deve manter o estado do sidebar ao navegar"
- "deve navegar de /musicas para /musicas/:id ao clicar em uma música"
- "deve voltar de /musicas/:id para /musicas via botão voltar"
- "deve navegar para /configuracoes e alternar entre abas"
```

#### `tests/e2e/musicas.spec.ts`

```text
Testes:
- "deve listar músicas do servidor"
- "deve navegar para detalhes ao clicar em uma música"
- "deve editar nome de uma música"
- "deve editar tonalidade de uma música"
- "deve excluir uma música com confirmação"
- "deve adicionar versão a uma música"
- "deve remover versão de uma música"
- "deve adicionar tag a uma música"
- "deve remover tag de uma música"
- "deve adicionar função a uma música"
- "deve remover função de uma música"
- "deve filtrar músicas pelo campo de busca"
- "deve restaurar lista ao limpar busca"
- "deve exibir estado vazio quando busca não encontra resultados"
```

#### `tests/e2e/escalas.spec.ts`

```text
Testes:
- "deve listar escalas do servidor"
- "deve editar uma escala existente"
- "deve excluir uma escala com confirmação"
- "deve exibir diálogo de confirmação antes de excluir"
```

#### `tests/e2e/integrantes.spec.ts`

```text
Testes:
- "deve adicionar função a um integrante"
- "deve remover função de um integrante"
- "deve exibir funções como badges no card do integrante"
- "deve filtrar integrantes pelo campo de busca"
```

#### `tests/e2e/configuracoes.spec.ts`

```text
Testes:
- "deve exibir página com 5 abas"
- "deve alternar entre abas sem recarregar"
- "deve criar artista"
- "deve editar artista"
- "deve excluir artista com confirmação"
- "deve exibir erro ao criar artista duplicado"
- "deve criar, editar e excluir tag"
- "deve criar, editar e excluir função"
- "deve criar, editar e excluir tonalidade"
- "deve criar, editar e excluir tipo de evento"
```

#### `tests/e2e/dashboard.spec.ts`

```text
Testes:
- "deve exibir contagens reais de músicas, integrantes e escalas"
- "deve exibir próximos eventos com dados reais"
- "deve atualizar contagens ao criar novo registro"
- "não deve exibir valores fictícios/hardcoded"
```
