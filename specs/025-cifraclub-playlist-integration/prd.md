# PRD — Integração LouvorFlow ↔ CifraClub

**Status:** Draft v1.1 · **Autor:** LouvorFlow Team · **Data:** 17 mai 2026
**Versão do app-alvo:** LouvorFlow Web (branch `develop`)
**Escopo:** Cadastro de link CifraClub por versão de música + geração e compartilhamento de playlist a partir de uma escala.

> **Changelog v1.1**: DeepSearch ampliado — adicionados dados de mercado (47.4 mi evangélicos BR, 110k igrejas, R$ 21.5 bi/ano), CifraClub PRO 2026 (R$ 99/ano, 1.000 listas × 1.000 cifras, Smart Scrolling com IA), tamanho do CifraClub (635k+ cifras, 21 milhões de instalações Play Store, app v3.5.7). Endereçada feedback do produto: (a) coexistência com share WhatsApp atual evitando poluição; (b) investigação concluída sobre "link único que abre a playlist no CifraClub" — **não existe publicamente**, detalhado em §16. Novo §15 sobre estratégia de coexistência de shares. Roadmap atualizado.
>
> **Changelog v1.2 (2026-05-17)**: Re-investigação técnica via Playwright (durante a feature 026) **revisa parcialmente §4.1, §11 e §16**. Achados centrais: (a) **URLs públicas de listas EXISTEM** no formato `https://www.cifraclub.com.br/musico/{userId}/repertorio/{listId}/` e são compartilháveis pela própria UI do CifraClub (botão "Copiar link"); (b) **API pública de leitura EXISTE** em `https://api.cifraclub.com.br/v3/songbook/{listId}` (JSON sem autenticação) — devolve nome, owner, lista de músicas com `siteUrl`, `tone`, `stdTone`, `isMinorScale`, `capo`, `tuning` e o fragmento completo `#instrument=guitar&tuning=…&capo=0&key=N`; (c) **tabela cromática absoluta** `A=0..Ab=11` confirmada empiricamente pelos próprios dados gerados pelo CifraClub (`C→key=3`, `G→key=10`, `Am→key=0`); (d) Fase 2.5 do roadmap (hub URL hospedado no LouvorFlow) **fica obsoleta** — a URL pública do próprio CifraClub supre essa necessidade. Detalhes em §16. APIs de escrita (POST/PUT/DELETE de listas) ainda não investigadas — precisam login e ficam como spike opcional na Fase 3.

---

## 1. Executive Summary

Hoje, ao montar uma escala (evento) no LouvorFlow, o líder organiza títulos, tonalidades e responsáveis — mas, no ensaio e no culto, **cada músico precisa abrir manualmente a cifra de cada música no site/app do CifraClub**, perdendo tempo e quebrando o fluxo. A relação entre uma versão de música no LouvorFlow e seu correspondente no CifraClub é informal (no melhor cenário, alguém cola um link no WhatsApp; no pior, cada músico procura por conta própria, às vezes encontrando cifras erradas ou em outra tonalidade).

Esta feature adiciona um **vínculo formal** entre cada versão de música e sua cifra no CifraClub, e transforma uma escala inteira em uma **playlist exportável** com um clique. A entrega inicial usa **somente URLs públicos** do CifraClub — sem dependência de API privada, sem necessidade de PRO no CifraClub, e sem fricção de instalação. Uma segunda fase, opt-in, avaliará a viabilidade de criar listas persistentes diretamente na conta do CifraClub do usuário via APIs/integrações privadas.

**Resultado esperado:** o líder gera a playlist em 1 toque; toda a equipe abre a sequência correta de cifras (no app oficial do CifraClub se instalado, no navegador caso contrário); o tempo entre "abrir a escala" e "começar o ensaio" cai de ~5 min para <30 segundos.

---

## 2. Problema e Oportunidade

### 2.1 Problema

Líderes de louvor de igrejas brasileiras gerenciam dois universos hoje:

1. **Planejamento** (LouvorFlow, planilhas, grupos de WhatsApp): quais músicas, em que tom, com quais integrantes.
2. **Execução** (CifraClub, papel, prints, transferência de arquivos): cifras, letras, sequência durante o ensaio/culto.

A ponte entre os dois é **manual e fragmentada**:

- Não há vínculo persistente entre uma versão de música cadastrada no LouvorFlow e a cifra correspondente no CifraClub.
- A "playlist" do culto vive na cabeça do líder ou em mensagens dispersas no grupo.
- Cada músico abre, em momentos diferentes, cifras potencialmente distintas — versões erradas, tonalidades inconsistentes, ou cifras de baixa qualidade.
- Quando há mudança de última hora (música extra, reordenação), comunicar a equipe envolve refazer mensagens e checar 1-a-1 se todos receberam.

### 2.2 Oportunidade

O CifraClub é, na prática, **a fonte canônica de cifras** para a maioria dos músicos de igreja no Brasil — 400 mil+ cifras, app gratuito amplamente instalado, mesmo sem subscrição PRO. Vincular formalmente versão↔cifra e gerar playlists exportáveis:

- **Reduz fricção operacional** sem custo para a equipe (não exige PRO no CifraClub).
- **Reforça o LouvorFlow como hub central** do ministério — o lugar onde a escala vira execução, não só registro.
- **É um diferencial competitivo único no mercado BR**: nossa pesquisa (seção 4) não encontrou nenhum app de gestão de louvor (nacional ou internacional) com integração explícita ao CifraClub. Apps internacionais usam CCLI SongSelect / MultiTracks; apps BR como LouveApp e Cante as Escrituras tratam cifras como conteúdo interno.

---

## 3. Objetivos e Métricas de Sucesso

### 3.1 Objetivos (12 semanas pós-lançamento)

- **O1.** Encurtar o caminho do líder até "cifras prontas para a equipe" para ≤30 segundos.
- **O2.** Estabelecer `cifraclub_url` como dado **persistente e versionado** (por artista) das músicas no LouvorFlow.
- **O3.** Validar adoção do fluxo "Playlist CifraClub" antes de investir em integração via API privada.

### 3.2 KPIs

| Métrica | Meta 30d | Meta 90d |
|---|---|---|
| % de versões de música com `cifraclub_url` preenchido | 25% | 60% |
| % de escalas com ≥1 música com link CifraClub | 40% | 80% |
| Cliques em "Playlist CifraClub" / escala criada | 0.4 | 1.0 |
| Cliques em "Compartilhar WhatsApp" da playlist / clique total | 50% | 60% |
| Toasts de erro ("sem link CifraClub") / abertura de diálogo | <30% | <15% |

### 3.3 Métricas qualitativas

- NPS específico da feature (in-app survey após 3º uso): meta ≥40.
- Citação espontânea em entrevistas com líderes (n=10 a 90d): pelo menos 6 mencionam a feature como "muito útil" ou "indispensável".

### 3.4 Não-objetivos (explicitamente fora do escopo desta entrega)

- **N1.** Criação de listas persistentes na conta CifraClub do usuário (depende de API privada/parceria — vide §11).
- **N2.** Autocompletar `cifraclub_url` a partir do nome do artista+música (algoritmo de match — fase 2).
- **N3.** Validação de que a URL pertence ao domínio `cifraclub.com.br` (aceitamos qualquer http/https para não bloquear variantes legítimas como `m.cifraclub.com.br`).
- **N4.** Cifra/letra exibida dentro do LouvorFlow (continuamos delegando ao CifraClub — eles são a fonte canônica).
- **N5.** Suporte a apps concorrentes (Cifras.com.br, Songbook, etc.). Pode ser estudado depois.

