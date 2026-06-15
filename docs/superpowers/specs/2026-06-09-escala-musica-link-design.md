# Design — Abrir música a partir da escala (com retorno à posição de rolagem)

- **Data:** 2026-06-09
- **Feature:** 028-escala-musica-link
- **Branch:** `028-escala-musica-link`
- **Autor:** brainstorming colaborativo (usuária + Claude)

## 1. Problema / Objetivo

Na página de detalhe de uma escala (`/escalas/:id`), a usuária quer tocar/clicar
em qualquer música da lista e ser levada à página de detalhe daquela música
(`/musicas/:musicaId`). Ao **voltar** — seja pelo botão "Voltar" da página da
música, seja pelo gesto/botão "voltar" do sistema no mobile — deve retornar à
escala **na mesma posição de rolagem** em que estava.

Exemplo concreto fornecido pela usuária:

- Está em `/escalas/a6590d62-01b5-4dd9-ac8d-40d3236f7619`
- Clica na primeira música → vai para `/musicas/e87e43da-0f92-46a9-bea4-f93312d2b92e`
- Ao voltar → retorna a `/escalas/a6590d62-...` **onde estava** (rolagem preservada)

## 2. Escopo

### Dentro do escopo

- Tornar cada card de música na escala clicável → navega para a música.
- Passar a URL de origem para o botão "Voltar" da página da música (padrão já existente).
- Restaurar a posição de rolagem da escala ao retornar (botão Voltar **e** voltar do sistema).
- Garantir que a página da música abre **no topo**.

### Fora do escopo

- Restauração de rolagem genérica para o app inteiro (ver Alternativa C, rejeitada).
- Qualquer mudança de API/backend (feature puramente de frontend).
- Mudança no comportamento de drag-and-drop de reordenação.

### Disponibilidade

Disponível para **qualquer** usuário que visualiza a escala, inclusive integrantes
read-only (sem `escalas.write`, ex.: acesso via link compartilhado). Abrir a
música é uma ação de leitura e não deve depender de permissão de escrita.

## 3. Achados relevantes do código (base da decisão)

1. **`musica.id` no evento é o id global da música.** `MusicaEventoSchema.id` é um
   UUID e é comparado contra o catálogo (`allMusicas.items[].id`) em
   `EventoDetail.tsx`. Logo, `/musicas/${musica.id}` é o alvo correto — não há id de
   junção intermediário.

2. **Já existe padrão de "voltar com origem".** `Songs.tsx` navega com
   `navigate(/musicas/${id}, { state: { from: location.pathname + location.search } })`
   e `SongDetail.tsx` lê `location.state.from` (com narrowing seguro e fallback para
   `/musicas`) no botão "Voltar". Reaproveitamos esse contrato.

3. **Convenção de card clicável.** `Songs.tsx` torna a linha inteira clicável com
   `role="button"`, `tabIndex={0}`, `onClick`, `onKeyDown={handleClickableKeyDown(...)}`
   (helper em `@/lib/utils`), `cursor-pointer` e hover (`hover:shadow-medium
   hover:border-primary/30`); controles internos usam `e.stopPropagation()`.

4. **A rolagem não é da janela.** Em `AppLayout.tsx`, o `<main>` é
   `h-screen overflow-hidden` e o scroll ocorre num `<div overflow-y-auto
   scrollbar-overlay>` **interno e compartilhado** entre páginas. Consequências:
   - A restauração nativa do navegador (back/forward) **não** cobre este container.
   - Sem tratamento, ao navegar para a música o container mantém o `scrollTop` da
     escala (carry-over), abrindo a música no meio da página.

## 4. Decisão de interface (aprovada)

**Card inteiro clicável** (consistente com a lista de Músicas e melhor alvo de toque
no mobile). O grip de arrastar, o botão remover (✕) e o seletor de versão
(`MusicaVersaoPicker`, um Popover) **não** navegam.

```text
TOQUE EM QUALQUER PARTE DA LINHA → abre a música
┌────────────────────────────────────┐
│ ⠿  1  ♪ Oceans                  ✕ │
│        🎸 D   [ Versão: Hillsong ▾]│
└────────────────────────────────────┘
NÃO navegam: ⠿ arrastar · ✕ remover · ▾ versão
hover: card eleva (sombra) + cursor-pointer
```

## 5. Arquitetura da solução

### 5.1 Card clicável (`EventoDetail.tsx` → `SortableMusicaCard`)

- O card raiz recebe `role="button"`, `tabIndex={0}`, `cursor-pointer`, hover e
  handlers de clique/teclado, reusando `handleClickableKeyDown` de `@/lib/utils`.
