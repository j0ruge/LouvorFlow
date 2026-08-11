---
paths:
  - "packages/frontend/**"
---

# Frontend — Regras de Desenvolvimento

## Stack

| Tecnologia             | Uso                                  |
| ---------------------- | ------------------------------------ |
| React 18               | Biblioteca de UI                     |
| Vite 5                 | Build tool e dev server              |
| TypeScript 5           | Tipagem estática                     |
| TailwindCSS 3          | Estilização utilitária               |
| shadcn/ui + Radix UI   | Componentes de interface             |
| React Router 6         | Roteamento SPA                       |
| TanStack React Query 5 | Gerenciamento de estado servidor     |
| react-hook-form + Zod  | Formulários e validação              |
| Lucide React           | Ícones                               |
| Recharts               | Gráficos e visualizações             |
| Sora (Google Fonts)    | Tipografia oficial (display + body)  |

## Estrutura do Frontend

```text
packages/frontend/src/
├── components/
│   ├── ui/              # Componentes shadcn/ui (NÃO MODIFICAR DIRETAMENTE)
│   ├── form/            # Wrappers de ui/form.tsx (ex: FieldLabel, RequiredFieldsLegend) — customização sem tocar em ui/*
│   ├── AppLayout.tsx    # Layout principal (sidebar + header com UserMenu)
│   ├── AppSidebar.tsx   # Sidebar com menu domínio + seção admin condicional
│   ├── ProtectedRoute.tsx # Wrapper: redireciona ao login se não autenticado
│   ├── AdminRoute.tsx   # Wrapper: exibe 403 se não admin
│   ├── SuperAdminRoute.tsx # Wrapper: exibe 403 se não super-admin
│   ├── TenantSwitcher.tsx  # Dropdown para alternar entre igrejas
│   ├── UserMenu.tsx     # Avatar dropdown no header (perfil + logout)
│   └── ...              # Componentes de aplicação
├── contexts/
│   └── AuthContext.tsx   # AuthProvider + useAuth (estado global de auth)
├── pages/
│   ├── Login.tsx        # Tela de login
│   ├── ForgotPassword.tsx # Recuperação de senha
│   ├── ResetPassword.tsx  # Redefinição de senha via token
│   ├── SelectTenant.tsx   # Seleção de igreja (multi-tenant)
│   ├── Profile.tsx      # Perfil do usuário
│   ├── Forbidden.tsx    # Página 403 (Acesso Negado)
│   ├── admin/           # Páginas administrativas (requer role admin)
│   │   ├── Users.tsx, UserAcl.tsx, Roles.tsx, RolePermissions.tsx, Permissions.tsx
│   │   ├── Igrejas.tsx, IgrejaUsers.tsx
│   └── ...              # Páginas de domínio
├── hooks/               # Custom hooks
│   ├── use-auth.ts      # Re-export do useAuth do AuthContext
│   ├── use-profile.ts   # React Query hooks para perfil
│   ├── use-admin.ts     # React Query hooks para CRUD admin
│   ├── use-igrejas.ts   # React Query hooks para igrejas
│   ├── use-scroll-restoration.ts # Salva/restaura rolagem do container interno; abre páginas no topo
│   ├── use-focus-shortcut.ts # Atalho de teclado global (padrão "/") que foca/seleciona um input, com guardas de a11y
│   ├── use-dirty-form-guard.ts # Máquina de estados da guarda de alterações não salvas (veil "Descartar alterações?")
│   ├── use-undoable-delete.ts # Exclusão com janela de desfazer client-side (~5s): adia o DELETE, toast com "Desfazer", Set de pendentes filtra a lista
│   └── ...
├── services/
│   ├── auth.ts          # Chamadas API: login, logout, refresh, profile, password
│   ├── admin.ts         # Chamadas API: users, roles, permissions (CRUD admin)
│   ├── igrejas.ts       # Chamadas API: CRUD igrejas (super-admin)
│   └── ...
├── schemas/
│   ├── auth.ts          # Zod schemas: auth entities + form validation
│   └── ...
├── lib/
│   └── api.ts           # apiFetch com Authorization header + auto-refresh token
└── main.tsx             # Entry point
```

## Autenticação e Autorização (Frontend)

- **AuthContext** (`contexts/AuthContext.tsx`): Provider global de autenticação. Expõe `user`, `isAuthenticated`, `isAdmin`, `signIn`, `signOut`, `updateUser` via hook `useAuth()`.
- **Token storage**: Access token em memória (variável JS). Refresh token em `localStorage`. Nunca armazenar access token em localStorage.
- **Auto-refresh**: `apiFetch` intercepta 401, tenta refresh via singleton promise (evita race conditions com token rotation). Se refresh falha, limpa tokens e redireciona ao login.
- **Rotas protegidas**: Usar `<ProtectedRoute>` para rotas que exigem autenticação. Usar `<AdminRoute>` dentro de `ProtectedRoute` para rotas que exigem role "admin".
- **Rotas públicas**: `/login`, `/esqueci-senha`, `/redefinir-senha`, `/selecionar-igreja`, `/convite/:token` não usam `ProtectedRoute`.
- **Sidebar RBAC**: Todos os itens de domínio visíveis para qualquer autenticado. Seção "Administração" visível apenas para `isAdmin`.
- **Multi-tenant**: `currentTenant: { id, name } | null` disponível no AuthContext. Definido no login, seleção de tenant e troca de tenant.
- **SelectTenantPage** (`/selecionar-igreja`): Exibida quando o login retorna `requires_tenant_selection` (usuário pertence a múltiplas igrejas).
- **TenantSwitcher**: Dropdown na sidebar para usuários multi-tenant alternarem entre igrejas. Chama `switchTenant()` na API.
- **SuperAdminRoute**: Wrapper de rota que exibe página 403 se o usuário não possui role `super-admin`. Usado para rotas de gestão de igrejas.
- **UserMenu**: Avatar no header → dropdown com nome, e-mail, "Meu Perfil" e "Sair".

## Design System

O design system completo (tokens, cores, tipografia, padrões de progressive disclosure, adaptações mobile) está documentado em:

- **`packages/frontend/.interface-design/system.md`** — Referência canônica para decisões visuais e de interação.

Consultar esse arquivo antes de criar novos componentes ou alterar padrões de UI existentes.

## Regras Obrigatórias