---

## 4. Análise de Mercado e Pesquisa (DeepSearch)

### 4.1 CifraClub — fatos confirmados

| Item | Achado | Fonte |
|---|---|---|
| Padrão de URL | `https://www.cifraclub.com.br/{artista-slug}/{musica-slug}/` com slugs em minúsculas e hífens | code4music/cifraclub-api, exemplos de busca |
| Variantes de URL | `/partituras/`, `/tabs-gaita/`, `/simplificada.html`, subdomínio `m.cifraclub.com.br` | Resultados de busca por exemplos reais |
| Empresa & idade | Studio Sol (mesma dona do Palco MP3), CifraClub desde 1996 | Wikipedia, Studio Sol |
| Tamanho de catálogo | **635k+ cifras** registradas (cresceu de 400k em descrições antigas) | App descriptions atuais |
| Instalações | **~21 milhões** no Google Play Store; 776k reviews; rating 4.8 | SensorTower / Play Store |
| Versão atual do app | 3.5.7 (12 mar 2026) | apkgk.com |
| Conta "Cifra Club ID" | Login obrigatório para usar "Minhas Listas"; sincroniza listas entre dispositivos | suporte.cifraclub.com.br |
| Listas no app | Salva automaticamente cifras acessadas; permite criar listas próprias | App Store, Play Store, blog CifraClub |
| Quantas listas? | **Free**: limitado (1 lista). **PRO**: até **1.000 listas × 1.000 cifras cada** | Blog CifraClub PRO |
| Preço PRO (2026) | **R$ 99/ano (~R$ 8,25/mês)** com 70% de desconto sobre o plano mensal · 7 dias grátis | cifraclub.com.br/assine |
| Novidades 2025-2026 | "Smart Scrolling" (AI-assisted scroll), redesign das listas, "Create Your Own Version", melhorias de navegação | Changelog Play Store |
| Offline | Suportado para listas/cifras salvas | App Store description |
| **Compartilhamento de listas entre usuários** | **EXISTE (revisado em v1.2)**: URL pública no formato `https://www.cifraclub.com.br/musico/{userId}/repertorio/{listId}/`. A própria UI do CifraClub oferece botão "Copiar link" + share Facebook/Twitter. Listas marcadas como `public: true` no backend são acessíveis sem login. Lista também pode ser nominal (`/repertorio/favoritas/`, `/consegui-tocar/`, `/ainda-vou-tocar/`). | Investigação Playwright em 2026-05-17 (feature 026); ver §16 |
| **API oficial** | **EXISTE leitura pública não-documentada (revisado em v1.2)**: `GET https://api.cifraclub.com.br/v3/songbook/{listId}` retorna JSON completo da lista (id, name, userId, songs[] com siteUrl/tone/stdTone/capo/tuning/isMinorScale) sem autenticação. Endpoint `/v3/user/{userId}/badges` também responde público. **APIs de escrita** (POST/PUT/DELETE) ainda não testadas — requerem login. Sem documentação oficial publicada. | Investigação Playwright em 2026-05-17 (feature 026); endpoints visíveis na devtools da página da lista |
| **Deep link scheme** documentado (`cifraclub://`) | **Não encontrado** publicamente | Buscas múltiplas |
| Universal Links / App Links | Comportamento padrão Android/iOS: URLs `cifraclub.com.br` abrem no app se instalado (não confirmado oficialmente em assetlinks.json, mas é o comportamento dominante na plataforma) | Inferido — não documentado |

### 4.1.1 Tamanho de mercado (TAM/SAM) — Brasil

| Métrica | Valor | Fonte |
|---|---|---|
| Evangélicos no Brasil | **47,4 milhões** (26,9% da população, Censo 2022) | IBGE / CNN Brasil |
| Igrejas evangélicas registradas | **~110-120 mil** (109.560 em 2019, crescimento contínuo) | Instituto Paracleto / CPAD |
| Mercado evangélico (gospel + serviços) | **R$ 21,5 bilhões/ano** | Exame |
| Projeção | Evangélicos serão maioria religiosa em **2032** | Estudo Datafolha/USP |
| Composição | 55,4% mulheres (vs 51,8% da pop geral) | IBGE |

**Implicação para o LouvorFlow**: o SAM (igrejas com equipe de louvor estruturada e que usariam um app de gestão) é uma fração relevante das ~110k igrejas — estimativa conservadora de **15-25k igrejas** com 5+ integrantes em equipe musical. Cada uma com 5-15 usuários potenciais → mercado endereçável de **75k-375k usuários ativos**. CifraClub é onipresente neste segmento (custo de aquisição zero, gratuito, instalado em ~21 mi de dispositivos BR).

### 4.2 Implicações de projeto

1. **A "playlist" no nosso contexto é uma lista ordenada de URLs públicos.** O usuário não precisa estar logado no CifraClub nem ter PRO. Ao tocar uma URL no celular, o app oficial do CifraClub abre automaticamente (se instalado) via Universal/App Link — caso contrário, abre o navegador.
2. **Vínculo CifraClub ID ↔ LouvorFlow é inviável hoje** (sem API pública). Tentativas via scraping têm risco operacional alto (TOS, fragilidade a mudanças). Tratamos como fase 2.
3. **Não tente reinventar listas dentro do CifraClub.** Mesmo a feature nativa deles é pessoal e premium. Nosso valor não é "criar listas pra eles" — é "transformar a escala em um link/sequência consumível em segundos".

### 4.3 Cenário competitivo

| App | Mercado | Integração com CifraClub |
|---|---|---|
| Planning Center Services | Internacional (EN/PT) | Não. Integra com CCLI SongSelect, Spotify, Apple Music |
| OnSong | Internacional | Não. Integra com Planning Center, MultiTracks |
| WorshipTools | Internacional | Não. CCLI SongSelect, Loop Community |
| SongSelect (CCLI) | Internacional (LATAM) | Não. Próprio repositório de cifras licenciadas |
| LouveApp | Brasil | Não — conteúdo de cifras interno |
| Cante as Escrituras | Brasil | Não — conteúdo de cifras curado interno |
| InChurch | Brasil (gestão geral) | Não — não tem foco em música |
| **LouvorFlow (proposto)** | **Brasil** | **Sim — primeiro a integrar formalmente** |

**Conclusão estratégica:** a integração com CifraClub é um **moat estreito mas defensável** no mercado brasileiro. Ela alavanca a fonte de cifras que os músicos já usam, em vez de competir com ela.

### 4.4 Pricing comparison — onde o LouvorFlow se posiciona

| Produto | Plano free | Plano pago BR (2026) |
|---|---|---|
| CifraClub | Limitado a 1 lista pessoal, com anúncios | **R$ 99/ano** (~R$ 8,25/mês), 1.000 listas × 1.000 cifras, sem anúncios, Smart Scrolling |
| Planning Center Services | 30-day trial; 5 plans/mês free | USD 14/mês até USD 339/mês (igreja >250 pessoas) |
| OnSong | USD 39,99 compra única (iOS) | — |
| LouveApp | Free (com limitação) | n/d |
| **LouvorFlow** | Atual: free (modelo a definir) | TBD |

**Observação estratégica**: o LouvorFlow é o único da lista que **fala português nativo, é multi-tenant para igrejas, e oferece integração com CifraClub gratuita**. Mesmo o usuário CifraClub PRO se beneficia (a feature funciona melhor para ele, porque ele já tem suas listas pessoais sincronizadas).

---

## 5. Personas e User Stories

