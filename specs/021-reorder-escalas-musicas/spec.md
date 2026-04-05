# Feature Specification: Reordenacao de Musicas na Escala

**Feature Branch**: `021-reorder-escalas-musicas`
**Created**: 2026-03-24
**Status**: Draft
**Input**: User description: "A usuaria deseja que, dada uma Escala feita e as musicas escolhidas, possa reordenar as musicas. Adicionar campo de ordem na tabela pivot Eventos_Musicas, e no frontend permitir reordenacao via drag-and-drop nos cards de musica, com persistencia no banco. Mobile-first."

## Clarifications

### Session 2026-03-24

- Q: Estrategia de salvamento da ordem apos reposicionamento? → A: Optimistic UI — atualiza a interface imediatamente, salva em background, reverte com toast de erro se falhar.
- Q: Indicador numerico de posicao visivel nos cards? → A: Sim — exibir badge com numero da posicao (1, 2, 3...) em cada card de musica.

## User Scenarios & Testing *(mandatory)*

### User Story 1 - Reordenar musicas na escala via arrastar e soltar (Priority: P1)

A lider de louvor acessa os detalhes de uma escala ja criada com musicas associadas. Ela deseja definir a ordem em que as musicas serao tocadas durante o evento. Nos cards de musica, ha um badge com o numero da posicao e um icone de arraste (grip handle) que indica que a musica pode ser reposicionada. Ela clica e arrasta o card para a posicao desejada. A nova ordem e atualizada imediatamente na interface (optimistic UI) e salva em background no banco de dados.

**Why this priority**: Funcionalidade principal solicitada. Sem ela, a feature nao entrega valor.

**Independent Test**: Acessar detalhes de uma escala com 3+ musicas, arrastar uma musica para outra posicao, recarregar a pagina e confirmar que a ordem persistiu.

**Acceptance Scenarios**:

1. **Given** uma escala com 3 musicas sem ordem definida, **When** a pagina e carregada, **Then** as musicas aparecem ordenadas pela ordem em que foram adicionadas (fallback: data de criacao).
2. **Given** uma escala com 3 musicas, **When** o usuario arrasta a musica da posicao 3 para a posicao 1, **Then** os badges de posicao e as posicoes das demais musicas se ajustam automaticamente na interface e a nova ordem e persistida no banco.
3. **Given** uma escala com musicas reordenadas, **When** a pagina e recarregada, **Then** as musicas aparecem na ordem salva anteriormente.
4. **Given** um usuario sem permissao de escrita (`escalas.write`), **When** acessa a tela de detalhes da escala, **Then** os icones de arraste nao sao exibidos e a reordenacao nao e permitida. Os badges de posicao permanecem visiveis.
5. **Given** uma reordenacao realizada com sucesso, **When** o backend confirma a persistencia, **Then** nenhum feedback adicional e exibido (a atualizacao otimista ja refletiu o resultado).
6. **Given** uma reordenacao realizada, **When** o backend retorna erro, **Then** a interface reverte para a ordem anterior e exibe um toast de erro informando a falha.

---

### User Story 2 - Adicionar musica preservando a ordem existente (Priority: P2)

Ao adicionar uma nova musica a uma escala que ja possui musicas ordenadas, a nova musica deve ser inserida na ultima posicao automaticamente, sem alterar a ordem das musicas ja existentes.

**Why this priority**: Garante consistencia do campo de ordem ao longo do ciclo de vida da escala.

**Independent Test**: Adicionar uma musica a uma escala com 3 musicas ordenadas e verificar que a nova musica recebeu posicao 4.

**Acceptance Scenarios**:

1. **Given** uma escala com 3 musicas ordenadas (1, 2, 3), **When** uma nova musica e adicionada, **Then** ela recebe a posicao 4 e o badge exibe "4".
2. **Given** uma escala sem musicas, **When** a primeira musica e adicionada, **Then** ela recebe a posicao 1 e o badge exibe "1".

---

### User Story 3 - Remover musica com reajuste de ordem (Priority: P2)

Ao remover uma musica de uma escala, as posicoes das musicas restantes devem ser recalculadas para manter uma sequencia continua sem buracos.

**Why this priority**: Evita inconsistencia visual e logica na ordenacao apos remocao.

**Independent Test**: Remover a musica da posicao 2 de uma escala com 3 musicas e verificar que as restantes ficam nas posicoes 1 e 2.

**Acceptance Scenarios**:

1. **Given** uma escala com musicas nas posicoes 1, 2, 3, **When** a musica da posicao 2 e removida, **Then** a musica que estava na posicao 3 passa para a posicao 2 e os badges sao atualizados.

