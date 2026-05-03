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
8. **Overlays com conteúdo alto** (calendários, listas longas, filtros): Usar `Drawer` (bottom sheet) no mobile e `Popover` no desktop. Detectar com `useIsMobile()`. Nunca usar Popover no mobile para conteúdo que exceda ~300px de altura — causa overflow/corte. Nunca renderizar conteúdo inline que desloque campos abaixo — preferir overlay. Extrair conteúdo compartilhado em subcomponente para evitar duplicação. Referência: `DateTimePicker.tsx`.
9. **Ícones de confirmação de seleção**: Em botões ao lado de um Select/Combobox que confirmam a escolha (adicionar item selecionado), usar `CornerDownLeft` (↵) em vez de `Plus` (+). Reservar `Plus` apenas para criar novos itens.
10. **Placeholders em Select/Combobox**: Sempre usar `truncate` no span do placeholder. Textos longos como "Todas as músicas já foram adicionadas" transbordam sobre botões adjacentes em telas estreitas. Referência: `CreatableCombobox.tsx` linha 161.
11. **Botões de ação com labels**: No mobile, usar `hidden sm:inline` nos labels de texto e manter apenas o ícone visível. Garantir `aria-label` para acessibilidade. Exemplo: `<Pencil className="h-4 w-4 sm:mr-1" /><span className="hidden sm:inline">Editar</span>`.
12. **Cards com informação densa** (música com nome + tonalidade + versão + ações): Separar em 2 linhas — 1ª linha: nome + ação de remoção; 2ª linha: badges/metadata com padding-left alinhado ao nome. Usar `items-start` (não `items-center`) quando o nome pode quebrar em `line-clamp-2`.
13. **Integrantes com funções/badges**: Nome + botão de remoção na 1ª linha, badges de função em linha separada com `flex-wrap` e padding-left alinhado ao nome.

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
| `EventoDetail.tsx` | Layout 2 linhas em cards (nome+ação / metadata), icon-only buttons, items-start com line-clamp-2 |
| `EscalaShareActions.tsx` | Labels com `hidden sm:inline` para icon-only no mobile |
| `CreatableCombobox.tsx` | `truncate` no span do placeholder para evitar overflow sobre botão adjacente |
| `ConfigCrudSection.tsx` | flex-wrap form + gap + truncate nomes |
| `Dashboard.tsx` | grid-cols-2 stats + responsive gaps + truncate |
| `admin/Roles.tsx` | Dual layout cards/table + header responsivo |
| `admin/Users.tsx` | Dual layout cards/table + header responsivo |
| `Scales.tsx` | Header justify-between com prefixo sm: |
| `IntegranteForm.tsx` | flex-wrap no select+button de funções |
| `DateTimePicker.tsx` | Drawer (mobile) / Popover (desktop) + botões Confirmar/Cancelar |

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