### 5.1 Personas primárias

**P1 — Marcos, Líder de Louvor (35a, voluntário em igreja média).**
Monta a escala domingo de manhã pelo celular antes do culto. Já tem dor com o "envio de cifras" no grupo de WhatsApp da equipe.

**P2 — Camila, Backing Vocal (24a, baterista do louvor da quarta).**
Recebe a escala por WhatsApp e abre as cifras uma a uma no app do CifraClub durante o ensaio. Não tem PRO.

**P3 — Pastor Eduardo, Admin do tenant da igreja (50a).**
Não usa diretamente, mas monitora se a equipe está bem servida pela ferramenta. Quer ver adoção.

### 5.2 User Stories

| ID | Como… | Quero… | Para que… | Prioridade |
|---|---|---|---|---|
| US-1 | Líder (Marcos) | Cadastrar o link do CifraClub em cada versão de música | que os músicos cheguem na cifra correta sem procurar | **P0** |
| US-2 | Líder (Marcos) | Gerar a playlist de uma escala em 1 clique | enviar para o grupo da equipe sem fricção | **P0** |
| US-3 | Líder (Marcos) | Compartilhar a playlist via WhatsApp | usar o canal que a equipe já vive | **P0** |
| US-4 | Líder (Marcos) | Copiar todos os links em texto | colar em outro lugar (e-mail, Telegram, anotação) | **P0** |
| US-5 | Músico (Camila) | Receber um link único que abra a sequência | tocar a cifra certa na ordem certa, sem digitar nada | **P0** |
| US-6 | Líder (Marcos) | Ver claramente quais músicas ainda não têm link cadastrado | priorizar o cadastro do que falta | **P1** |
| US-7 | Líder (Marcos) | Editar/atualizar o link de uma versão | corrigir um link errado ou substituir por uma cifra melhor | **P1** |
| US-8 | Músico (Camila) | Abrir um link individual diretamente da playlist | revisar uma música específica antes do ensaio | **P1** |
| US-9 | Admin (Pastor Eduardo) | Ver métrica de adoção da feature | decidir se a ferramenta está sendo bem utilizada | **P2** (instrumentação futura, fora desta entrega) |

### 5.3 Jornada do usuário — fluxo principal (US-2 → US-5)

```text
[Marcos abre escala] → [Toca "CifraClub"] → [Vê lista ordenada + stats "8 de 10 com link"]
   → [Toca "Compartilhar WhatsApp"] → [Escolhe grupo da equipe] → [Mensagem enviada]
         ↓
[Camila recebe no WhatsApp] → [Toca primeiro link] → [App CifraClub abre na cifra]
   → [Termina de revisar] → [Volta WhatsApp] → [Toca segundo link] → ... → [Ensaio começa]
```

---

## 6. Requisitos Funcionais

### RF-1 · Cadastro do `cifraclub_url` por versão

- **RF-1.1.** Cada **versão de música** (`Artistas_Musicas`) deve poder armazenar um campo opcional `cifraclub_url` (string).
- **RF-1.2.** O campo é exposto no formulário de criação/edição de versão (componente `VersaoForm`) e nos endpoints REST relevantes.
- **RF-1.3.** Validação de entrada: aceita string vazia → trata como `null`; valida ser URL http(s); rejeita `javascript:`, `data:`, `vbscript:`.
- **RF-1.4.** Não há restrição de domínio (aceita `cifraclub.com.br`, `m.cifraclub.com.br`, qualquer http/https) — pesquisa mostrou que variantes legítimas existem.
- **RF-1.5.** O campo é persistido por versão, ou seja, cada artista de uma mesma música pode ter sua própria cifra distinta.

### RF-2 · Endpoint de Playlist CifraClub

- **RF-2.1.** Novo endpoint `GET /api/eventos/:id/cifraclub-playlist` retorna a playlist ordenada da escala.
- **RF-2.2.** Cada item: `{ ordem, musica_id, nome, tom, artista_nome, cifraclub_url }`. Ordem segue o campo `ordem` de `Eventos_Musicas`.
- **RF-2.3.** Para cada música, o link é resolvido nesta ordem:
  1. `versao_selecionada.cifraclub_url` (escolha explícita do líder).
  2. Senão, primeira versão da música em ordem cronológica de criação que tenha `cifraclub_url` definido.
  3. Senão, `cifraclub_url: null` (música aparece na lista mas sem link).
- **RF-2.4.** Resposta inclui `stats: { total, com_link, sem_link }` para o frontend exibir o resumo "X de Y músicas com cifra".
- **RF-2.5.** Autenticação: `ensureAuthenticated` + `ensureTenantContext` (qualquer usuário autenticado com tenant ativo — mesma regra dos demais GETs do tenant).
- **RF-2.6.** Erros: 404 se evento não existir; 401 se sem token; 403 se sem tenant.

### RF-3 · Diálogo de Playlist na UI

- **RF-3.1.** Botão "CifraClub" no header de ações da página de detalhe de escala (`EventoDetail.tsx`), entre `EscalaShareActions` e "Excluir".
- **RF-3.2.** Mobile: botão icon-only (`Guitar` lucide-icon) com `aria-label="Gerar playlist CifraClub"`; Desktop: ícone + label "CifraClub".
- **RF-3.3.** Ao clicar: abre `Dialog` shadcn com:
  - Header: título "Playlist CifraClub", subtítulo com nome do evento e data formatada (pt-BR).
  - Stat: badge "8 de 10 músicas com cifra cadastrada" (ou "Nenhuma música possui cifra cadastrada" se 0).
  - Lista ordenada (`<ol>`): cada item mostra `ordem · Nome (Tom) · Artista` e — se houver — um botão "Abrir" (ícone `ExternalLink`) que abre a URL em nova aba (após `isSafeUrl` guard). Sem link → texto cinza em itálico "Sem link CifraClub".
  - Footer com 3 ações:
    - **Copiar links** — copia texto plano numerado para a clipboard, com confirmação visual `Check` por 3s.
    - **Compartilhar no WhatsApp** — abre `wa.me/?text=...` com a playlist formatada (markdown WhatsApp: header em negrito). Guard `WHATSAPP_URL_SAFE_LIMIT = 3800` reaproveitado de `EscalaShareActions.tsx:43`.
    - **Fechar**.

### RF-4 · Formato do texto exportado (clipboard / WhatsApp)

Exemplo:

```text
*Culto Domingo Manhã* — _17/05/2026 10:00_

🎸 *Playlist CifraClub* (8 de 10 músicas com cifra)

1. Rendido Estou (G) — Aline Barros
   https://www.cifraclub.com.br/aline-barros/rendido-estou/
2. Grande é o Senhor (D) — Adhemar de Campos
   https://www.cifraclub.com.br/adhemar-de-campos/grande-e-o-senhor/
3. Nada Além do Sangue (Am)
   _(sem link CifraClub)_
...
```

- **RF-4.1.** Header inclui tipo do evento + data formatada.
- **RF-4.2.** Cada item numerado; URL em linha separada com 3 espaços de indent (consistente com o formato existente em `whatsapp-share.ts:50`).
- **RF-4.3.** Músicas sem link aparecem como `_(sem link CifraClub)_` em itálico WhatsApp.

### RF-5 · Acessibilidade & responsividade

