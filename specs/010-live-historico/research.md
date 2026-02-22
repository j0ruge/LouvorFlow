# Research: Histórico com Dados Reais

**Feature**: 010-live-historico | **Date**: 2026-02-22

## R1: Filtragem de eventos passados — frontend vs backend

**Decision**: Filtragem no frontend (client-side)

**Rationale**: O endpoint `GET /api/eventos` já retorna todos os eventos. A quantidade de eventos em uma igreja é tipicamente baixa (dezenas a centenas), tornando a filtragem client-side eficiente e simples. Adicionar um query param ao backend criaria escopo desnecessário para esta feature.

**Alternatives considered**:
- Backend com query param `?data_ate=YYYY-MM-DD` — Mais performante para grandes volumes, mas over-engineering para o caso de uso atual. Pode ser adicionado no futuro se necessário.

## R2: Apresentação de "Ver Detalhes" — nova página vs dialog vs rota existente

**Decision**: Reutilizar a rota existente `/escalas/:id` que renderiza `EventoDetail`

**Rationale**: Já existe uma página de detalhe completa de evento (`EventoDetail.tsx`) na rota `/escalas/:id`. Ela exibe músicas com tonalidade, integrantes com funções, e permite gerenciar associações. Criar uma versão read-only duplicaria código sem benefício.

**Alternatives considered**:
- Dialog inline com resumo — Limita a quantidade de informação exibível e duplica lógica de busca.
- Nova rota `/historico/:id` — Duplicação desnecessária. A rota existente já serve o propósito.

## R3: Substituição do campo "Ministro" hardcoded

**Decision**: Usar o campo `descricao` do evento

**Rationale**: O modelo de dados não possui campo "ministro". O campo `descricao` é um campo texto livre que pode conter qualquer informação complementar sobre o evento, incluindo quem ministrou.

**Alternatives considered**:
- Inferir "ministro" a partir dos integrantes com função específica — Complexo e frágil; a tabela `funcoes` não tem uma função "Ministro" padronizada.
- Adicionar campo `ministro` ao modelo — Escopo fora desta feature; requer migração de banco.

## R4: Padrões de UI existentes reutilizáveis

**Decision**: Reutilizar `EmptyState`, `ErrorState`, e `Skeleton` do shadcn/ui, seguindo o padrão da página `Scales.tsx`

**Rationale**: A página de Escalas (`Scales.tsx`) já implementa o padrão completo de loading → error → empty → data com esses componentes. Replicar o mesmo padrão garante consistência visual e comportamental.

**Confirmed patterns from Scales.tsx**:
- Loading: `Array.from({ length: N }).map(() => <Skeleton>)`
- Error: `<ErrorState message={...} onRetry={() => refetch()} />`
- Empty: `<EmptyState title={...} description={...} />`
- Data: Map sobre `scales` com `<Card>` individual por evento

## R5: Dados disponíveis no EventoIndex para o card de histórico

**Decision**: Usar o tipo `EventoIndex` existente para a listagem

**Confirmed fields available**:
- `id`: UUID para navegação
- `data`: String de data para formatação e filtragem
- `descricao`: Texto livre (substitui "Ministro")
- `tipoEvento`: `{ id, nome }` nullable (substitui o nome hardcoded do culto)
- `musicas`: Array de `{ id, nome }` — `musicas.length` dá a contagem
- `integrantes`: Array de `{ id, nome }` — `integrantes.length` dá a contagem

**Mapping hardcoded → real**:
| Hardcoded field   | Real data source              |
|-------------------|-------------------------------|
| `service`         | `tipoEvento?.nome ?? "Evento"`|
| `date`            | `data` (ISO string)           |
| `minister`        | `descricao`                   |
| `songsCount`      | `musicas.length`              |
| `participantsCount` | `integrantes.length`        |