- **Componentes `ui/`**: São gerados pelo shadcn/ui. Nunca editar diretamente. Para customização, criar wrappers em `components/`.
- **Estilização**: Usar TailwindCSS. Evitar CSS inline ou arquivos `.css` customizados.
- **Formulários**: Usar `react-hook-form` com resolvers `Zod` para validação.
- **Requisições HTTP**: Usar `TanStack React Query` para fetching, caching e sincronização com a API.
- **Roteamento**: Usar `react-router-dom` v6. Páginas ficam em `pages/`.
- **Ícones**: Usar `lucide-react`. Não importar ícones de outras bibliotecas.
- **Toasts/Notificações**: Usar exclusivamente **Sonner** (`import { toast } from "sonner"`). Não usar o sistema de toast do Radix/shadcn (`useToast`, `toaster.tsx`, `toast.tsx`). O componente `<Toaster />` do Sonner já está montado em `App.tsx`. Futuramente o projeto migrará para React Native com `sonner-native`, que possui a mesma API.

## Formulários — Campos Obrigatórios, Erro de Validação e Destaque de Item Novo

- **Padrão único de formulário em overlay**: `ResponsiveFormDialog` + `ui/form.tsx` (`FormField`/`FormItem`/`FieldLabel`/`FormControl`/`FormMessage`) com resolver Zod — nunca `Dialog*` cru com `register(...)` e `<p>` de erro manual. `<Form {...form}>` fica **por fora** do `ResponsiveFormDialog` (o contexto do react-hook-form atravessa o portal); `useForm` sempre com `defaultValues` (sem eles `formState.isDirty` não é confiável e a guarda de alterações não salvas dispara errado); `RequiredFieldsLegend` como primeiro children; botões na prop `footer` (Cancelar → `guarda.pedirFechamento()`). Telas admin migradas: `Users.tsx`, `Roles.tsx`, `Permissions.tsx`, `Igrejas.tsx` (2 formulários → 2 dialogs + 2 guards) e `IgrejaUsers.tsx`. **Exceção sem RHF**: `IgrejaUsers.tsx` (Select + `useState`) usa o mesmo `ResponsiveFormDialog` com `onSubmit` manual (`preventDefault` + handler da mutation), guard protegendo o estado local (`temAlteracoes: selectedUserId !== ""`) e o indicador de obrigatório replicado sobre `Label` puro (o `FieldLabel` exige o contexto do RHF e quebraria fora dele).
- **Campo obrigatório**: usar `FieldLabel` (`components/form/FieldLabel.tsx`) no lugar de `FormLabel` puro quando o campo for obrigatório — wrapper que adiciona `required` e renderiza o asterisco decorativo (`aria-hidden`) + texto `sr-only` "(obrigatório)" para leitores de tela. No topo do formulário, incluir `RequiredFieldsLegend` (`components/form/RequiredFieldsLegend.tsx`) explicando a convenção ("* campo obrigatório"). Nenhum dos dois modifica `ui/form.tsx`. Além do rótulo, o **controle** recebe `aria-required` explícito (o `FormControl` entrega `id`/`aria-invalid`/`aria-describedby` de graça, mas não `aria-required`). Um formulário **sem nenhum campo obrigatório** (ex.: `VersaoForm`, onde tudo é opcional) não recebe legenda — "* campo obrigatório" sem nenhum asterisco na tela só confundiria.
- **Foco no primeiro inválido e limpeza do erro ao digitar** são defaults do react-hook-form (`shouldFocusError` e `reValidateMode: "onChange"`): não reimplementar — apenas cobrir com teste quando a tela for migrada (referência: `src/pages/admin/__tests__/Users.form.test.tsx`).
- **Dívida conhecida de a11y (registrada, NÃO corrigir de passagem)**: `CreatableCombobox`, `CreatableMultiCombobox`, `IntensidadeSelector` e `DateTimePicker` **descartam silenciosamente** o `id`, `aria-invalid` e `aria-describedby` que o `FormControl` injeta via `Slot` (nenhum aceita/encaminha essas props ao controle interno; `CreatableCombobox` nem é `forwardRef`) — o mesmo vale para um eventual `aria-required`. `shouldFocusError` também não os alcança (não há ref de foco registrada). Consequência: campos com esses controles não anunciam erro/obrigatoriedade a leitores de tela nem recebem foco no primeiro inválido. Corrigir exige refatorar cada componente para `forwardRef` + repasse de props — fora do escopo da fase de campos obrigatórios; tratar como tarefa própria.
- **Erro de validação nos campos**: `input`/`textarea`/`select`/`button` com `aria-invalid="true"` (já setado automaticamente por `FormControl` de `ui/form.tsx` quando há erro do react-hook-form) recebem borda e `box-shadow` destructive via regra única em `@layer components` (`src/index.css`) — não é necessário aplicar classes destructive manualmente por campo.
- **Destaque de item recém-criado/atualizado**: classe `motion-safe:animate-highlight-new motion-reduce:ring-2 motion-reduce:ring-primary/40` (animação `highlight-new` de `tailwind.config.ts`, box-shadow âmbar que decai em 2s, roda uma vez). Respeita `prefers-reduced-motion` com o fallback estático em `motion-reduce:`. Primeiro consumidor: `ConfigCrudSection.tsx`. O estado que guarda o alvo do destaque (`recemCriado`) armazena o **nome normalizado** (`normalizeForSearch`), não o id — `onCreate` devolve `Promise<void>` e não expõe o id criado, e o bloqueio de duplicado (abaixo) já garante que o nome normalizado é chave única. `useEffect` dispara `setTimeout(2000)` para limpar o estado, com `clearTimeout` no cleanup (unmount ou nova criação antes do timer anterior expirar). Trade-off aceito: o timer começa quando o `await onCreate(...)` resolve, e o item só ganha a classe quando aparece na lista vinda do componente pai (após o refetch da query); numa rede lenta, parte da janela de 2s passa antes de o item existir no DOM. **Outro trade-off, cosmético e raro**: como o backend só bloqueava duplicado por caixa antes desta checagem client-side existir, um par legado que difere só por acento (ex.: "Adoração" e "Adoracao", cadastrados antes do bloqueio client-side) faz `normalizeForSearch` casar as duas linhas — o destaque acende nas duas por 2s em vez de só na recém-criada. Não há como diferenciar sem o id (que `onCreate` não expõe); aceito porque o cenário é legado e o efeito é puramente visual.
- **Duplicado no cliente antes da mutation** (`ConfigCrudSection.tsx`, formulário de criação): checagem com `normalizeForSearch` (remove acento E caixa) contra os `items` atuais antes de chamar `onCreate`, complementar ao bloqueio 409 case-insensitive do backend — evita a ida-e-volta de rede para o erro de digitação mais comum. Estado `erroCriacao: string | null`; mensagem renderizada **abaixo do input com `w-full`** (o container é `flex flex-wrap` — sem `w-full` a mensagem não quebra linha a 360px) e associada ao `Input` via `aria-invalid`/`aria-describedby` (a regra CSS global do `aria-invalid="true"` já pinta a borda, sem precisar de classe destructive manual). Erro limpa ao digitar (`onChange`) e ao tentar de novo (`handleCreate` recalcula a cada chamada, inclusive via Enter). **Escopo consciente**: só o formulário de criação valida — o rename inline não tem a mesma checagem (lacuna registrada, não coberta nesta fase). **Concordância de gênero**: `EntityConfig.genero: "m" | "f"` (declarado nas 5 configs de `Settings.tsx`) escolhe o artigo certo na mensagem ("um"/"uma") e no placeholder do formulário ("Novo"/"Nova") — um hedge tipo "um(a)" soa claramente errado para rótulos de gênero fixo como "Categoria"/"Função"/"Tonalidade" ("uma categoria", nunca "um categoria"); só "Artista" tem gênero ambíguo de fato (a pessoa referenciada pode ser de qualquer gênero), e mesmo assim o campo exige escolher um valor fixo — "m" por convenção.
- **Atalho de foco na busca**: `useFocusShortcut(ref, tecla = "/")` (`hooks/use-focus-shortcut.ts`) foca e seleciona o conteúdo de um input ao pressionar a tecla configurada. Ignora o atalho com foco em campo editável, com modificador (Ctrl/Cmd/Alt — evita colidir com o Ctrl/Cmd+B da sidebar) pressionado, com `event.repeat`, ou quando há `[role="dialog"][data-state="open"]` na página. Helper `isElementoEditavel` exportado para teste isolado. Ligado em `Songs.tsx` (busca de músicas), com dica visual `<kbd>` `hidden sm:flex` sobreposta ao input (mobile não tem teclado físico).
- **Linha de resultados e filtros ativos removíveis** (`Songs.tsx` + `MusicaFiltros.tsx`): com algum filtro ativo (`hasFilters`), uma linha visível mostra a contagem real via **`meta.total`** — nunca `songs.length`, que é o tamanho da página atual (teto `ITEMS_PER_PAGE`). `role="status"`/`aria-live="polite"`/`aria-atomic="true"` ficam só no `<span>` da contagem (substituindo o antigo anúncio `sr-only` — mantê-lo junto duplicaria o anúncio), nunca no `<div>` que também contém os badges: os badges são botões interativos, e uma live region no container pai re-anunciaria a linha inteira a cada clique num badge (ruído). Ao lado, `MusicaFiltrosAtivos` (badges removíveis + "Limpar filtros") é alimentado por `descreverFiltrosAtivos(props): FiltroAtivo[]`, que resolve cada intensidade/categoria ativa para um rótulo humano (mesma ordem visual dos grupos em `MusicaFiltrosChips`: intensidade antes de categoria) e omite ids de categoria que não existem mais em `categorias` (link antigo, categoria excluída — sem rótulo humano para exibir). O gate de exibição do componente usa a **contagem crua** (`categoriaIds.length + intensidades.length`), nunca `descreverFiltrosAtivos().length`: como `Songs.tsx` mantém na URL qualquer UUID bem-formado de categoria mesmo inexistente, usar a contagem resolvida deixaria o usuário preso num resultado vazio sem badge e sem botão para limpar o filtro inválido — o botão "Limpar filtros" nunca fica `disabled` dentro do componente (o gate acima já cobre o único caso em que ele deveria sumir). Cada badge é o **pill inteiro clicável** (`<button aria-label="Remover filtro X">`), não um badge inerte com "x" aninhado como em `MusicaDetail.tsx`/`IntegranteForm.tsx` — decisão deliberada para atingir uma área de toque maior a 360px (`min-h-[32px] px-3 py-1.5`, "Limpar filtros" com `size="sm"` padrão/36px, sem overrides que encolham); a pista visual de remoção fica no `hover:text-destructive hover:border-destructive/40` em vez do "x" separado. Removeu um filtro (badge ou "Limpar filtros") sempre desmonta o elemento clicado — a prop opcional `aoRemover` dá ao consumidor a chance de mover o foco para outro lugar prévisível (`Songs.tsx` foca `searchRef`, a busca, protagonista da página) sem que `MusicaFiltrosAtivos` precise conhecer esse alvo (Lei de Demeter). `limparTudo()` (CTA do zero-result com filtros) zera `searchInput` explicitamente em vez de confiar no efeito de sincronização com a URL — um debounce de busca ainda pendente reescreveria `q` depois da limpeza (acoplamento temporal); `limparFiltros()` (usado pelo Drawer mobile) permanece intocado, sem tocar em `q`.
- **Formulário multi-modo: modo DERIVADO de props, nunca booleanos acumulados**: quando um mesmo formulário atende mais de um fluxo (ex.: `EventoForm` com criar/editar/duplicar), o modo é uma união derivada das props (`evento` → `"editar"`; `duplicarDe` → `"duplicar"`; senão `"criar"`), com os textos (título/descrição/CTA) num `Record<Modo, …>` — nunca flags `isEditing`/`isDuplicating` combinadas à mão. Os campos, o select com seus estados de erro e a validação Zod ficam num único componente; cada modo só muda reset (`duplicar` pré-preenche tipo/descrição da origem e deixa `data: ""` — o usuário revisa a data) e branch de submit. **Rascunho de escala (F13)**: em vez de um quarto modo, o modo criação ganha apenas um botão secundário "Salvar rascunho" que submete o MESMO formulário (mesmo resolver Zod) com `status: "rascunho"` — decisão KISS registrada na docstring do `EventoForm`. Rascunhos aparecem SÓ na aba Rascunhos de `Escalas.tsx` (com `Badge variant="outline" className="border-dashed"` e ação "Publicar" = `PUT { status: "publicada" }`, com confirmação "Publicar sem repertório?" quando o rascunho tem zero músicas — o diálogo tem 3 ações e a primeira é um "Cancelar" NEUTRO (`AlertDialogCancel` puro): no touch não há Esc e o Radix ignora tap no backdrop, então todo diálogo de decisão precisa de uma saída que não execute nada); `Dashboard.tsx`, `History.tsx` e as abas Próximas/Passadas filtram por `status === "publicada"`. O schema frontend usa `EventoStatusSchema.default("publicada")` (defensivo para janela de deploy em que o backend ainda não envia o campo).
- **Guarda de alterações não salvas**: formulários em `ResponsiveFormDialog` usam `useDirtyFormGuard` (`hooks/use-dirty-form-guard.ts`) + `DiscardChangesVeil` (`components/DiscardChangesVeil.tsx`). O hook é uma máquina de estados que **não importa react-hook-form** — só um boolean (`temAlteracoes: form.formState.isDirty`) e callbacks atravessam a fronteira (Lei de Demeter); serve também a páginas sem RHF. **Não incluir `!isPending` em `temAlteracoes`**: o guard fica armado durante submit pendente de propósito — se desarmasse, Esc/backdrop durante o in-flight fechariam sem confirmação e uma mutation que falha perderia o digitado; o caminho feliz não precisa do desarme porque o `onSuccess` fecha via `onOpenChange(false)` do pai (não passa pelo guard) e o `reset()` derruba `temAlteracoes`, fechando o veil sozinho. O callback opcional `aoDescartar` (ex.: limpar rascunho) roda **no máximo uma vez por exibição do veil** — o hook guarda a idempotência contra duplo clique em "Descartar". O hook também é o dono do foco do veil: captura `document.activeElement` no momento do EVENTO (`pedirFechamento`, antes do `inert` roubar o foco — em browser real isso acontece antes de qualquer effect) e restaura no falling edge de `veilAberto`. O formulário passa o guard na prop `dirtyGuard` do `ResponsiveFormDialog` (sem a prop, comportamento intacto) e o botão "Cancelar" do rodapé chama `guarda.pedirFechamento()` em vez de `onOpenChange(false)` — é a quarta saída, que não passa pelo `onOpenChange` do overlay. Com alterações, Esc/backdrop/X/Cancelar exibem o `DiscardChangesVeil` (`role="alertdialog"`, camada `absolute inset-0` dentro do content — **não** um segundo `Dialog`) com o irmão `inert` + `aria-hidden`; o wrapper do formulário é um `<div>` **incondicional** (só o spread de atributos inertes é condicional — trocar o tipo de elemento desmontaria a subárvore e apagaria o digitado). No mobile o guard força `dismissible={false}` no `Drawer` (vaul) e intercepta em `onEscapeKeyDown`/`onPointerDownOutside` do `DrawerContent` (com `dismissible` o swipe fecharia sem `resetDrawer()`, e sem `dismissible` o vaul engole o `onOpenChange`); custo aceito: swipe-down inerte com o guard ativo. **Exceção**: `MusicaForm` só liga o guard no modo edição — no modo criação a proteção é o rascunho do `useFormDraft` ("Recuperar rascunho?"); somar o veil ali seria fazer duas perguntas contraditórias. Ligado em `MusicaForm` (edição), `EventoForm`, `IntegranteForm`, `VersaoForm` e nas telas admin: `Users.tsx`, `Roles.tsx`, `Permissions.tsx`, `Igrejas.tsx` (guard de criação e guard de edição — o `aoFechar` do de edição também limpa `editingIgreja`) e `IgrejaUsers.tsx` (sem RHF: `temAlteracoes: selectedUserId !== ""`). Nos formulários de criação com defaults estáticos, o `form.reset()` fica dentro do **`aoFechar`** (não do `aoDescartar`): todo fechamento limpa o formulário — inclusive o fechamento "limpo" após submit inválido, em que `isDirty` é false mas `formState.errors` persistiria (a página não desmonta o form) e reabrir mostraria erros fantasma. É idempotente com o formulário limpo.