- **RF-5.1.** Todos os botões com `aria-label` semântico.
- **RF-5.2.** Diálogo testado em viewport 360×740 (Galaxy S8) — footer empilha `flex-col sm:flex-row`; nomes truncam com `truncate min-w-0`.
- **RF-5.3.** Navegação por teclado: `Tab` percorre lista → ações; `Esc` fecha o diálogo (padrão Dialog shadcn).
- **RF-5.4.** Toast Sonner para sucesso/erro (consistente com `EscalaShareActions:96`).

### RF-6 · Telemetria mínima (opcional para v1)

- Log no backend (info-level) quando o endpoint `cifraclub-playlist` é chamado: `{ eventoId, tenantId, total, com_link }`.
- Frontend dispara console.debug; instrumentação formal (analytics) fica para fase 2.

---

## 7. Requisitos Não-Funcionais

| Categoria | Requisito |
|---|---|
| **Performance** | Endpoint `cifraclub-playlist` deve responder em <300ms p95 (apenas lê dados já carregados pelo `EVENTO_SHOW_SELECT`). |
| **Segurança** | URLs validadas em 2 camadas: Zod no input + `isSafeUrl()` na renderização. Mesmo padrão do `link_versao`. |
| **Multi-tenancy** | Endpoint scoped via `ensureTenantContext`. Impossível listar playlist de tenant alheio (FK chain garante invariante). |
| **Compatibilidade** | Campo nullable, sem default. Versões antigas continuam funcionando. Migração non-blocking, sem backfill. |
| **i18n** | Strings em pt-BR (audience é igreja brasileira). Sem necessidade de outros idiomas. |
| **Offline (frontend)** | Não há requisito offline para a feature em si — a playlist é gerada server-side em tempo real. |
| **Limite de URL** | WhatsApp `wa.me` truncamento ~4KB. Aplicar `WHATSAPP_URL_SAFE_LIMIT = 3800` (reutilizar constante existente). Se exceder, toast orienta a usar "Copiar". |
| **Privacidade** | Não compartilhamos dados do usuário com CifraClub — só geramos links públicos. Nenhuma PII vaza pela URL. |

---

## 8. Especificação Técnica (resumida)

> Esta seção é um esqueleto técnico. A implementação detalhada será feita pelo time de engenharia após aprovação do PRD.

### 8.1 Modelo de dados

```text
Artistas_Musicas (existing)
├── ... (campos atuais)
└── cifraclub_url  TEXT NULLABLE  ← NOVO
```

Migração SQL: `ALTER TABLE "artistas_musicas" ADD COLUMN "cifraclub_url" TEXT;` Sem default, sem backfill.

### 8.2 Contratos de API

#### 8.2.1 Versão (modificações em endpoints existentes)

`POST /api/musicas/:musicaId/versoes`, `PUT /api/musicas/:musicaId/versoes/:versaoId`, `POST /api/musicas/complete`, `PUT /api/musicas/:id/complete`:

- **Body**: aceita campo opcional `cifraclub_url: string?` (validação http/https).
- **Response**: passa a incluir `cifraclub_url: string | null` no objeto de versão.

#### 8.2.2 Novo endpoint

```text
GET /api/eventos/:id/cifraclub-playlist
Auth: Bearer token + tenant ativo
```

**Response 200**:

```json
{
  "evento": {
    "id": "uuid",
    "data": "2026-05-17T13:00:00Z",
    "descricao": "Culto Domingo Manhã",
    "tipo_evento": "Culto Domingo Manhã"
  },
  "playlist": [
    {
      "ordem": 1,
      "musica_id": "uuid",
      "nome": "Rendido Estou",
      "tom": "G",
      "artista_nome": "Aline Barros",
      "cifraclub_url": "https://www.cifraclub.com.br/aline-barros/rendido-estou/"
    }
  ],
  "stats": { "total": 10, "com_link": 8, "sem_link": 2 }
}
```

**Response 404**: `{ "erro": "Evento não encontrado", "codigo": 404 }`

### 8.3 Camadas de código a tocar (referência futura)

| Camada | Arquivo |
|---|---|
| Schema Prisma | `packages/backend/prisma/schema.prisma` (model `Artistas_Musicas`) |
| Migração | `packages/backend/prisma/migrations/<ts>_add_cifraclub_url_to_artistas_musicas/migration.sql` |
| Types | `packages/backend/src/types/index.ts` — `VersaoRaw`, `Musica.versoes[]`, `VersaoMusicaShowRaw`, `VersaoMusicaEvento`, `MUSICA_SELECT`, `EVENTO_SHOW_SELECT`, `CreateMusicaCompleteInput`, `UpdateMusicaCompleteInput` |
| Validators | `packages/backend/src/validators/musicas.validators.ts` |
| Service Músicas | `packages/backend/src/services/musicas.service.ts` |
| Repo Músicas | `packages/backend/src/repositories/musicas.repository.ts` |
| Service Eventos (novo método) | `packages/backend/src/services/eventos.service.ts` — `getCifraclubPlaylist(eventoId)` |
| Controller Eventos (novo handler) | `packages/backend/src/controllers/eventos.controller.ts` |
| Rotas | `packages/backend/src/routes/eventos.routes.ts` |
| OpenAPI | `packages/backend/docs/openapi.json` |
| Fakes (tests) | `packages/backend/tests/fakes/{fake-musicas,fake-eventos,mock-data}.{ts}` |
| Service tests | `packages/backend/tests/services/{musicas,eventos}.service.test.ts` |
| Schemas FE Zod | `packages/frontend/src/schemas/musica.ts`, `evento.ts`, novo `cifraclub.ts` |
| Service FE | `packages/frontend/src/services/eventos.ts` |
| Hook FE | `packages/frontend/src/hooks/use-eventos.ts` |
| Lib formatação | novo `packages/frontend/src/lib/cifraclub-playlist.ts` |
| Form versão | `packages/frontend/src/components/VersaoForm.tsx` |
| Diálogo | novo `packages/frontend/src/components/CifraclubPlaylistDialog.tsx` |
| Integração na escala | `packages/frontend/src/components/EventoDetail.tsx` |

### 8.4 Utilidades reutilizadas (não recriar)

- `safeUrlSchema` em `packages/backend/src/validators/musicas.validators.ts:15`
- `isSafeUrl` em `packages/frontend/src/lib/utils.ts`
- `apiFetch` em `packages/frontend/src/lib/api.ts`
- Padrão `EscalaShareActions` em `packages/frontend/src/components/EscalaShareActions.tsx` (timer 3s, `WHATSAPP_URL_SAFE_LIMIT=3800`, `wa.me`, Sonner)
- Ícone `Guitar` de `lucide-react` (já importado em `EventoDetail.tsx:39`)

---

## 9. UX / UI Spec — Visualização do Diálogo

```text
┌─────────────────────────────────────────────┐
│  Playlist CifraClub                  [X]   │
│  Culto Domingo Manhã · 17/05/2026 10:00     │
│                                             │
│  ┌─ 🎸 8 de 10 músicas com cifra ────────┐ │
│  └────────────────────────────────────────┘ │
│                                             │
│  1. Rendido Estou (G) — Aline Barros [↗]   │
│  2. Grande é o Senhor (D) — A. Campos [↗]  │
│  3. Nada Além do Sangue (Am)                │
│     _Sem link CifraClub_                    │
│  4. Tua Graça Me Basta (E) — Davi Sac. [↗] │
│  ...                                        │
│                                             │
│  ┌──────────┐ ┌──────────────┐ ┌─────────┐ │
│  │ Copiar   │ │ WhatsApp     │ │ Fechar  │ │
│  └──────────┘ └──────────────┘ └─────────┘ │
└─────────────────────────────────────────────┘
```

