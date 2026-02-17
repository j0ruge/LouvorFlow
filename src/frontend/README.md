# 🎵 LouvorFlow

<div align="center">

![LouvorFlow Logo](https://img.shields.io/badge/LouvorFlow-Gestão%20Musical-7C3AED?style=for-the-badge&logo=music&logoColor=white)

**Sistema de Gestão de Escalas Musicais para Ministérios de Louvor**

[![React](https://img.shields.io/badge/React-18.3.1-61DAFB?style=flat&logo=react&logoColor=white)](https://reactjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.8.3-3178C6?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind%20CSS-3.4.17-06B6D4?style=flat&logo=tailwind-css&logoColor=white)](https://tailwindcss.com/)
[![Vite](https://img.shields.io/badge/Vite-5.4.19-646CFF?style=flat&logo=vite&logoColor=white)](https://vitejs.dev/)
[![React Query](https://img.shields.io/badge/React%20Query-5.83.0-FF4154?style=flat&logo=react-query&logoColor=white)](https://tanstack.com/query)
[![Zod](https://img.shields.io/badge/Zod-3.25.76-3E67B1?style=flat&logo=zod&logoColor=white)](https://zod.dev/)

[Demo](https://LouvorFlow.lovable.app) · [Reportar Bug](https://github.com/j0ruge/LouvorFlow/issues) · [Solicitar Feature](https://github.com/j0ruge/LouvorFlow/issues)

</div>

---

## 📖 Sobre o Projeto

O **LouvorFlow** é um projeto desenvolvido por um grupo de jovens com o objetivo de aprender, se divertir e criar uma ferramenta útil para a gestão de ministérios de louvor em igrejas. O sistema facilita a organização de escalas musicais, gerenciamento de repertório, controle de integrantes e geração de relatórios.

### 🎯 Objetivos do Projeto

- 📚 **Aprendizado**: Desenvolver habilidades em programação full-stack
- 🤝 **Trabalho em Equipe**: Colaboração entre jovens desenvolvedores
- 🎵 **Utilidade Prática**: Criar uma solução real para ministérios de louvor
- 🚀 **Inovação**: Aplicar tecnologias modernas em contexto religioso

---

## ✨ Funcionalidades

### 📊 Dashboard com Dados Reais

Painel principal com estatísticas reais do servidor (total de músicas, escalas, integrantes) e lista de próximas escalas ordenadas por data.

![Dashboard](https://raw.githubusercontent.com/j0ruge/LouvorFlow/main/docs/screenshots/dashboard.png)

### 🎼 Gestão de Músicas

CRUD completo de músicas com página de detalhes dedicada (`/musicas/:id`) para gestão de versões, tags e funções requeridas.

![Músicas](https://raw.githubusercontent.com/j0ruge/LouvorFlow/main/docs/screenshots/musicas.png)

**Recursos:**

- 🔍 Busca funcional por nome com debounce de 300ms
- 🎸 Visualização e edição de tonalidade e BPM
- 🏷️ Gestão de tags (adicionar/remover da lista existente)
- 🎵 Gestão de versões por artista (BPM, cifras, letras, link)
- 🎭 Gestão de funções requeridas pela música
- 📝 Página de detalhes dedicada com todas as relações
- ✏️ Edição inline de nome e tonalidade
- 🗑️ Exclusão com diálogo de confirmação e aviso de impacto CASCADE

### 📅 Gerenciamento de Escalas

Criação, edição e exclusão de escalas de culto com equipes completas.

![Escalas](https://raw.githubusercontent.com/j0ruge/LouvorFlow/main/docs/screenshots/escalas.png)

**Recursos:**

- 📆 Planejamento por data e tipo de culto
- 👥 Definição de ministro, cantores e músicos
- 🎵 Seleção de músicas para cada culto
- ✏️ Edição de escalas existentes (data, tipo, descrição)
- 🗑️ Exclusão com diálogo de confirmação e aviso de impacto CASCADE
- ✅ Status de confirmação (Confirmada/Pendente)
- 📱 Compartilhamento via WhatsApp

### 👥 Controle de Integrantes

Cadastro e gerenciamento completo dos membros do ministério com atribuição de funções.

![Integrantes](https://raw.githubusercontent.com/j0ruge/LouvorFlow/main/docs/screenshots/integrantes.png)

**Recursos:**

- 👤 Perfis detalhados com foto
- 🎭 Atribuição e remoção de funções (instrumentos/papéis) via dialog de edição
- 🎹 Badges de funções visíveis nos cards de integrantes
- 🔍 Busca funcional por nome com debounce de 300ms
- 📞 Informações de contato
- 📧 Ações rápidas de edição e contato

### ⚙️ Configurações

Página dedicada com abas horizontais para gerenciar entidades auxiliares do sistema.

**Seções (abas):**

- 🎤 **Artistas** — CRUD de artistas/intérpretes para vincular a versões de músicas
- 🏷️ **Tags** — Classificações temáticas para músicas (Adoração, Celebração, etc.)
- 🎭 **Funções** — Papéis e instrumentos (Vocal, Guitarra, Bateria, etc.)
- 🎵 **Tonalidades** — Tons musicais disponíveis (C, D, Em, G#, etc.)
- 📋 **Tipos de Evento** — Categorias de culto (Celebração, Oração, Casamento, etc.)

### 📈 Relatórios e Análises

Estatísticas detalhadas sobre participação e performance do ministério.

**Métricas:**

- 🔝 Top músicas mais tocadas
- 📊 Análise de participação
- 📅 Histórico de escalas
- 📉 Tendências mensais

### 🕐 Histórico

Consulta de todas as escalas e cultos já realizados.

**Recursos:**

- 📜 Visualização cronológica
- 🔍 Filtros por data e tipo
- 📊 Estatísticas de cada culto
- 👥 Equipe que participou

---

## 🛠️ Tecnologias Utilizadas

### Frontend

- **React 18.3** - Biblioteca JavaScript para construção de interfaces
- **TypeScript 5.8** - Superset JavaScript com tipagem estática
- **Vite 5.4** - Build tool moderna e rápida (com plugin SWC)
- **Tailwind CSS 3.4** - Framework CSS utilitário
- **shadcn/ui** - Componentes UI reutilizáveis e acessíveis (Radix UI)
- **React Query (TanStack) 5** - Gerenciamento de estado do servidor, cache e sincronização
- **React Hook Form 7** - Gerenciamento de estado de formulários
- **Zod 3** - Validação de schemas com tipagem TypeScript-first
- **React Router DOM 6** - Navegação entre páginas (SPA)
- **Recharts 2** - Visualização de gráficos e dados
- **Lucide React** - Biblioteca de ícones
- **Sonner** - Notificações toast
- **date-fns 3** - Utilitários para manipulação de datas
- **next-themes** - Gerenciamento de tema (claro/escuro)

### Backend

- **Node.js (>=18)** - Runtime JavaScript
- **Express 5** - Framework web para Node.js
- **TypeScript 5.9** - Tipagem estática
- **PostgreSQL 17** - Banco de dados relacional
- **Prisma 6** - ORM moderno para TypeScript/Node.js
- **Zod** - Validação de dados
- **Vitest 4** - Framework de testes

### Testes

- **Playwright 1.58** - Testes E2E (navegabilidade e usabilidade)
- **Vitest 4** - Testes unitários (backend)

### Infraestrutura e Ferramentas

- **Docker Compose** - Orquestração de containers
- **Git** - Controle de versão
- **GitHub** - Hospedagem de código
- **ESLint 9** - Linting com suporte TypeScript

---

## 🚀 Como Executar o Projeto

### Pré-requisitos

- Node.js (versão 18 ou superior)
- npm ou yarn
- PostgreSQL 17 (para backend)
- Docker e Docker Compose (opcional, para infraestrutura)

### Instalação

1. **Clone o repositório**

```bash
git clone https://github.com/j0ruge/LouvorFlow.git
cd LouvorFlow
```

1. **Instale as dependências**

```bash
npm install
```

1. **Configure as variáveis de ambiente**

```bash
cp .env.example .env
# Edite o arquivo .env com suas configurações
# VITE_API_BASE_URL=http://localhost:3000/api
```

1. **Execute o projeto em desenvolvimento**

```bash
npm run dev
```

1. **Acesse no navegador**

```text
http://localhost:8080
```

### Scripts Disponíveis

```bash
npm run dev          # Servidor de desenvolvimento (porta 8080)
npm run build        # Build de produção
npm run build:dev    # Build de desenvolvimento
npm run lint         # Verificação de lint (ESLint)
npm run preview      # Preview do build de produção
npx playwright test  # Testes E2E (requer backend e frontend em execução)
```

---

## 📁 Estrutura do Projeto

```text
LouvorFlow/
├── src/
│   ├── components/               # Componentes React reutilizáveis
│   │   ├── ui/                   # Componentes shadcn/ui (Radix UI)
│   │   ├── AppLayout.tsx         # Layout principal com sidebar
│   │   ├── AppSidebar.tsx        # Barra lateral de navegação
│   │   ├── ThemeProvider.tsx      # Provedor de tema (claro/escuro)
│   │   ├── ThemeToggle.tsx       # Botão de alternância de tema
│   │   ├── NavLink.tsx           # Componente de link customizado
│   │   ├── MusicaForm.tsx        # Formulário de criação/edição de músicas
│   │   ├── MusicaDetail.tsx      # Detalhes da música (versões, tags, funções)
│   │   ├── VersaoForm.tsx        # Formulário de criação/edição de versão
│   │   ├── EventoForm.tsx        # Formulário de criação/edição de escalas
│   │   ├── EventoDetail.tsx      # Visualização detalhada de escala
│   │   ├── IntegranteForm.tsx    # Formulário de criação/edição de integrantes
│   │   ├── ConfigCrudSection.tsx # Seção CRUD genérica para configurações
│   │   ├── DeleteConfirmDialog.tsx # Diálogo de confirmação de exclusão
│   │   ├── EmptyState.tsx        # Estado vazio genérico
│   │   └── ErrorState.tsx        # Estado de erro genérico
│   ├── pages/                    # Páginas da aplicação
│   │   ├── Index.tsx             # Redirecionamento inicial
│   │   ├── Dashboard.tsx         # Dashboard com dados reais (/)
│   │   ├── Songs.tsx             # Listagem de músicas com busca (/musicas)
│   │   ├── SongDetail.tsx        # Detalhes da música (/musicas/:id)
│   │   ├── Scales.tsx            # Gestão de escalas (/escalas)
│   │   ├── Members.tsx           # Gestão de integrantes com busca (/integrantes)
│   │   ├── Settings.tsx          # Configurações com abas (/configuracoes)
│   │   ├── Reports.tsx           # Relatórios e análises (/relatorios)
│   │   ├── History.tsx           # Histórico de escalas (/historico)
│   │   └── NotFound.tsx          # Página 404
│   ├── hooks/                    # Custom React Hooks (React Query)
│   │   ├── use-musicas.ts        # CRUD + versões/tags/funções de músicas
│   │   ├── use-eventos.ts        # CRUD de escalas/eventos
│   │   ├── use-integrantes.ts    # CRUD + funções de integrantes
│   │   ├── use-artistas.ts       # CRUD de artistas
│   │   ├── use-support.ts        # CRUD de tags, funções, tonalidades, tipos de evento
│   │   └── use-mobile.tsx        # Detecção de dispositivo móvel
│   ├── services/                 # Camada de comunicação com a API
│   │   ├── musicas.ts            # Endpoints de músicas + sub-recursos
│   │   ├── eventos.ts            # Endpoints de escalas/eventos
│   │   ├── integrantes.ts        # Endpoints de integrantes + funções
│   │   ├── artistas.ts           # Endpoints de artistas
│   │   └── support.ts            # Endpoints de tags, funções, tonalidades, tipos de evento
│   ├── schemas/                  # Schemas de validação (Zod)
│   │   ├── musica.ts             # Create/Update de músicas e versões
│   │   ├── evento.ts             # Create/Update de escalas
│   │   ├── integrante.ts         # Create/Update de integrantes
│   │   ├── artista.ts            # Create/Update de artistas
│   │   └── shared.ts             # Schemas de entidades auxiliares
│   ├── lib/                      # Utilitários e helpers
│   │   ├── api.ts                # Cliente HTTP genérico (apiFetch)
│   │   └── utils.ts              # Funções utilitárias (cn, isSafeUrl)
│   ├── App.tsx                   # Componente raiz com rotas e providers
│   ├── main.tsx                  # Entry point
│   └── index.css                 # Estilos globais e tokens
├── tests/
│   └── e2e/                      # Testes E2E (Playwright)
│       ├── navigation.spec.ts    # Navegação entre páginas
│       ├── musicas.spec.ts       # Fluxos de músicas
│       ├── escalas.spec.ts       # Fluxos de escalas
│       ├── integrantes.spec.ts   # Fluxos de integrantes
│       ├── configuracoes.spec.ts # Fluxos de configurações
│       └── dashboard.spec.ts     # Fluxos do dashboard
├── playwright.config.ts          # Configuração do Playwright
├── public/                       # Arquivos estáticos
├── docs/                         # Documentação e screenshots
└── README.md                     # Este arquivo
```

---

## 🎨 Design System

O LouvorFlow utiliza um design system personalizado focado em:

- 🎨 **Paleta de cores** inspirada em música e adoração
- 🌈 **Gradientes suaves** em tons de roxo e azul
- 📱 **Responsividade** para desktop, tablet e mobile
- ♿ **Acessibilidade** seguindo padrões WCAG
- 🎯 **Componentes consistentes** com shadcn/ui

### Tokens de Design

```css
/* Cores Principais */
--primary: 262.1 83.3% 57.8%    /* Roxo vibrante */
--secondary: 220 14.3% 95.9%    /* Cinza claro */
--accent: 262.1 83.3% 67.8%     /* Roxo claro */

/* Gradientes */
--gradient-primary    /* Gradiente roxo */
--gradient-subtle     /* Gradiente sutil de fundo */
--gradient-card       /* Gradiente para cards */
```

---

## 🤝 Contribuindo

Contribuições são sempre bem-vindas! Este é um projeto de aprendizado, então não tenha medo de contribuir.

1. Faça um Fork do projeto
2. Crie uma Branch para sua Feature (`git checkout -b feature/AmazingFeature`)
3. Commit suas mudanças (`git commit -m 'Add some AmazingFeature'`)
4. Push para a Branch (`git push origin feature/AmazingFeature`)
5. Abra um Pull Request

### 📋 Convenções de Commit

Seguimos o padrão [Conventional Commits](https://www.conventionalcommits.org/):

- `feat:` Nova funcionalidade
- `fix:` Correção de bug
- `docs:` Mudanças na documentação
- `style:` Formatação, ponto e vírgula faltando, etc
- `refactor:` Refatoração de código
- `test:` Adicionando testes
- `chore:` Atualizando tarefas de build, etc

---

## 👥 Equipe de Desenvolvimento

Este projeto está sendo desenvolvido por um grupo de jovens apaixonados por tecnologia e música:

- **Desenvolvedores Frontend** - Interface e experiência do usuário
- **Desenvolvedores Backend** - API e banco de dados
- **UI/UX Designers** - Design e prototipação
- **Testadores** - Garantia de qualidade

Quer fazer parte da equipe? Entre em contato!

---

## 📝 Licença

Este projeto está sob a licença MIT. Veja o arquivo [LICENSE](LICENSE) para mais detalhes.

---

## 📞 Contato

**LouvorFlow** - Projeto do Grupo de Jovens

- 🌐 Website: [LouvorFlow.lovable.app](https://LouvorFlow.lovable.app)
- 📧 Email: <contato@LouvorFlow.com>
- 💬 GitHub Issues: [Criar Issue](https://github.com/j0ruge/LouvorFlow/issues)

---

## 🙏 Agradecimentos

- [Lovable](https://lovable.dev) - Plataforma de desenvolvimento
- [shadcn/ui](https://ui.shadcn.com/) - Componentes UI
- [Lucide Icons](https://lucide.dev/) - Biblioteca de ícones
- Todos os membros do grupo que contribuem para este projeto

---

<div align="center">

**[⬆ Voltar ao topo](#-louvorflow)**

Feito com ❤️ e 🎵 por jovens aprendendo e se divertindo

⭐ Deixe uma estrela se este projeto te ajudou!

</div>
