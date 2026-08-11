# LouvorFlow

Sistema multi-igreja para organizar o ministério de louvor: o catálogo de músicas da igreja, quem serve em cada culto e em qual função, e o compartilhamento dessa escala com o time.

Este arquivo é **glossário, não especificação** — define o que cada termo significa, não como está implementado. Quando duas palavras disputam o mesmo conceito, a canônica é o título da entrada e as demais ficam em `_Avoid_`.

## Language

### Igreja e pessoas

**Igreja**:
A comunidade que usa o sistema. Cada igreja enxerga apenas os próprios dados — músicas, integrantes e configurações nunca atravessam essa fronteira.
_Avoid_: tenant, organização, congregação

**Integrante**:
Pessoa que serve no ministério de louvor de uma igreja e pode ser escalada. Uma mesma pessoa pode pertencer a mais de uma igreja.
_Avoid_: usuário, membro, member

**Função**:
O que um integrante faz quando serve — Vocal, Violão, Bateria, Ministração. É vocabulário de ministério, sem nenhuma relação com permissão de acesso.
_Avoid_: papel, role, cargo

**Grupo de funções**:
Agrupamento que a igreja define para organizar suas funções em blocos ordenados (Ministração, Direção Musical, Vocal, Instrumentos, Outros). Determina a ordem em que os integrantes aparecem na escala compartilhada.
_Avoid_: categoria de função, seção, naipe

**Permissão**:
Autorização de acesso a uma parte do sistema. Vive num plano separado de **Função** — um baterista pode ser administrador e um ministro pode não ser.
_Avoid_: role, função (quando se fala de acesso), privilégio

### Repertório

**Música**:
Uma canção do catálogo da igreja, identificada pelo nome. É a entidade que a igreja busca e filtra; o material prático (cifra, letra, andamento) vive nas suas versões.
_Avoid_: canção, louvor, song

**Versão**:
A gravação/interpretação de uma música por um artista específico, com a cifra, a letra, o BPM, o link e a intensidade daquela leitura. Uma música pode ter várias versões, e uma versão pode não ter artista.
_Avoid_: arranjo, gravação, rendition

**Artista**:
Quem interpreta uma versão — o ministério ou cantor de referência (Fernandinho, Gabriela Rocha, Diante do Trono).
_Avoid_: banda, intérprete, autor

**Categoria**:
Classificação temática ou litúrgica de uma música definida pela igreja (Adoração, Celebração, Congregacional). Uma música pode ter várias.
_Avoid_: tag, gênero, estilo

**Intensidade**:
O nível de energia de uma versão — Calma, Média ou Agitada. É atributo da versão, não da música: o mesmo louvor pode ter uma leitura calma e outra agitada.
_Avoid_: **tempo** (palavra ambígua: sugere andamento/BPM, que é outro campo), andamento, vibe

**Tonalidade**:
O tom em que a igreja toca a música (C, D, Em). Ordem musical, nunca alfabética.
_Avoid_: tom (fora de contexto), key, cifra

### Escala

**Evento**:
A ocasião datada em que o ministério serve — um culto, um ensaio, uma conferência. Tem data, descrição e tipo.
_Avoid_: culto (é só um dos tipos), agenda, compromisso

**Tipo de evento**:
A natureza do evento, definida pela igreja (Culto de Domingo, Ensaio, Vigília).
_Avoid_: categoria de evento

**Escala**:
A designação de quem serve num evento e em qual função. Um integrante pode acumular funções na mesma escala (tocar violão e ministrar).
_Avoid_: **scale** (falso cognato — em inglês o termo é *roster*/*schedule*, nunca *scale*), lista, rodízio

**Repertório do evento**:
As músicas escolhidas para um evento, em ordem de execução, cada uma apontando para a versão que será tocada.
_Avoid_: setlist, playlist, seleção

## Ambiguidades conhecidas (não resolvidas no código)

Registradas para que ninguém as "conserte" por engano — resolvê-las exige renomeação, que o `CLAUDE.md` só autoriza mediante pedido explícito.

- **Escala ≠ Evento, mas a interface usa os dois como sinônimos.** A rota de escalas exibe o detalhe do evento, e a listagem chama-se `Scales`. Pelo glossário acima, *Evento* é a ocasião e *Escala* é a designação de pessoas nela.
- **`Scales` é tradução incorreta de "escala".** Em inglês, *scale* é escala musical ou escala de medida — a palavra para escala de serviço é *roster*.
- **"Função" aparece nos dois planos.** Ministério (Vocal, Violão) e controle de acesso (RBAC) usam a mesma palavra em português. Neste glossário, acesso é sempre **Permissão**.