**Mobile (360px)**: footer empilha verticalmente; ícones-only nos botões com `aria-label`.

---

## 10. Edge Cases & Riscos

| # | Cenário | Comportamento |
|---|---|---|
| EC-1 | Escala sem músicas | Diálogo abre, lista vazia, stat "0 de 0", botões "Copiar"/"WhatsApp" disabled |
| EC-2 | Música sem versão selecionada | Backend resolve via fallback (primeira versão com link) — vide RF-2.3 |
| EC-3 | Música sem nenhuma versão com link | Item aparece sem URL, ações por-linha desabilitadas |
| EC-4 | Mensagem WhatsApp > 3800 chars (escala muito longa) | Toast erro orientando a usar "Copiar"; botão WhatsApp não aciona |
| EC-5 | URL inválida cadastrada via API direta (bypass) | `isSafeUrl()` no frontend não renderiza o link clicável; texto da URL mostra mas sem ação |
| EC-6 | Usuário sem permissão `escalas.read` | 403 do backend (já garantido pelo middleware existente) |
| EC-7 | Tenant em transição (sem `tenantId`) | 403 do middleware `ensureTenantContext` |
| EC-8 | Pop-up bloqueado ao "Abrir" individual | Toast orienta a habilitar pop-ups (padrão de `EscalaShareActions:124`) |
| EC-9 | CifraClub muda padrão de URL no futuro | URLs cadastradas continuam funcionando até a redirecionamento quebrar; sem ação imediata necessária — campo é "fire and forget" |
| EC-10 | Tonalidade do LouvorFlow ≠ tonalidade da cifra no CifraClub | O LouvorFlow só **referencia** o link; a transposição é responsabilidade do app CifraClub. Documentar isso na UI (microcopy futura) |

### Riscos estratégicos

| R | Descrição | Mitigação |
|---|---|---|
| R1 | CifraClub muda esquema de URLs e quebra links cadastrados | Risco baixo (URLs estáveis há anos); links são opcionais — comportamento degrada graciosamente. Long-term: monitorar 404 em logs (não implementar nesta entrega) |
| R2 | Adoção baixa por preguiça de cadastrar links | Mitigar com "filtros visuais" — músicas sem link aparecem destacadas na lista (fase 2: campo no Songs.tsx) |
| R3 | CifraClub bloqueia "leitura automatizada" de URLs no futuro | Não aplicável a esta entrega (não fazemos scraping). Só faríamos parse em fase 2 (autocomplete). Postergar até decisão de fase 2 |
| R4 | Usuários querem listas persistentes na conta CifraClub | Sinalizar como roadmap fase 2; investigar parceria/API privada |

---

## 11. Roadmap Faseado

### Fase 1 — MVP (esta entrega)

Escopo descrito acima. Conclui o objetivo "playlist exportável a partir da escala". Estimativa: ~3 dias de engenharia (backend 1.5d + frontend 1.5d + tests + OpenAPI + revisão mobile).

### Fase 2 — Autocompletar URL (estimativa: 1-2 sprints)

- Ao digitar nome da música + artista no formulário, sugerir URL CifraClub candidata via slug-match (`{artista-slug}/{musica-slug}/`).
- Otimização: cache de slugs já cadastrados no tenant.
- Possível scraping leve (HEAD request para verificar 200) — avaliar TOS do CifraClub antes.

### Fase 2.5 — Hub URL "playlist em 1 link" (~~estimativa: 3-5 dias~~)

> **OBSOLETO em v1.2 (2026-05-17).** A investigação Playwright durante a feature 026 mostrou que **a URL pública de lista do próprio CifraClub** (`/musico/{userId}/repertorio/{listId}/`) já resolve a mesma necessidade sem hospedar nada do nosso lado. A nova proposta é a **feature 027** descrita abaixo. Texto original mantido por contexto histórico até a próxima limpeza geral do PRD.

~~- Nova rota pública somente-leitura `GET /p/:eventoId?t=<read-only token>` no LouvorFlow.~~
~~- Página mobile-first com lista numerada, progresso, próximo/anterior, e botão "Abrir cifra" por linha.~~
~~- Cada "Abrir cifra" dispara `window.location.href = cifraclub_url` → cai no app CifraClub via Universal/App Link.~~
~~- Token de leitura assinado (JWT curto, sem PII) regenerável pelo líder. Sem login para o convidado.~~
~~- Botão "Compartilhar via 1 link" no `CifraclubPlaylistDialog` passa a oferecer a opção de copiar a URL do hub em vez da lista bruta.~~
~~- **Resolve a dor "link único"** do feedback v1.1 sem dependência externa.~~

### Fase 2.6 (NOVA em v1.2) — Linkar lista pública do CifraClub por Evento (proposta: feature 027, ~1 dia)

> Detalhada em §16.3 Alternativa B'.

- Campo opcional `cifraclub_list_url` em `Eventos` (ou tabela associada). Validação: regex `^https://www\.cifraclub\.com\.br/musico/\d+/repertorio/[\w-]+/?$`.
- UI: input no formulário de Escala + botão "Abrir lista no CifraClub" no detalhe da Escala e no `CifraclubPlaylistDialog`.
- WhatsApp share: quando preenchido, mensagem ganha header `🎸 *Lista no CifraClub*: {url}` antes da lista de músicas individuais.
- Líder gera a lista manualmente no CifraClub (gratuito; ~5–10 min para 5 músicas, agilizado em iterações futuras pela função "Duplicar lista" do próprio CifraClub).
- **Sem sync automático**: se a escala mudar no LouvorFlow após cadastro, a lista do CifraClub fica desatualizada até nova edição manual. Documentar microcopy no input.
- **Resolve a dor "link único"** delegando para infraestrutura do CifraClub — zero hospedagem nossa, UX nativa do app.

### Fase 3 — Integração com conta CifraClub (estimativa: spike + 1 sprint, prazo 3-6 meses)

- **Path comercial**: contatar comercial Studio Sol/CifraClub para propor parceria (LouvorFlow envia listas para conta do usuário via API privada).
- Spike de 2 dias: avaliar viabilidade de OAuth ou autenticação via cookie (caso parceria não saia).
- Se viável: feature "Salvar playlist em Minhas Listas CifraClub" — opt-in, requer login do usuário no CifraClub via WebView/redirect.
- Risco: pode resultar em "não viável" — neste caso, Fase 2.5 (hub URL) supre a demanda permanentemente.

### Fase 4 — Métricas e iteração (contínua)

- Adicionar instrumentação (Mixpanel/PostHog) nos eventos: abrir diálogo, copiar, WhatsApp, abrir URL individual, abrir hub URL.
- Dashboard interno de KPIs (§3.2).
- Decidir investimentos com base em dados.

---

## 12. Open Questions (a confirmar antes do start)

1. **Q1.** Devemos mostrar o status "tem cifra CifraClub" também na listagem de músicas (`Songs.tsx`) — por exemplo, um ícone discreto ao lado do nome? Ajudaria líderes a verem onde falta cadastro. *Recomendação:* sim em fase 2; manter MVP enxuto.
2. **Q2.** O botão "Abrir todas" individualmente (que tenta abrir cada URL em nova aba) merece estar no MVP, dado que browsers tendem a bloquear pop-ups múltiplos? *Recomendação:* deixar fora do MVP. Manter abertura individual por linha. Validar dor real antes.
3. **Q3.** Devemos exibir um aviso de microcopy sobre tonalidade ("A cifra no CifraClub pode estar em tom diferente; ajuste com o transpositor do app")? *Recomendação:* sim, microcopy curta no diálogo da playlist.
4. **Q4.** O campo `cifraclub_url` deve ter constraint de domínio? *Recomendação:* não (vide RF-1.4). Trade-off: aceitar links inválidos vs frustrar usuário com m./www./mobile variants.
5. **Q5.** Notificação push/email da playlist no momento que a escala é finalizada? *Recomendação:* fora do MVP; depende da infra de notificações geral.