---

### User Story 4 - Experiencia mobile-first (Priority: P1)

Em dispositivos moveis, o usuario consegue reordenar musicas com toque longo (long press) seguido de arraste. Os cards devem ter area de toque adequada e o icone de grip deve ser visivel e acessivel. Em desktop, o comportamento padrao de drag-and-drop com mouse e mantido.

**Why this priority**: O projeto e mobile-first; a experiencia tatil e essencial para a maioria dos usuarios.

**Independent Test**: Em um celular (ou emulador), acessar a escala, tocar e segurar o icone de grip, arrastar para reposicionar, e confirmar que a ordem foi salva.

**Acceptance Scenarios**:

1. **Given** um dispositivo mobile, **When** o usuario faz long press no icone de grip de uma musica, **Then** o card entra em modo de arraste com feedback visual (elevacao/sombra).
2. **Given** um dispositivo desktop, **When** o usuario clica e arrasta o icone de grip, **Then** o card segue o cursor e pode ser reposicionado.
3. **Given** qualquer dispositivo, **When** o card esta sendo arrastado, **Then** a posicao de destino e indicada visualmente (placeholder ou linha guia).

---

### Edge Cases

- O que acontece quando ha apenas 1 musica na escala? O icone de grip ainda aparece mas arrastar nao altera nada. O badge exibe "1".
- O que acontece se dois usuarios reordenam simultaneamente? A ultima escrita prevalece (last-write-wins). Nao e necessario controle de concorrencia otimista nesta versao.
- O que acontece com escalas existentes que nao possuem ordem definida? A migracao deve atribuir ordem baseada na data de criacao dos registros existentes.
- O que acontece se o salvamento da ordem falha? A interface reverte para a ordem anterior (optimistic rollback) e exibe um toast de erro.

## Requirements *(mandatory)*

### Functional Requirements

- **FR-001**: O sistema DEVE armazenar a ordem de cada musica dentro de uma escala como um valor inteiro na tabela de relacionamento.
- **FR-002**: O sistema DEVE retornar as musicas de uma escala ordenadas pelo campo de ordem.
- **FR-003**: O sistema DEVE permitir atualizar a ordem de todas as musicas de uma escala em uma unica operacao.
- **FR-004**: O sistema DEVE atribuir automaticamente a proxima posicao disponivel ao adicionar uma nova musica a uma escala.
- **FR-005**: O sistema DEVE recalcular as posicoes das musicas restantes ao remover uma musica de uma escala.
- **FR-006**: O frontend DEVE exibir um badge com o numero da posicao e um icone de arraste (grip handle) em cada card de musica para usuarios com permissao de escrita. Usuarios sem permissao veem apenas o badge de posicao.
- **FR-007**: O frontend DEVE suportar reordenacao por drag-and-drop em dispositivos touch (long press + drag) e mouse (click + drag).
- **FR-008**: O frontend DEVE usar estrategia optimistic UI: atualizar a interface imediatamente apos o drop, salvar em background, e reverter com toast de erro em caso de falha.
- **FR-009**: A migracao de banco de dados DEVE popular o campo de ordem para registros existentes, usando a data de criacao como criterio de ordenacao.

### Key Entities

- **Eventos_Musicas (tabela pivot)**: Relacionamento N:N entre Eventos e Musicas. Atributos atuais: id, evento_id, musicas_id, tenant_id. Novo atributo: **ordem** (inteiro, posicao da musica dentro da escala).

## Success Criteria *(mandatory)*

### Measurable Outcomes

- **SC-001**: Usuarios conseguem reordenar musicas em uma escala em menos de 5 segundos por reposicionamento.
- **SC-002**: A ordem das musicas persiste corretamente apos recarregar a pagina em 100% dos casos.
- **SC-003**: A interacao de arrastar e soltar funciona de forma fluida tanto em dispositivos moveis quanto desktop, sem travamentos ou artefatos visuais.
- **SC-004**: Escalas existentes sem ordem definida exibem musicas em ordem consistente (por data de adicao) apos a migracao.
- **SC-005**: Em caso de falha de salvamento, a interface reverte a ordem anterior e exibe feedback de erro em menos de 2 segundos.

## Assumptions

- A biblioteca de drag-and-drop utilizada sera compativel com touch e mouse (ex: dnd-kit, que ja e padrao no ecossistema React/shadcn).
- Nao e necessario suporte a reordenacao por teclado (acessibilidade via keyboard) nesta primeira versao.
- A latencia aceitavel para salvar a nova ordem e de ate 1 segundo.