## Segurança — Prevenção de XSS (Cross-Site Scripting)

- **URLs dinâmicas em `href`**: Nunca renderizar URLs vindas da API diretamente em atributos `href` de `<a>`. Protocolos como `javascript:`, `data:` e `vbscript:` permitem execução de código arbitrário ao clicar no link (Stored XSS).
- **Validação obrigatória**: Toda URL dinâmica deve ser validada com `isSafeUrl()` de `@/lib/utils` antes de ser usada em `href`, `window.open()` ou `location.href`.
- **Defesa em profundidade**: Aplicar validação em duas camadas:
  1. **Schema Zod** — usar `.refine()` para aceitar apenas `http://` ou `https://` nos schemas de resposta da API e de formulários.
  2. **Renderização** — usar `isSafeUrl(url)` como guarda condicional antes de renderizar o elemento `<a>`.
- **`dangerouslySetInnerHTML`**: Evitar. Se necessário, nunca incluir dados fornecidos pelo utilizador sem sanitização.

## Elegância — Prioridade Máxima

<CRITICAL>
A elegância visual é o valor mais importante nas decisões de UI/UX. Sempre preferir a abordagem mais elegante, mesmo que exija mais esforço. Consultar `packages/frontend/.interface-design/system.md` (seção "Princípio de Elegância") para diretrizes completas.
</CRITICAL>

