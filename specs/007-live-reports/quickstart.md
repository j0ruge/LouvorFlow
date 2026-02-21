# Quickstart: Relatórios com Dados Reais

**Branch**: `007-live-reports` | **Date**: 2026-02-18

## Pré-requisitos

1. **Node.js** >= 18 instalado
2. **PostgreSQL 17** em execução com banco configurado
3. **Backend** em execução em `http://localhost:3000`
4. Dados populados no banco (eventos, músicas, associações evento-música)

## Setup do Ambiente

```bash
# Acessar a branch
git checkout 007-live-reports

# Instalar dependências do backend
cd src/backend
npm install

# Instalar dependências do frontend
cd ../frontend
npm install

# Iniciar backend (em um terminal)
cd ../backend
npm run dev
# → Backend em http://localhost:3000

# Iniciar frontend (em outro terminal)
cd ../frontend
npm run dev
# → Frontend em http://localhost:8080
```

## Verificação Rápida

Após o setup, verifique que:

1. **Endpoint**: `curl http://localhost:3000/api/relatorios/resumo` retorna JSON com campos `totalMusicas`, `totalEventos`, `mediaPorEvento`, `topMusicas`, `atividadeMensal`
2. **Relatórios** (`/relatorios`): Página carrega com dados reais (não 124, 42, 6.2 hardcoded)
3. **Cards**: "Total de Músicas", "Cultos Realizados" e "Média por Culto" exibem valores do banco
4. **Ranking**: Top 5 músicas mais tocadas com contagem real
5. **Atividade Mensal**: Últimos 6 meses com contagem de eventos e músicas
6. **Estado Vazio**: Se banco não tem dados, mensagens de estado vazio aparecem
7. **Erro**: Se backend estiver parado, mensagem de erro com botão "Tentar novamente"

## Estrutura de Arquivos Novos/Modificados

```text
src/backend/src/
├── repositories/
│   └── relatorios.repository.ts     # NOVO
├── services/
│   └── relatorios.service.ts        # NOVO
├── controllers/
│   └── relatorios.controller.ts     # NOVO
├── routes/
│   └── relatorios.routes.ts         # NOVO
├── types/
│   └── index.ts                     # MODIFICADO
└── app.ts                           # MODIFICADO

src/backend/tests/
└── unit/
    └── relatorios.service.test.ts   # NOVO

src/frontend/src/
├── services/
│   └── relatorios.ts                # NOVO
├── hooks/
│   └── use-relatorios.ts            # NOVO
├── schemas/
│   └── relatorio.ts                 # NOVO
└── pages/
    └── Reports.tsx                  # MODIFICADO
```

## Ordem de Implementação Recomendada

1. **Backend — Tipos e Repository**: Interfaces em `types/index.ts` + queries Prisma em `relatorios.repository.ts`
2. **Backend — Service**: Lógica de agregação em `relatorios.service.ts`
3. **Backend — Controller e Rota**: Handler HTTP + registro em `app.ts`
4. **Frontend — Schema e Service**: Zod schema + chamada API
5. **Frontend — Hook**: React Query hook
6. **Frontend — Página**: Substituir hardcoded em `Reports.tsx`
7. **Testes**: Testes unitários do service com fake repository