- A lógica de rota fica na **página** (`EventoDetail`), não no componente de
  apresentação: o `SortableMusicaCard` recebe uma prop `onOpen(musicaId: string)` e
  apenas a invoca (Tell, Don't Ask / Lei de Demeter).
- `EventoDetail` define:
  ```ts
  const handleOpenMusica = (musicaId: string) =>
    navigate(`/musicas/${musicaId}`, { state: { from: location.pathname } });
  ```
- **`e.stopPropagation()`** nos 3 controles internos (grip, remover, seletor de
  versão) para que suas interações não disparem a navegação. O conteúdo do Popover
  do seletor renderiza em portal (não borbulha pelo card); apenas o **trigger**
  precisa do `stopPropagation`.
- **DnD permanece intacto:** as `listeners` de arraste ficam apenas no grip;
  `PointerSensor` usa `distance: 8` (um clique não inicia arraste) e `TouchSensor`
  usa `delay: 250ms` (toque curto navega, long-press arrasta).

### 5.2 Navegação para frente

`SongDetail.tsx` **já** trata `location.state.from` no botão "Voltar". Nenhuma
mudança funcional é necessária lá para o retorno — apenas o ajuste de rolagem (5.4).

### 5.3 Restauração de rolagem da escala — `useScrollRestoration`

Novo hook `src/hooks/use-scroll-restoration.ts`, usado em `EventoDetail` como
`useScrollRestoration('escala:' + id)`.

Comportamento:

- **Localiza o container** de rolagem via `document.querySelector('[data-scroll-root]')`
  (atributo adicionado ao `AppLayout` — ver 5.5).
- **Salva** o `scrollTop` num store em memória (um `Map` de módulo) keyed pela
  string recebida:
  - listener de `scroll` throttled com `requestAnimationFrame` (passivo);
  - salva também no cleanup/unmount (captura o valor final antes de desmontar).
- **Restaura** ao montar:
  - se há valor salvo, aplica quando os dados já estão carregados — `useLayoutEffect`
    gated por um flag `ready` (dados do React Query presentes). Dentro do `staleTime`
    (60s, default das queries) o cache devolve os dados na primeira render, então a
    altura do conteúdo já existe e não há "pulo";
  - **consome e apaga** a chave após restaurar (re-entrar a mesma escala mais tarde,
    a partir da lista, começa no topo — evita restauração "fantasma");
  - se **não** há valor salvo, leva o container ao topo (`scrollTop = 0`), corrigindo
    o carry-over do container compartilhado.

**Store:** `Map` de módulo (KISS). Cobre back/forward dentro da SPA. Em reload
completo (F5) a posição é perdida e a escala abre no topo — degradação aceitável.
`sessionStorage` é um upgrade trivial caso se queira persistir através de reload
(decisão atual: **não** persistir; usar `Map`).

### 5.4 Página da música abre no topo (`SongDetail.tsx`)

Como o container de rolagem é compartilhado, ao montar `SongDetail` força
`scrollTop = 0` nesse container (`useLayoutEffect`, efeito mínimo). Isso garante que
a música abre no topo independentemente da origem (escala ou lista) e corrige o
carry-over para ambos os caminhos.

### 5.5 `AppLayout.tsx`

Adiciona `data-scroll-root` ao `<div>` de rolagem (1 linha, sem efeito visual) para
que o hook localize o container sem acoplar a uma classe de estilo
(`scrollbar-overlay`).

## 6. Alternativas consideradas

- **(A) `from` push + memória de rolagem escopada — ESCOLHIDA.** Reaproveita o
  contrato `from`, funciona para "Voltar" e voltar do sistema, é seguro em deep-link,
  e tem o menor raio de impacto.
- **(B) `navigate(-1)` real + memória por `location.key`.** Evita empilhar histórico,
  mas diverge do padrão `from`, é arriscado em deep-link (sem entrada anterior, sai
  do app) e perde a memória em reload. Rejeitada.
- **(C) Restauração genérica de rolagem no `AppLayout` (app inteiro).** Mais DRY e
  elegante, beneficiaria também a lista de Músicas, porém mexe no layout compartilhado
  e muda comportamento global — contra a regra "nunca refatorar sem solicitação
  explícita". Rejeitada para esta feature (candidata a melhoria futura separada).

## 7. Edge cases

- **Escala encurtou** (músicas removidas) entre sair e voltar: `scrollTop` é clampado
  ao máximo possível — sem erro, posição aproximada.
- **Deep-link direto na música** → "Voltar" cai no fallback `/musicas` (lógica já
  existente em `SongDetail`).
- **`id` ausente/container inexistente:** o hook é no-op (guardas de nulidade).
- **Reload (F5) na música:** ao voltar, `Map` vazio → escala abre no topo (aceitável).

## 8. Plano de testes (Vitest + React Testing Library)

- **Card clicável:** clique dispara `navigate('/musicas/:id', { state: { from } })`;
  `Enter`/`Espaço` também navegam; clique no remover, no seletor de versão e no grip
  **não** navegam (`stopPropagation`).
- **Hook `useScrollRestoration`:** com um elemento fake (jsdom não faz layout),
  validar salvar → restaurar → consumir (apagar) e o caminho "sem valor salvo → topo".
- **Manual / mobile 360px:** tocar no card abre a música; arrastar pelo grip ainda
  reordena; abrir o seletor de versão não navega; voltar (botão e sistema) restaura a
  posição de rolagem; música abre no topo.

## 9. Definition of Done (regras do projeto — `CLAUDE.md`)

- JSDoc em PT-BR em todo código novo/modificado (componentes, hook, callbacks de teste).
- `.claude/rules/frontend-react.md` atualizado: novo hook em `hooks/`, padrão de
  "card clicável que navega para detalhe" e nota sobre rolagem em container interno.
- `MEMORY.md` atualizado se o padrão de restauração de rolagem virar referência reutilizável.
- Sem mudança de API → `packages/backend/docs/openapi.json` permanece intacto.
- Responsividade verificada em 360px (mobile) e 1024px (desktop): sem overflow, sem
  largura fixa sem breakpoint, sem texto cortado.
- `npm test` verde em frontend.

## 10. Arquivos afetados

| Arquivo | Mudança |
|---|---|
| `packages/frontend/src/components/EventoDetail.tsx` | Card clicável (`onOpen` + `stopPropagation`), `handleOpenMusica`, uso de `useScrollRestoration`. |
| `packages/frontend/src/pages/SongDetail.tsx` | `scrollTop = 0` do container ao montar (abre no topo). |
| `packages/frontend/src/components/AppLayout.tsx` | Atributo `data-scroll-root` no div de rolagem. |
| `packages/frontend/src/hooks/use-scroll-restoration.ts` | **Novo** hook de salvar/restaurar rolagem. |
| `packages/frontend/src/**/__tests__` | Testes de navegação do card e do hook. |