## Responsividade Mobile — Regras Obrigatórias

<CRITICAL>
O app é usado primariamente em dispositivos móveis. Todo código novo ou modificado DEVE seguir os padrões mobile-first documentados em `packages/frontend/.interface-design/system.md` (seção Mobile Adaptations).
</CRITICAL>

### Padrões obrigatórios para todo componente novo/modificado

1. **Inputs e Selects inline**: Usar `w-full sm:w-XX` — nunca largura fixa sem breakpoint.
2. **Flex rows com múltiplos elementos**: Usar `flex flex-col gap-2 sm:flex-row sm:items-center` ou `flex flex-wrap`.
3. **Texto dinâmico** (nomes, títulos de API): Usar `truncate` com `min-w-0` no container pai para textos curtos. Para títulos/nomes que podem ser longos (ex: nome de música em página de detalhe), preferir `line-clamp-2` para permitir até 2 linhas antes de truncar — mais legível que cortar em 1 linha. Sempre garantir `min-w-0` + `overflow-hidden` em toda a cadeia de containers flex pai.
4. **Botões de ação em rows**: Sempre `flex-shrink-0` para não comprimir.
5. **Container padding**: `p-4 sm:p-6` (AppLayout já implementa — não sobrescrever com `p-6` fixo em subcomponentes).
6. **Overflow guard**: Containers principais devem ter `overflow-x-hidden`.
7. **Tabelas de dados**: Usar dual layout — cards empilhados no mobile (`sm:hidden`) + `<Table>` no desktop (`hidden sm:block`). Nunca depender de scroll horizontal.
8. **Overlays com conteúdo alto** (calendários, listas longas, filtros): Usar `Drawer` (bottom sheet) no mobile e `Popover` no desktop. Detectar com `useIsMobile()`. Nunca usar Popover no mobile para conteúdo que exceda ~300px de altura — causa overflow/corte. Nunca renderizar conteúdo inline que desloque campos abaixo — preferir overlay. Extrair conteúdo compartilhado em subcomponente para evitar duplicação. Referência: `DateTimePicker.tsx`, `MusicaFiltros.tsx` (filtros da lista de músicas).
9. **Ícones de confirmação de seleção**: Em botões ao lado de um Select/Combobox que confirmam a escolha (adicionar item selecionado), usar `CornerDownLeft` (↵) em vez de `Plus` (+). Reservar `Plus` apenas para criar novos itens.
10. **Placeholders em Select/Combobox**: Sempre usar `truncate` no span do placeholder. Textos longos como "Todas as músicas já foram adicionadas" transbordam sobre botões adjacentes em telas estreitas. Referência: `CreatableCombobox.tsx` linha 161.
11. **Botões de ação com labels**: No mobile, usar `hidden sm:inline` nos labels de texto e manter apenas o ícone visível. Garantir `aria-label` para acessibilidade. Exemplo: `<Pencil className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Editar</span>`.
12. **Cards com informação densa** (música com nome + tonalidade + versão + ações): Separar em 2 linhas — 1ª linha: nome + ação de remoção; 2ª linha: badges/metadata com padding-left alinhado ao nome. Usar `items-start` (não `items-center`) quando o nome pode quebrar em `line-clamp-2`.
13. **Integrantes com funções/badges**: Nome + botão de remoção na 1ª linha, badges de função em linha separada com `flex-wrap` e padding-left alinhado ao nome.
14. **Formulários em overlay**: Usar **`ResponsiveFormDialog`** (`components/ResponsiveFormDialog.tsx`) — renderiza `Drawer` (bottom-sheet) no mobile e `Dialog` no desktop via `useIsMobile()`, com **header fixo + corpo rolável + footer fixo (sticky)** limitado à altura da viewport. Nunca colocar um formulário alto num `Dialog` centralizado puro: no mobile o `Dialog` é `position: fixed` centralizado e **não reage ao teclado virtual** — o botão de ação some atrás do teclado/barra do navegador e o campo em foco fica encoberto. O `Drawer` (vaul, `repositionInputs` por padrão) reposiciona o campo focado acima do teclado. Passar os `FormField` como `children` e os botões via prop `footer`; envolver com `<Form {...form}>` por fora (o contexto do react-hook-form atravessa o portal). Referência: `MusicaForm.tsx`.