---

## 13. Verificação End-to-End (critérios de aceite)

A entrega é considerada completa quando todos os critérios abaixo passam:

### Backend

- [ ] `npx prisma migrate dev` aplica a migração sem warnings.
- [ ] `psql` mostra coluna `cifraclub_url TEXT NULL` em `artistas_musicas`.
- [ ] `npm test` em `packages/backend` passa, incluindo:
  - Test "criar versão com `cifraclub_url`" retorna 201 com campo ecoado.
  - Test "atualizar `cifraclub_url`" persiste alteração.
  - Test "validator rejeita `javascript:`" retorna 400.
  - Test `getCifraclubPlaylist` com músicas com/sem link retorna `stats` corretos.
  - Test fallback `versao_selecionada` → primeira versão.
  - Test eventoId inválido → 404.
- [ ] `npm run typecheck` clean.
- [ ] Smoke test via curl: `GET /api/eventos/:id/cifraclub-playlist` autenticado retorna 200 com schema esperado.
- [ ] OpenAPI atualizado com schemas `CifraclubPlaylistResponse`, `cifraclub_url` em Versão.

### Frontend

- [ ] `npm test` em `packages/frontend` passa, incluindo testes da lib `cifraclub-playlist.ts`.
- [ ] Form de versão (`VersaoForm`) salva e exibe `cifraclub_url`.
- [ ] Botão "CifraClub" aparece em `EventoDetail.tsx` quando há ≥1 música.
- [ ] Diálogo carrega via hook lazy, mostra lista, stats, e ações.
- [ ] "Copiar links" → clipboard contém texto numerado com URLs.
- [ ] "Compartilhar WhatsApp" → abre wa.me com mensagem encoded.
- [ ] Música sem link mostra "Sem link CifraClub" em itálico.
- [ ] `isSafeUrl` impede renderização de `javascript:` mesmo se backend retornasse um.

### Mobile (Galaxy S8 — 360×740)

- [ ] Botão "CifraClub" mostra apenas ícone (`Guitar`), com `aria-label`.
- [ ] Diálogo abre sem overflow horizontal.
- [ ] Nomes longos truncam (`line-clamp-2`).
- [ ] Footer empilha verticalmente.

### Documentação

- [ ] `packages/backend/docs/openapi.json` reflete contratos.
- [ ] `README.md` menciona a feature em "Funcionalidades" e "Escalas".
- [ ] Docstrings JSDoc em pt-BR em todo código novo (`.claude/rules` requisito).

---

## 15. Coexistência com o Share WhatsApp Existente (resposta a feedback)

> **Feedback do usuário (v1.1):** "Atualmente os links das músicas no YouTube já aparecem na lista exportada do WhatsApp, precisa de cuidado para não ficar poluída a saída."

### 15.1 Situação atual

O componente `EscalaShareActions.tsx` (já em produção) gera uma mensagem WhatsApp que inclui, para cada música, o `link_versao` quando presente. Na prática, `link_versao` virou um campo "link genérico" usado predominantemente para **YouTube**. A mensagem fica assim hoje:

```text
*Culto Domingo Manhã* — _17/05/2026 10:00_

🎵 *Músicas* (5)

1. Rendido Estou (G)
   https://www.youtube.com/watch?v=abc123
2. Grande é o Senhor (D)
   https://www.youtube.com/watch?v=def456
...
```

Se adicionássemos URLs do CifraClub na mesma mensagem, ela viraria **duas vezes mais longa**, com risco de:

- Ultrapassar `WHATSAPP_URL_SAFE_LIMIT` (3800 chars encoded) em escalas com 8+ músicas.
- Confundir o leitor (qual link é cifra? qual é vídeo?).
- Dobrar o ruído visual no celular.

### 15.2 Decisão de design

**Manter dois fluxos de compartilhamento distintos e bem rotulados**, em vez de mesclar tudo em uma única mensagem:

| Fluxo | Botão | Componente | Conteúdo | Quando usar |
|---|---|---|---|---|
| **Share da Escala (atual)** | "Copiar texto" / "WhatsApp" | `EscalaShareActions.tsx` | Header + músicas (tom + YouTube) + integrantes | Visão geral da escala para a equipe (planejamento, convocação) |
| **Playlist CifraClub (novo)** | "CifraClub" | `CifraclubPlaylistDialog.tsx` | Header + músicas (tom + artista + URL CifraClub) | Momento do ensaio/culto: cada músico precisa abrir a cifra |

**Por que dois fluxos?**

- **Audiência diferente**: o share da escala vai uma vez no início da semana ("Time, segue a escala"). A playlist CifraClub vai no dia do ensaio ("Bora ensaiar, cifras na ordem").
- **Conteúdo focado**: na playlist CifraClub, só interessa a sequência de cifras. Sem integrantes, sem YouTube — minimalismo intencional.
- **Sem regressão**: o share atual continua funcionando idêntico. Zero risco de quebrar usuários que já estão acostumados.
- **Decisão consciente do líder**: cada botão tem uso explícito. Não há "mensagem padrão poluída".

### 15.3 Microcopy do botão "WhatsApp" do diálogo CifraClub

A mensagem WhatsApp gerada pelo diálogo CifraClub deve deixar **inequívoco** o que está sendo compartilhado:

```text
*🎸 Cifras — Culto Domingo Manhã*
_17/05/2026 10:00 · 8 de 10 músicas com cifra_

1. Rendido Estou (G) — Aline Barros
   https://www.cifraclub.com.br/aline-barros/rendido-estou/
2. Grande é o Senhor (D) — Adhemar de Campos
   https://www.cifraclub.com.br/adhemar-de-campos/grande-e-o-senhor/
3. Nada Além do Sangue (Am)
   _(sem cifra cadastrada)_
...

📱 _Toque em cada link para abrir a cifra no app do CifraClub._
```

Diferenças do share da escala:

- Header `🎸 Cifras` (vs `🎵 Músicas` do share da escala).
- Sem seção de integrantes.
- Artista exibido na linha do nome (ajuda a confirmar que é a versão certa).
- Microcopy final orienta o uso.
- Sem YouTube (este fluxo é "modo ensaio").

### 15.4 Sinalização da feature na UI

Para evitar confusão entre os dois botões na barra de ações:

```text
[← Voltar] Detalhes da Escala
[✏️ Editar] [📋 Copiar texto] [📞 WhatsApp] [🎸 CifraClub] [🗑️ Excluir]
```

Cada botão tem `aria-label` claro e ícone semântico distinto. No mobile (icon-only), o `Guitar` para CifraClub é visualmente distinto do `MessageCircle` para WhatsApp geral.

### 15.5 Alternativa considerada e rejeitada

**Opção rejeitada**: adicionar uma checkbox no diálogo do share atual ("Incluir links do CifraClub na mensagem"). Razão da rejeição:

- Acrescenta cliques e cognição em uma ação que precisa ser rápida.
- Mistura semântica de duas mensagens distintas.
- Aumenta acoplamento entre os dois recursos — qualquer mudança em um afeta o outro.
- KISS (princípio do CLAUDE.md): dois recursos independentes são mais simples de evoluir.

---

