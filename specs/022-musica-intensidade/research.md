# Research: Intensidade de Música

## R-001: Onde armazenar intensidade (Musica vs Versão)

**Decision**: Campo `intensidade` na tabela `artistas_musicas` (versão), não na tabela `musicas`.

**Rationale**: A constituição (Princípio IV) define que metadados de arranjo pertencem à versão. Diferentes artistas podem ter arranjos com intensidades diferentes para a mesma composição. Coerente com BPM, cifras e lyrics que já são por versão.

**Alternatives considered**:
- Campo na tabela `musicas`: Descartado — violaria o modelo versão-cêntrico da constituição.
- Tabela separada `intensidades`: Descartado — YAGNI (Princípio V). Com apenas 3 valores fixos, um enum/string nullable é a solução mais simples.

## R-002: Tipo de dados para intensidade

**Decision**: Campo `String?` (nullable) no Prisma, com validação Zod para aceitar apenas "calma", "media", "agitada".

**Rationale**: PostgreSQL enum exigiria migration extra para alterar valores futuramente. String com validação Zod no backend e frontend é mais simples e igualmente seguro. Os 3 valores são fixos e validados em ambas as camadas.

**Alternatives considered**:
- PostgreSQL ENUM type: Mais rígido mas requer migration DDL para alterações. Descartado por simplicidade.
- Integer (1/2/3): Perde legibilidade na API. Descartado.

## R-003: Componente visual frontend

**Decision**: Pill buttons horizontais com ícones de barras de intensidade (lucide-react `Signal`, `SignalMedium`, `SignalHigh` ou `BarChart` variants). Toggle behavior — clicar na selecionada desmarca.

**Rationale**: Segue a foto de referência do app concorrente. Pill buttons são mais intuitivos que Select/Combobox para 3 opções fixas. Toggle permite desmarcar (nullable).

**Alternatives considered**:
- Select dropdown: Menos visual, esconde opções. Descartado para elegância.
- Radio buttons: Não permite desmarcar facilmente. Descartado.