### Padrão de referência (modelo correto)

```typescript
{/* Header com ações — empilha no mobile, inline no desktop */}
<div className="flex flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between">
  <div className="flex items-center gap-3">...</div>
  <Button>Ação</Button>
</div>

{/* Form inline — inputs full-width no mobile */}
<div className="flex flex-wrap items-center gap-2">
  <Input className="h-8 w-full sm:w-48" />
  <SelectTrigger className="h-8 w-full sm:w-32" />
  <Button size="sm">✓</Button>
</div>

{/* Item row — texto trunca, botões não comprimem */}
<div className="flex items-center justify-between gap-2">
  <div className="flex items-center gap-2 sm:gap-3 min-w-0">
    <Icon className="h-4 w-4 flex-shrink-0" />
    <span className="font-medium truncate">{dynamicText}</span>
  </div>
  <div className="flex items-center gap-1 flex-shrink-0">
    <Button variant="ghost" size="sm">...</Button>
  </div>
</div>

{/* Dual layout: Cards mobile / Table desktop */}
<div className="space-y-3 sm:hidden">
  {items.map((item) => (
    <div key={item.id} className="p-4 rounded-lg border border-border space-y-3">
      <div className="flex items-center justify-between gap-2">
        <span className="font-medium truncate">{item.name}</span>
        <Badge className="flex-shrink-0">{item.count}</Badge>
      </div>
      <p className="text-sm text-muted-foreground">{item.description}</p>
      <Button variant="outline" size="sm" className="w-full">Ação</Button>
    </div>
  ))}
</div>
<div className="hidden sm:block">
  <Table>...</Table>
</div>
```

### Páginas já corrigidas