## 16. Investigação — "Link único que abre a playlist no CifraClub" (feedback v1.1)

> **Feedback do usuário (v1.1):** "Se tiver como criar um link já para abrir a playlist no cifraclube melhor, precisamos entender como é o formato desse link que abre essa playlist, qual formato que do LouvorFlow, ou abrimos o app do cifraclube com essa playlist."

> **REVISÃO IMPORTANTE em v1.2 (2026-05-17)**: a investigação original (DeepSearch v1.1) concluiu **incorretamente** que não existiam URLs públicas de listas no CifraClub. Re-investigação técnica via Playwright durante a feature 026 desmontou essa conclusão. As subseções abaixo foram **reescritas** com os achados corretos. O texto original ficou preservado em commit anterior para auditoria.

### 16.1 Pergunta de pesquisa

> "Existe um formato de URL público no domínio CifraClub que permita criar/compartilhar uma playlist (lista) entre usuários, de modo que ao abrir essa URL o app do CifraClub abra com a playlist pronta para uso?"

### 16.2 Achados (revisado em v1.2)

| # | Investigação | Resultado v1.2 (CORRIGE v1.1) | Evidência |
|---|---|---|---|
| 16.2.1 | Existe URL de "Lista pública" no CifraClub? | **SIM, existe.** Pattern: `https://www.cifraclub.com.br/musico/{userId}/repertorio/{listId}/` (para listas custom) ou `/repertorio/favoritas/`, `/consegui-tocar/`, `/ainda-vou-tocar/` (para listas-sistema do usuário). Confirmado lendo lista real (`/musico/539475470/repertorio/12339923/`, nome "Sabado", 5 músicas) em sessão anônima — renderizou todos os dados. UI da própria lista oferece botão **"Copiar link"** + share Facebook/Twitter | Playwright em sessão anônima, 2026-05-17. Snapshot DOM disponível em `cifraclub-list-page.yml`. |
| 16.2.2 | A página de minhas listas é acessível? | **Lista de outro usuário SIM**, se marcada `public: true` (default visual da UI). **Página de gestão das próprias listas** (`/minhas-listas`) continua exigindo login do dono | Acesso direto a URLs de listas (não-favoritas) sem cookie |
| 16.2.3 | Existe API pública para LER listas? | **SIM, existe API não-documentada.** `GET https://api.cifraclub.com.br/v3/songbook/{listId}` retorna JSON completo (id, name, userId, userName, public, lastUpdate, songs[] com siteUrl/tone/stdTone/capo/tuning/isMinorScale, totalSongs, thumb). Sem autenticação. CORS aparentemente liberado para `www.cifraclub.com.br`. Endpoint adicional observado: `/v3/user/{userId}/badges` | DevTools network panel ao carregar a página da lista. JSON capturado e analisado. |
| 16.2.4 | Existe API pública para CRIAR/EDITAR listas? | **Ainda não validado em v1.2.** Investigação inicial foi anônima (sem login); POST/PUT/DELETE possivelmente requerem cookie de sessão e CSRF token. Spike de 1-2h com login do owner pode confirmar contrato e viabilidade. Status atual: **provável mas não comprovado**. | Não testado (intencionalmente, para evitar uso de credenciais sem necessidade explícita) |
| 16.2.5 | Deep link customizado (`cifraclub://`)? | **Não encontrado publicamente.** Comportamento atual: Universal/App Link padrão do iOS/Android abre o app oficial quando se toca `https://www.cifraclub.com.br/...` (cifra ou lista). Suficiente para o caso de uso. | Buscas; comportamento padrão da plataforma |
| 16.2.6 | Universal/App Links resolvem o problema? | **SIM.** Tocar URL de lista ou de cifra em iOS ou Android abre o app CifraClub se instalado. Lista abre na visualização da própria lista; cifra abre na cifra correspondente | Comportamento padrão Android App Links / iOS Universal Links |
| 16.2.7 | Formato do fragmento de cifra dentro das listas | **Completo: `#instrument=guitar&tuning=E A D G B E&capo=0&key=N`** onde N é o índice cromático absoluto (`A=0..Ab=11`, confirmado por dados: C→3, G→10, Am→0) | JSON do songbook 12339923, campo `siteUrl` de cada song |

### 16.3 Conclusão (revisado em v1.2)

A entrega "link único que abre a playlist no CifraClub" **é viável tecnicamente** usando as URLs públicas de lista do próprio CifraClub. As alternativas atualizadas são:

#### Alternativa A — Status quo (MVP atual da 025)
Gerar lista de URLs individuais; cada uma abre no app CifraClub via Universal/App Link. Usuário toca uma URL, lê a cifra, volta para o WhatsApp, toca a próxima. **Funciona hoje, zero engenharia extra além do que esta PRD já especifica.**

