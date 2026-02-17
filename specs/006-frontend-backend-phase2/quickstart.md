# Quickstart: Integração Frontend-Backend (Fase 2)

**Branch**: `006-frontend-backend-phase2` | **Date**: 2026-02-17

## Pré-requisitos

1. **Node.js** >= 18 instalado
2. **PostgreSQL 17** em execução com banco configurado
3. **Backend** em execução em `http://localhost:3000`
4. Dados de referência populados no banco (tonalidades, funções, tipos de evento)

## Setup do Ambiente

```bash
# Clonar e acessar a branch
git checkout 006-frontend-backend-phase2

# Instalar dependências do frontend
cd src/frontend
npm install

# Configurar variável de ambiente (opcional, padrão é localhost:3000)
# Criar .env.local se necessário
echo "VITE_API_BASE_URL=http://localhost:3000/api" > .env.local

# Iniciar servidor de desenvolvimento
npm run dev
# → Acesse http://localhost:8080
```

## Verificação Rápida

Após o setup, verifique que:

1. **Dashboard** (`/`): Cards mostram números reais (não 124, 8, 32, 15 hardcoded)
2. **Músicas** (`/musicas`): Lista carrega do servidor, clique navega para `/musicas/:id`
3. **Escalas** (`/escalas`): Botões "Editar" e "Excluir" funcionais
4. **Integrantes** (`/integrantes`): Editar mostra seção de funções com badges
5. **Configurações** (`/configuracoes`): 5 abas (Artistas, Tags, Funções, Tonalidades, Tipos de Evento)
6. **Busca**: Campos de busca em Músicas e Integrantes filtram resultados

## Estrutura de Arquivos Novos/Modificados

```text
src/frontend/src/
├── components/
│   ├── ConfigCrudSection.tsx     # NOVO — Seção CRUD genérica
│   ├── DeleteConfirmDialog.tsx   # NOVO — Diálogo de confirmação de exclusão
│   ├── MusicaDetail.tsx          # NOVO — Detalhes da música
│   ├── VersaoForm.tsx            # NOVO — Formulário de versão
│   ├── AppSidebar.tsx            # MODIFICADO — Item "Configurações"
│   ├── EventoForm.tsx            # MODIFICADO — Modo edição
│   ├── EventoDetail.tsx          # MODIFICADO — Editar/Excluir
│   ├── IntegranteForm.tsx        # MODIFICADO — Seção de funções
│   └── MusicaForm.tsx            # MODIFICADO — Modo edição
├── pages/
│   ├── SongDetail.tsx            # NOVO — Página /musicas/:id
│   ├── Settings.tsx              # NOVO — Página /configuracoes
│   ├── Dashboard.tsx             # MODIFICADO — Dados reais
│   ├── Songs.tsx                 # MODIFICADO — Busca, navegação
│   ├── Scales.tsx                # MODIFICADO — Editar, excluir
│   └── Members.tsx               # MODIFICADO — Busca
├── hooks/
│   ├── use-artistas.ts           # NOVO
│   ├── use-musicas.ts            # MODIFICADO — CRUD completo
│   ├── use-eventos.ts            # MODIFICADO — Update, Delete
│   ├── use-integrantes.ts        # MODIFICADO — Funções
│   └── use-support.ts            # MODIFICADO — CRUD entidades aux.
├── services/
│   ├── artistas.ts               # NOVO
│   ├── musicas.ts                # MODIFICADO
│   ├── eventos.ts                # MODIFICADO
│   ├── integrantes.ts            # MODIFICADO
│   └── support.ts                # MODIFICADO
├── schemas/
│   ├── artista.ts                # NOVO
│   ├── musica.ts                 # MODIFICADO
│   ├── evento.ts                 # MODIFICADO
│   └── shared.ts                 # MODIFICADO (se necessário)
└── tests/
    └── e2e/                      # NOVO — Testes Playwright
        ├── navigation.spec.ts
        ├── musicas.spec.ts
        ├── escalas.spec.ts
        ├── integrantes.spec.ts
        ├── configuracoes.spec.ts
        └── dashboard.spec.ts
```

## Ordem de Implementação Recomendada

1. **Infraestrutura**: DeleteConfirmDialog, ConfigCrudSection, schemas novos
2. **Configurações + Artistas**: Página Settings com abas CRUD (desbloqueia versões de músicas)
3. **Músicas**: Editar, excluir, página de detalhes, versões, tags, funções
4. **Escalas**: Editar e excluir eventos
5. **Integrantes**: Gestão de funções no dialog de edição
6. **Dashboard**: Dados reais
7. **Busca**: Filtragem client-side em Músicas e Integrantes
8. **Testes E2E**: Validação com Playwright MCP + testes automatizados