| Arquivo | Correção aplicada |
|---|---|
| `MusicaDetail.tsx` | Edit overflow + truncate + flex-wrap + responsive gaps |
| `AppLayout.tsx` | Padding responsivo `p-4 sm:p-6` + overflow-x-hidden |
| `EventoDetail.tsx` | Layout 2 linhas em cards (nome+ação / metadata), icon-only buttons, items-start com line-clamp-2; card de música clicável (navega ao detalhe) |
| `EscalaShareActions.tsx` | Labels com `hidden sm:inline` para icon-only no mobile |
| `CreatableCombobox.tsx` | `truncate` no span do placeholder para evitar overflow sobre botão adjacente |
| `ConfigCrudSection.tsx` | flex-wrap form + gap + truncate nomes |
| `Dashboard.tsx` | grid-cols-2 stats + responsive gaps + truncate |
| `admin/Roles.tsx` | Dual layout cards/table + header responsivo |
| `admin/Users.tsx` | Dual layout cards/table + header responsivo |
| `Escalas.tsx` | Header `flex-col items-start gap-3 sm:flex-row sm:items-center sm:justify-between` (padrão de referência) + `min-w-0` no bloco de título; `aria-label` na busca; badge de tipo com `truncate max-w-[10rem]` |
| `IntegranteForm.tsx` | flex-wrap no select+button de funções; migrado para `ResponsiveFormDialog` |
| `DateTimePicker.tsx` | Drawer (mobile) / Popover (desktop) + botões Confirmar/Cancelar |
| `ResponsiveFormDialog.tsx` | Shell de formulário: Drawer (mobile) / Dialog (desktop), header fixo + corpo rolável + footer sticky; corrige botão Salvar escondido e campo em foco atrás do teclado |
| `MusicaForm.tsx` / `VersaoForm.tsx` / `EventoForm.tsx` | Migrados para `ResponsiveFormDialog` (bottom-sheet no mobile) |
| `admin/Igrejas.tsx` | Dual layout cards/table + header responsivo + `Button asChild` no lugar de `<Link><Button>` |
| `admin/IgrejaUsers.tsx` | Dual layout cards/table + truncate em nome/e-mail + `Button asChild` nos 3 botões de voltar |
| `GruposFuncoesSection.tsx` | Grip de arraste `w-11 h-11` (44px) já no mobile + anúncios do dnd-kit em PT-BR |
| `DateTimePicker.tsx` | `aria-label` "Hora"/"Minuto" nos selects (o rótulo "Horário:" não estava associado) |
| `CifraclubPlaylistDialog.tsx` | `aria-label` no gatilho icon-only |
| `MusicaVersaoPicker.tsx` | `truncate max-w-[10rem]` no rótulo do badge (nome de artista é texto livre) |
| `Songs.tsx` + `MusicaFiltros.tsx` | Filtros colapsáveis no mobile: chips de intensidade/categoria atrás do botão "Filtros" (Drawer bottom-sheet) com contador de ativos e "Limpar filtros"; desktop mantém chips inline; busca protagonista a 360px |
| `Songs.tsx` + `MusicaFiltros.tsx` | Linha de resultados (`meta.total` + badges removíveis de `MusicaFiltrosAtivos`) em `flex-wrap` — contagem, termo de busca entre aspas e badges quebram linha a 360px em vez de gerar overflow horizontal |
| `Dashboard.tsx` | `CardHeader` título+botão: `min-w-0`+`truncate` no `CardTitle`, botão `flex-shrink-0` com label `hidden sm:inline` + `aria-label` (ícone puro no mobile); tag de tipo com `truncate max-w-[7rem]` |
| `admin/IgrejaUsers.tsx` | `line-clamp-2` no `h1` com o nome da igreja (texto livre de até 255 chars) |
| `Dashboard.tsx` / `History.tsx` / `Escalas.tsx` | Anatomia da linha de evento unificada em `EventoRow.tsx` (`flex-wrap` joga as ações para a própria linha a 360px); `HistorySkeleton` reescrito para o mesmo formato de linha |
| `admin/Users.tsx` / `admin/Roles.tsx` / `admin/Permissions.tsx` / `admin/Igrejas.tsx` / `admin/IgrejaUsers.tsx` | Formulários migrados de `Dialog` cru para `ResponsiveFormDialog` (bottom-sheet no mobile) com `FieldLabel required` + `RequiredFieldsLegend` + `aria-required` e guarda de alterações não salvas |
| `MusicaTomPicker.tsx` | Popover com grid de tons (`grid grid-cols-3 gap-2 max-h-[50vh] overflow-y-auto`, `PopoverContent w-64 max-w-[calc(100vw-2rem)] p-3`) em vez de lista vertical — um tenant com 24 tons (seed padrão) em coluna única estouraria a altura do S8; itens `min-h-11` (44px) |
| `Escalas.tsx` | F13: 3 abas (`Próximas/Passadas/Rascunhos`) com `flex-1 px-2 sm:px-3` cabem em 360px; 4º botão da fileira de ações (Duplicar) icon-only no mobile (`hidden sm:inline` + `aria-label` interpolando o título); zero-result da busca trunca o termo em 40 chars antes de interpolar (termo sem espaços estouraria 360px) |
| `History.tsx` | Botão Duplicar (icon-only no mobile) ao lado de Detalhes no slot `acoes` — ambos `w-full sm:w-auto` dividem a largura da linha a 360px |
| `EmptyState.tsx` | `break-words` na descrição — descrições podem interpolar texto do usuário sem espaços (ex.: termo de busca no zero-result) |

### Popover com muitas opções: grid + tile em vez de lista vertical

`MusicaTomPicker.tsx` (irmão de `MusicaVersaoPicker.tsx`, seleção de tom por música na escala) é a referência para overlays com **muitas** opções curtas (tons musicais, poucos caracteres cada): em vez da lista vertical de `RadioGroupItem` + `Label` lado a lado (padrão de `MusicaVersaoPicker.tsx`, adequado para poucas opções com texto longo, como nomes de artista), usa um `grid grid-cols-3 gap-2 max-h-[50vh] overflow-y-auto` de "tiles" — cada opção é um `Label` estilizado como botão (`min-h-11`, destaque `border-primary bg-primary/10` quando selecionado) envolvendo um `RadioGroupItem` com `className="sr-only"` (o clique no `<label>` visível é repassado ao input oculto pelo comportamento nativo do HTML; testado em e2e com `page.getByText(tom, { exact: true }).click()`, funciona igual com toque). Com o seed padrão de 24 tonalidades, uma lista vertical estouraria a altura do S8 (740px); o grid de 3 colunas cabe em poucas linhas.

### Ações destrutivas exigem confirmação

Toda ação destrutiva passa por **`DeleteConfirmDialog`** — nunca dispara direto do `onClick`. A confirmação permanece **mesmo nas exclusões que ganharam janela de desfazer** (ver seção seguinte). Vale também para o que não é "excluir" no nome, mas tem efeito equivalente:

- **Desativar igreja** (`admin/Igrejas.tsx`): bloqueia login e renovação de sessão de todos os membros daquela igreja. Reativar é inócuo e segue imediato — só o lado destrutivo confirma.
- **Desvincular usuário de igreja** (`admin/IgrejaUsers.tsx`): remove o vínculo e, em cascata, as roles e permissões daquele usuário no tenant.

A descrição do diálogo deve dizer **o que se perde**, não apenas "esta ação não pode ser desfeita", e identificar o alvo pelo nome.

### Exclusão com desfazer (undo client-side)