#### Alternativa B — Página de playlist hospedada no LouvorFlow ("hub URL")
~~Anteriormente recomendada como Fase 2.5.~~ **OBSOLETA em v1.2** — a URL pública do próprio CifraClub (Alternativa B') resolve o mesmo problema sem nenhuma engenharia de hospedagem do nosso lado.

#### Alternativa B' (NOVA em v1.2) — Cadastrar `cifraclub_list_url` por Evento
Acrescentar um campo opcional `cifraclub_list_url` em `Eventos` (ou em uma tabela associada). O líder cria uma lista manualmente no CifraClub (precisa de conta CifraClub, gratuita) e cola a URL `https://www.cifraclub.com.br/musico/{userId}/repertorio/{listId}/` no LouvorFlow. UI exibe um botão "Abrir lista no CifraClub" no detalhe da Escala e no diálogo da Playlist CifraClub. WhatsApp share inclui essa URL no topo da mensagem.

**Custo de engenharia:** ~1 dia (campo no schema + endpoint update + UI + WhatsApp formatter).
**Custo para o líder:** criar a lista manualmente no CifraClub (5–10 min por escala, primeira vez; pode duplicar lista existente nas próximas).
**Benefício:** "link único" prometido ao usuário sem hospedar nada do nosso lado; usuário cai direto no app do CifraClub (UX nativa).
**Limitação:** sem sync automático — se o líder muda a escala no LouvorFlow, a lista do CifraClub fica desatualizada até ele editar manualmente.
**Recomendação**: avaliar como spec independente (proposta: `027-cifraclub-list-link`) após 025+026 em produção.

#### Alternativa C — Integração privada com CifraClub (longo prazo, ainda válida)

- Contatar comercial Studio Sol → propor parceria para LouvorFlow criar/atualizar listas via API privada na conta do usuário.
- Risco: dependência externa, contrato comercial, possível custo recorrente.
- Prazo: 3-6 meses para validar viabilidade comercial.
- **Pivot v1.2**: spike técnico de 1-2h (com login) pode antecipar viabilidade técnica antes da conversa comercial.

#### Alternativa D — Engenharia reversa / scraping da API privada (escrita)

- Investigar `/v3/songbook/...` POST/PUT/DELETE usando login do próprio usuário no LouvorFlow (cookie-pass-through via WebView).
- Risco **alto**: violação provável de TOS, fragilidade a updates, conta do usuário pode ser banida, exposição de credenciais.
- **Permanece não recomendado** mesmo após v1.2.

### 16.4 Recomendação revisada (v1.2)

| Fase | Alternativa | Quando |
|---|---|---|
| **MVP (esta entrega — feature 025)** | **A** — URLs individuais com Universal Link automático | Imediato |
| **+ feature 026** | **A + `#key=N` no fragmento** para abrir já no tom certo (sem custo extra de UX) | Logo após 025 (1 PR pequeno) |
| **+ feature 027 proposta (1 mês depois, se KPIs verdes)** | **B'** — cadastrar `cifraclub_list_url` por Evento; share oferece "link único oficial do CifraClub" | Avaliar após métricas 025/026 |
| **v2 (3-6 meses)** | **C ou C-via-spike** — integração com conta CifraClub | Iniciar spike técnico em paralelo se houver interesse |
| **Nunca** | **D** — Scraping ofensivo de API privada | Descartado |

A **Fase 2.5 original (hub URL hospedado no LouvorFlow)** sai do roadmap em v1.2 — superada pela Alternativa B'.

### 16.5 Mock removido em v1.2

O mock textual da página "hub URL hospedada no LouvorFlow" foi removido junto com a deprecação da Alternativa B. Para a Alternativa B' (lista hospedada no próprio CifraClub), o mock é a UI nativa do CifraClub — não há tela nossa para desenhar.

### 16.6 Próximos passos sugeridos (v1.2)

- **Para feature 026 (já em curso)**: nenhuma mudança de escopo. Continuar como planejado — apenas mover T002 do `tasks.md` (smoke test pré-implementação) de "bloqueador" para "check confirmatório", já que a tabela H2 está empiricamente validada pelos dados do CifraClub (vide 16.2.7).
- **Para criar feature 027**: usar este §16.3 Alternativa B' como ponto de partida da próxima spec. Escopo curto, valor alto.
- **Para Fase 3 (Alternativa C)**: agendar spike de 1-2h com Playwright + login do usuário para descobrir se POST/PUT no `/v3/songbook/*` aceita cookie de sessão. Resultado positivo destrava a parceria com Studio Sol; resultado negativo confirma necessidade de contrato comercial.

---

## 17. Apêndices

### A. Padrões de URL CifraClub (confirmados via DeepSearch)

| Tipo | Exemplo |
|---|---|
| Canônico (web) | `https://www.cifraclub.com.br/aline-barros/rendido-estou/` |
| Mobile | `https://m.cifraclub.com.br/aline-barros/rendido-estou/` |
| Partituras | `https://www.cifraclub.com.br/aline-barros/rendido-estou/partituras/` |
| Tabs específicas | `https://www.cifraclub.com.br/aline-barros/rendido-estou/tabs-gaita/` |
| Simplificada (legacy) | `https://www.cifraclub.com/aline-barros/diante-da-cruz/simplificada.html` |
| Artista (índice) | `https://www.cifraclub.com.br/fernandinho/` |

**Convenção de slug:** ASCII lowercase, hífens no lugar de espaços/diacríticos. Caracteres acentuados são normalizados (`canção` → `cancao`).

### B. Fontes da pesquisa (DeepSearch v1.1)

**CifraClub — produto, listas e pricing**
- [App Cifra Club – App Store](https://apps.apple.com/br/app/cifra-club/id921625944) — features oficiais
- [Cifra Club – Chords on Google Play](https://play.google.com/store/apps/details?id=com.studiosol.cifraclub) — descrição oficial; mudanças 2025-2026
- [Suporte CifraClub – Acesse suas listas em qualquer dispositivo](https://suporte.cifraclub.com.br/pt-BR/support/solutions/articles/64000253540-aprenda-a-fazer-login-no-app-e-acessar-suas-listas-onde-estiver) — sync via Cifra Club ID
- [Cifra Club PRO – benefícios](https://www.cifraclub.com.br/blog/cifra-club-pro-beneficios-membros/) — 1.000 listas, Smart Scrolling
- [Assine Cifra Club](https://www.cifraclub.com.br/assine/) — pricing R$ 99/ano
- [Cupom Cifra Club PRO abril 2026](https://cifraclub.cupombr.org) — referência de desconto
- [Versão 3.5.7 — março 2026 (apkgk)](https://apkgk.com/pt/com.studiosol.cifraclub) — changelog atual

**Tamanho de mercado e ausência de API oficial**
- [code4music/cifraclub-api (GitHub)](https://github.com/code4music/cifraclub-api) — padrão de URL confirmado, scraping comunitário
- [Rafael Mateus – Projeto Cifra Club API](https://blog.rafaelbmateus.com.br/cifraclub-api/) — confirmação de ausência de API oficial
- [SensorTower – Cifra Club Brasil](https://app.sensortower.com/overview/com.studiosol.cifraclub?country=BR) — 21mi instalações, 100k downloads/mês
- [Studio Sol institucional](https://www.studiosol.com.br/cifraclub) — empresa-mãe

**Exemplos reais de URL**
- [Aline Barros - Rendido Estou](https://www.cifraclub.com.br/aline-barros/rendido-estou/)
- [Fernandinho](https://www.cifraclub.com.br/fernandinho/)
- [Diante do Trono](https://www.cifraclub.com.br/diante-do-trono/)

**Mercado evangélico Brasil**
- [IBGE / Agência Brasil – jovens e mulheres puxam aumento de evangélicos](https://agenciabrasil.ebc.com.br/geral/noticia/2025-06/jovens-e-mulheres-puxam-aumento-de-evangelicos-no-pais-revela-ibge)
- [CNN Brasil – Brasil recorde de evangélicos](https://www.cnnbrasil.com.br/nacional/brasil/brasil-tem-recorde-de-evangelicos-e-menor-numero-de-catolicos-da-historia/)
- [Exame – Mercado evangélico R$ 21,5 bi](https://exame.com/marketing/mercado-evangelico-ja-gera-r-215-bilhoes-por-ano-no-brasil/)
- [Instituto Paracleto – estimativa igrejas e pastores 2026](https://institutoparacleto.org/2026/03/26/estimativa-de-igrejas-e-pastores-no-brasil-2026/)
- [Público – Igreja evangélica superará a católica em 2032](https://www.publico.pt/2025/04/28/mundo/noticia/igreja-evangelica-superara-catolica-maior-religiao-brasil-2032-aponta-estudo-2131139)

**Comparativo apps de louvor**
- [InChurch – apps para ministérios de louvor](https://inchurch.com.br/blog/aplicativos-para-ministerios-de-louvor/)
- [Cante as Escrituras](https://www.canteasescrituras.com.br/aplicativo)
- [Sua Benção – worship team management apps](https://suabencao.com/worship-team-management-app/)
- [GetApp Brasil – church management software](https://www.getapp.com.br/directory/166/church-management/pricing/free/software)

**Integrações internacionais (benchmarking)**
- [WorshipTools docs – Importing from Planning Center](https://www.worshiptools.com/en-us/docs/19-import-pco)
- [OnSong + Planning Center integration](https://onsongapp.zendesk.com/hc/en-us/articles/360044674733-Integrating-with-Planning-Center)
- [SongSelect by CCLI – LATAM](https://ccli.com/latam/pt/songselect)
- [MultiTracks – Planning Center auto import](https://helpcenter.multitracks.com/en/articles/7950875-planning-center-setlists-auto-import-and-auto-update)

### C. Glossário

- **Versão** (`Artistas_Musicas`): uma música pode ter múltiplas versões — cada artista que a cantou pode ter sua cifra/letra/tom específico.
- **Escala** (`Eventos`): planejamento de um culto ou ensaio. Contém músicas ordenadas + integrantes.
- **Playlist CifraClub**: lista ordenada de URLs do CifraClub correspondentes às músicas (na versão selecionada) de uma escala.
- **Cifra Club ID**: conta de usuário do CifraClub que sincroniza "Minhas Listas" entre dispositivos.
