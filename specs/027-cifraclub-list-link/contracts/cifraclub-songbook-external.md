# External Contract — CifraClub Songbook API

**Branch**: `027-cifraclub-list-link` · **Date**: 2026-05-17

> ⚠️ Este NÃO é um contrato controlado pelo LouvorFlow. É a **documentação descritiva** de um endpoint público não-documentado oficialmente pelo CifraClub, descoberto na investigação Playwright em 2026-05-17 (vide `specs/025-cifraclub-playlist-integration/prd.md` §16.2.3 v1.2). Está sujeito a mudanças unilaterais por parte da Studio Sol sem aviso. O LouvorFlow trata qualquer falha desse endpoint como erro recuperável (vide research.md §2).

## Endpoint

```text
GET https://api.cifraclub.com.br/v3/songbook/{listId}
```

- **Auth**: nenhuma (público).
- **CORS**: liberado para `https://www.cifraclub.com.br` e (observado) para origens diversas em fetch anônimo com `credentials: 'omit'`.
- **Rate limit**: desconhecido. Tratar 429 como qualquer outra falha.

## Resposta observada (200)

```json
{
  "id": 12339923,
  "name": "Sabado",
  "userId": 539475470,
  "userName": "JorUge Ferrari",
  "createdAt": "2024-08-03 10:39:00",
  "lastUpdate": "2024-08-03 11:59:52",
  "public": true,
  "status": 1,
  "songs": [
    {
      "cifraId": 36778,
      "songId": 30392,
      "label": "principal",
      "type": 1,
      "name": "Ao Erguermos as Mãos",
      "artist": {
        "id": 6816,
        "name": "Aline Barros",
        "url": "aline-barros",
        "image": "f/2/5/3/f253f5b673641922c4e3a66fdc0be72d.jpg",
        "color": "#D76432"
      },
      "siteUrl": "/aline-barros/ao-erguermos-as-maos/#instrument=guitar&tuning=E A D G B E&capo=0&key=3",
      "apiUrl": "/aline-barros/ao-erguermos-as-maos",
      "songUrl": "ao-erguermos-as-maos",
      "tone": "C",
      "stdTone": "C",
      "capo": 0,
      "tuning": "E A D G B E",
      "id": 173174814,
      "uuid": null,
      "isMinorScale": false,
      "lastUpdate": "2024-08-03 10:39:00"
    }
  ],
  "totalSongs": 5,
  "timestamp": 1722697192,
  "type": "default",
  "thumb": "https://akamai.sscdn.co/letras/100x100/fotos/f/2/5/3/f253f5b673641922c4e3a66fdc0be72d.jpg",
  "thumbURLs": [
    "https://akamai.sscdn.co/letras/100x100/fotos/a/d/6/1/ad613e16d5e8467c93a63d3c5b0a6fa6.jpg"
  ]
}
```

## Subset usado pela 027

Apenas estes campos são lidos pelo frontend para o preview do cadastro (FR-012):

| Campo | Tipo | Uso |
|---|---|---|
| `name` | string | "Lista: {name}" |
| `userName` | string | "por {userName}" |
| `totalSongs` | int | Badge "{totalSongs} músicas" |
| `public` | boolean | Badge "pública"/"privada"; warning se `false` (EC-3) |

Demais campos (especialmente `songs[]`) **não** são consumidos por esta feature — evitar coupling com schema externo que pode mudar.

## Erros tratados

| Cenário | Tratamento na 027 |
|---|---|
| HTTP 404 (lista deletada ou ID inválido) | Preview some, cadastro permitido com warning UI "Não conseguimos validar essa lista" (EC-3, EC-6) |
| HTTP 403/401 (caso CifraClub mude política) | Igual a 404 — preview some, cadastro permitido |
| HTTP 429 (rate limit) | Igual — preview some silenciosamente |
| HTTP 5xx (erro server-side CifraClub) | Igual — preview some |
| Timeout (>3s) | AbortController cancela; preview some |
| CORS recusado (caso CifraClub mude header) | Fetch promise rejeita; preview some |
| JSON inválido / faltando campos esperados | Try/catch ao acessar campos; preview some ou parcial |
| Rede offline | Fetch rejeita; preview some |

**Princípio**: o preview é *bônus*, nunca *requisito*. Qualquer falha vira ausência silenciosa do preview, nunca bloqueio do cadastro nem mensagem de erro intrusiva.

## Variações observadas

- Listas-sistema (`/repertorio/favoritas/`, `/consegui-tocar/`, `/ainda-vou-tocar/`) **não respondem** neste endpoint — `listId` precisa ser numérico. Para listas-sistema, a 027 não chama o endpoint (vide research.md §2).
- Listas privadas (`public: false`) **respondem** com o JSON completo desde que o `listId` seja conhecido — não há ACL aplicada no endpoint. Mas a página `/musico/{userId}/repertorio/{listId}/` exige login para listas privadas — então o público final cai numa tela de login. A 027 mostra warning sobre isso (EC-3).

## Risco de evolução

| Mudança hipotética do CifraClub | Impacto na 027 |
|---|---|
| Endpoint volta a 404 / 403 (descontinuação) | Preview some para todos; cadastro continua funcional; botões de share/abrir continuam funcionando (URL é colada literal) |
| Endpoint mantém comportamento mas renomeia campos | Preview some por exceção de parsing; tratado pelo try/catch |
| URL pública das listas muda de pattern | Regex de validação no app precisa atualizar (FR-002); URLs antigas cadastradas continuam apontando para o destino antigo (404 esperado) |
| CifraClub passa a exigir auth para `/v3/songbook/*` | Preview some por 401; igual aos demais erros |
| CifraClub limita rate (429) | Preview eventualmente some; debounce de 500ms no campo já mitiga muito |

Em todos os cenários acima, a feature **degrada graciosamente** sem regressão do fluxo principal (cadastrar URL + share + abrir).