As exclusões de **Escalas**, **Integrantes** e das entidades auxiliares de **Configurações** usam `useUndoableDelete` (`hooks/use-undoable-delete.ts`): a confirmação do `DeleteConfirmDialog` **permanece**, mas o DELETE real é adiado ~5s enquanto um toast com a ação "Desfazer" está visível. Regras do padrão:

1. **Mutation silenciosa**: os hooks de delete (`useDeleteEvento`, `useDeleteIntegrante`, `useDeleteArtista` e os 4 deletes de `use-support.ts`) aceitam `{ silent?: boolean }` — com `silent: true` o toast de sucesso do hook é suprimido (o feedback é o toast com "Desfazer"); o `toast.error` permanece. Parâmetro opcional: call sites existentes (ex.: `EventoDetail.tsx`) seguem intactos com o toast padrão.
2. **`Set` local de pendentes, nunca mutação do cache do React Query**: a lista renderizada filtra por `!estaPendente(id)`. Mexer no cache seria frágil (qualquer `invalidateQueries` de outra mutation traria o item de volta no meio da janela); com o `Set`, o item restaura na posição original de graça — a ordem da lista real nunca foi tocada.
3. **"Desfazer" não emite segundo toast**: o item reaparecer na lista É o feedback. **Desfazer tardio**: o sonner pausa o countdown do toast no hover, mas o `setTimeout` do hook não — se o clique chegar depois do DELETE ter iniciado (id já fora do Map), o hook emite `toast.error("A exclusão já foi concluída e não pôde ser desfeita.")` e NÃO restaura o item (restaurar causaria flicker no refetch).
4. **`await` no DELETE antes de desmarcar** (`finally`): evita o item "piscar" de volta entre o DELETE e o refetch. Quando o DELETE inicia (timer ou flush), o toast correspondente é dispensado via `toast.dismiss(toastId)` — sem "Desfazer" morto sobrando na tela.
5. **Flush no desmonte**: trocar de rota (ou de aba em Configurações — o `TabsContent` desmonta) cancela os timers, dispensa os toasts (o toaster do sonner é global e sobreviveria à navegação) e dispara imediatamente o DELETE dos pendentes. **Risco aceito (D2)**: fechar a aba do navegador dentro da janela perde o DELETE — o item reaparece no próximo load.
6. **Copy do diálogo**: onde há undo, a descrição diz "Você poderá desfazer nos próximos segundos." em vez de "Essa ação não pode ser desfeita." — ajustado no **ponto de uso**, nunca no `DeleteConfirmDialog` global (telas sem undo, como `admin/IgrejaUsers.tsx`, mantêm a copy de irreversibilidade).
7. **Undo NÃO se aplica a Igrejas**: desativação é reversível por natureza (botão "Reativar"). Ali a fase F9 corrigiu apenas o toast duplicado — a tela `admin/Igrejas.tsx` **não** toca `toast`; o aviso (com copy específica "desativada"/"reativada"/"atualizada" derivada de `data.status`) vive só em `useUpdateIgreja`.

### Arraste (dnd-kit) — checklist de acessibilidade

Todo `DndContext` precisa de:

1. **`KeyboardSensor`** com `sortableKeyboardCoordinates` junto de Pointer/Touch — sem ele a reordenação é inacessível por teclado.
2. Prop **`accessibility`** com `screenReaderInstructions` e `announcements` em PT-BR — o padrão do dnd-kit é em inglês.
3. Anúncios que resolvam o **id para um rótulo humano**. Os ids do projeto são UUIDs; anunciar o id cru não diz nada a quem usa leitor de tela. Ver `EventoDetail.tsx` (`acessibilidadeArraste`, que mapeia id → nome da música).
4. **`aria-label` por item**, interpolando o nome (`Arrastar ${nome} para reordenar`, `Remover ${nome}`) — rótulos genéricos se repetem em todos os cards e não identificam o alvo.
5. Grip de arraste **`w-11 h-11` (44px) já no mobile**, sem reduzir para `w-8` — 44px é o alvo mínimo de toque, e o mobile é o alvo primário.

### Listas com card memoizado: callbacks por ID

Páginas que re-renderizam a cada tecla (busca, campo de criação) e renderizam uma lista de cards com hooks próprios (`useSortable`, mutations) devem envolver o card em `memo`. O `memo` só funciona se as props de callback forem **estáveis**, então o callback recebe o **ID** e é criado uma vez com `useCallback` no pai — em vez de uma arrow por item, que muda de identidade a cada render e anula a memoização.

Referências: `EventoDetail.tsx` (`SortableMusicaCard` + `handleRemoveMusica`/`handleOpenMusica`) e `GruposFuncoesSection.tsx` (`SortableGrupoCard` + `handleRenameGrupo`/`handleSetFuncoesDoGrupo`).

Cuidado com a ordem: os `useCallback`/`useMemo` precisam ficar **antes** dos early returns (`if (isLoading) return …`) e depois das variáveis que aparecem no array de dependências — o array é avaliado na hora, então referenciar um `const` declarado abaixo dá `ReferenceError` de TDZ que o `tsc` não pega.

### Tipos do dnd-kit vêm da biblioteca

O objeto passado em `accessibility` deve ser tipado com `satisfies Announcements` (`@dnd-kit/core`), nunca com shapes escritos à mão como `{ active: { id: string | number } }`. Assim uma mudança de forma numa futura versão vira erro de compilação em vez de anúncio silenciosamente errado.

### Filtros vindos da URL: validar antes de enviar

Parâmetros de filtro lidos de `searchParams` são entrada não confiável (link velho, editado à mão, colado). Descartar token inválido no cliente em vez de repassá-lo: o backend responde 400 e a página inteira cai em `ErrorState` por causa de um filtro. Ver `Songs.tsx` — `intensidades` filtra contra `INTENSIDADE_OPTIONS` e `categorias` contra `UUID_REGEX`.

### Busca com `cmdk`: normalização única

O filtro embutido do `cmdk` só rebaixa para minúsculas — **não remove acentos**. Se o componente também faz comparação própria com `normalizeForSearch`, as duas divergem: "do" bate com "Dó" numa e não na outra. Em `CreatableCombobox.tsx` isso escondia o item e, ao mesmo tempo, suprimia o `CommandEmpty` e o botão "Criar" — popover vazio, sem saída. Passe sempre um `filter` próprio ao `Command` usando a mesma normalização das demais comparações.

### Verificação automatizada de mobile

`playwright.config.ts` roda **dois projetos**, com escopos separados por convenção de nome:

| Projeto | Viewport | Specs |
|---|---|---|
| `chromium` | 1280×720 | todos, **exceto** `*.mobile.spec.ts` (`testIgnore`) |
| `mobile` | 360×740, `devices["Galaxy S8"]`, com toque | **apenas** `*.mobile.spec.ts` (`testMatch`) |

A separação é obrigatória: os specs de desktop usam locators de tabela (`getByRole("table")`, `tbody tr`) e clicam direto nos links da sidebar. A 360px a tabela fica `display:none` (fora da árvore de acessibilidade) e o menu vive atrás do botão "Toggle Sidebar" — rodar esses specs no projeto mobile geraria falhas que não revelam bug nenhum.

**Ao criar uma página com layout dual**, escreva um `*.mobile.spec.ts` que verifique: (1) a variante de cards aparece e a tabela está oculta; (2) **não há overflow horizontal** (`document.documentElement.scrollWidth <= clientWidth`) — a checagem objetiva da regra "nunca depender de scroll horizontal". Referência: `tests/e2e/admin-igrejas.mobile.spec.ts`.

Rodar: `npx playwright test --project=mobile` (exige backend + frontend no ar).

> **Pendência conhecida**: os testes e2e ainda não rodam no CI (`ci-frontend.yml` executa apenas lint + testes unitários). Subir e2e no CI exige provisionar banco e servidores no workflow.

## Navegação e Rolagem

- **Rolagem é do container interno, não da janela.** Em `AppLayout` o scroll vive
  num `<div data-scroll-root>` (o `<main>` é `h-screen overflow-hidden`). Por isso a
  restauração nativa de back/forward do navegador não se aplica e o container é
  compartilhado entre páginas.
  - `useScrollRestoration(key, ready)` (`hooks/use-scroll-restoration.ts`): salva/restaura
    a posição ao voltar. Usar em páginas-lista/detalhe onde o usuário deve retomar
    "onde estava" (ex.: `EventoDetail` com `key = \`escala:${id}\``; `ready = !isLoading && !!data`).
    Reseta o flag interno de "já restaurado" no render quando a `key` muda, para tratar
    o caso de o React Router reaproveitar a instância ao navegar entre detalhes
    (ex.: `/escalas/1` → `/escalas/2`) sem desmontar o componente.
  - `useScrollToTopOnMount()`: chamar em páginas de detalhe para abrir no topo,
    evitando herdar o `scrollTop` da página anterior (ex.: `SongDetail`).
  - `clearScrollPositions()`: limpa o `Map` global de posições (keyed só pela
    chave da página). Chamado no `signOut`, no `onAuthFailure` e no `switchTenant`
    (`AuthContext`) para evitar que uma página de mesmo id em outro tenant restaure
    a rolagem do tenant anterior, além de limitar o crescimento do `Map`.
- **Card clicável que navega ao detalhe** (padrão de `Songs.tsx`/`EventoDetail.tsx`):
  card inteiro com `role="button"`, `tabIndex={0}`, `onClick` e
  `onKeyDown={handleClickableKeyDown(...)}` (de `@/lib/utils`), `cursor-pointer` +
  `hover:shadow-medium hover:border-primary/30`. Navegar preservando a origem em
  `navigate(path, { state: { from: location.pathname } })`.
  - **Isolamento de controles internos** (botões, grip de arraste, popovers como o
    seletor de versão): no **clique**, cada controle interno chama `e.stopPropagation()`
    no seu `onClick`. No **teclado**, como o `keydown` faz bubble até o card, prefira um
    **guard de `currentTarget`** no `onKeyDown` do card —
    `if (e.target === e.currentTarget) handleClickableKeyDown(onOpen)(e)` — em vez de
    `stopPropagation` por controle: uma única guarda cobre grip, picker e botão de
    remover de uma vez (DRY) e evita navegação inesperada ao acionar Enter/Espaço num
    controle interno (a11y). Ver `EventoDetail.tsx` (`SortableMusicaCard`).
  - **`EventoRow.tsx`**: implementação compartilhada desse padrão para linhas de
    evento (escala), adotada por `Dashboard.tsx`, `History.tsx` e `Escalas.tsx` —
    as três telas renderizavam a mesma entidade (`EventoIndex`) com anatomias
    divergentes antes desta unificação. Recebe o objeto de domínio inteiro
    (`evento: EventoIndex`, não primitivos soltos — mesmo padrão de
    `SortableMusicaCard` recebendo `musica: MusicaEvento`) e expõe slots
    (`badges`, `acoes`) para que cada tela componha o que é específico dela sem
    duplicar a anatomia base. Título segue a cadeia
    `descricao.trim() || tipoEvento?.nome || "Escala"` — `tipoEvento` já aparece
    como pill na própria linha, então usá-lo como preferência de título
    duplicaria informação. A cadeia vive no helper exportado
    **`tituloDoEvento(evento)`** (`EventoRow.tsx`): consumidores que precisam do
    mesmo título fora da linha (`aria-label` de "Duplicar escala X"/"Publicar
    rascunho X", descrição do diálogo "Publicar sem repertório?") importam o
    helper em vez de reimplementar o fallback (DRY) — ver `Escalas.tsx` e
    `History.tsx`. `role="button"` só aparece quando `onOpen` é
    informado (`Escalas.tsx` **não** passa `onOpen`: aquele card tem
    Editar/Excluir destrutivos no rodapé, e linha inteira clicável ao lado de um
    botão destrutivo convida ao clique acidental — a tela reaproveita a
    anatomia, não a interação). O componente cuida do `stopPropagation` do slot
    `acoes` internamente (Tell, Don't Ask), então o consumidor não repete essa
    lógica em cada botão que passa.

## Convenções de Código

- Componentes React: **PascalCase** (ex.: `AppSidebar.tsx`).
- Hooks customizados: prefixo `use-` em kebab-case (ex.: `use-mobile.tsx`).
- Utilitários: **camelCase** em `lib/` (ex.: `utils.ts`).
- Importações de componentes shadcn: `@/components/ui/button`.

## Scripts

- `npm run dev` — Servidor de desenvolvimento.
- `npm run build` — Build de produção.
- `npm run lint` — Verificação ESLint.
- `npm run preview` — Preview do build de produção.
