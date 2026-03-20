# Implementation Plan: Pipeline CI/CD Agnóstico para Organização

**Branch**: `002-agnostic-cicd-pipeline` | **Date**: 2026-03-18 | **Spec**: [spec.md](./spec.md)
**Input**: Feature specification from `/specs/002-agnostic-cicd-pipeline/spec.md`

## Summary

Criar um template reutilizável e versionado de pipeline CI/CD para a organização, baseado nas lições aprendidas de duas implementações concretas (`digital_service_report_api` e `estimates_api`). O template inclui: workflow templates parametrizáveis via project-config, compose templates para API e frontend, quickstart com checklist pré-deploy (10 validações), e changelog versionado. A implementação valida o template contra o repositório `estimates_api` como primeiro adotante oficial.

## Technical Context

**Language/Version**: YAML (GitHub Actions), Docker, Markdown (documentação)
**Primary Dependencies**: GitHub Actions, Docker, docker compose, GHCR, nginx-proxy (jwilder)
**Storage**: N/A (feature de infraestrutura/documentação)
**Testing**: Validação manual via quickstart checklist (sem test framework — infra/docs)
**Target Platform**: Linux on-premise servers (staging e produção)
**Project Type**: CI/CD infrastructure templates + documentation
**Performance Goals**: Deploy staging <10 min (SC-002), deploy produção <15 min (SC-003), adoção <1 hora (SC-006)
**Constraints**: Self-hosted runners (sem SSH), imagens privadas no GHCR, zero secrets no código
**Scale/Scope**: 4+ repositórios, 2 ambientes, 2 servidores, 2 tipos de projeto (api/frontend)

## Constitution Check

_GATE: Must pass before Phase 0 research. Re-check after Phase 1 design._

Constitution not configured (template only). No gates to enforce. Proceeding.

## Project Structure

### Documentation (this feature)

```text
specs/002-agnostic-cicd-pipeline/
├── plan.md              # This file
├── research.md          # Phase 0 output — consolidated decisions
├── data-model.md        # Phase 1 output — entity model
├── quickstart.md        # Phase 1 output — adoption guide + pre-deploy checklist
├── contracts/
│   └── workflow-contract.md  # Phase 1 output — 7 contracts
├── checklists/
│   └── requirements.md       # Spec quality checklist
└── tasks.md             # Phase 2 output (/speckit.tasks)
```

### Source Code (repository root)

```text
.github/
└── workflows/
    ├── ci.yml                    # Workflow CI — já existe (adaptar como template)
    ├── cd-staging.yml            # Workflow CD Staging — já existe (adaptar como template)
    └── cd-production.yml         # Workflow CD Production — já existe (adaptar como template)

infra/
├── docker-compose.yml            # Compose production — já existe (validar contra Contract 4)
├── docker-compose-dev.yml        # Compose dev — manter inalterado
└── .env.example                  # Exemplo de variáveis — já existe (validar completude)

Dockerfile                        # Multi-stage build — já existe (validar compatibilidade)
```

**Structure Decision**: Esta feature é primariamente de documentação/templates — os artefatos de infra já existem no repositório `estimates_api`. O trabalho consiste em: (1) extrair os padrões em templates agnósticos, (2) criar o changelog versionado, (3) validar os artefatos existentes contra os contracts, (4) criar a instância do project-config para estimates_api como referência.

## Complexity Tracking

Nenhuma violação de constitution identificada (constitution não configurada).

---

## Implementation Strategy

### Approach

Esta feature não altera código-fonte em `src/`. Os deliverables são:

1. **Templates agnósticos** (extraídos dos workflows/compose existentes) — vivem na spec como referência
2. **Project-config validado** para `estimates_api` — confirma que o repo existente está em conformidade
3. **Quickstart + checklist** — guia de adoção para novos repos (já criado como artefato do plan)
4. **Changelog v1.0.0** — baseline do template
5. **Validação** — verificar que os artefatos existentes no repo estão em conformidade com os contracts

### What Already Exists (estimates_api)

| Artefato | Status | Ação Necessária |
|----------|--------|-----------------|
| `.github/workflows/ci.yml` | Existe | Validar contra Contract 1 |
| `.github/workflows/cd-staging.yml` | Existe | Validar contra Contract 2 |
| `.github/workflows/cd-production.yml` | Existe | Validar contra Contract 3 |
| `Dockerfile` | Existe | Validar multi-stage build |
| `infra/docker-compose.yml` | Existe | Validar contra Contract 4 |
| `infra/.env.example` | Existe | Validar completude vs env.ts |
| `project-config.md` (001) | Existe em 001 | Migrar/atualizar com TEMPLATE_VERSION |

### What Needs to Be Created

| Artefato | Descrição |
|----------|-----------|
| `CHANGELOG.md` | Template changelog v1.0.0 |
| `project-config.md` (002) | Instância atualizada com TEMPLATE_VERSION para estimates_api |
| Correções (se houver) | Ajustes nos workflows/compose se validação encontrar desvios |

### MVP First

1. Validar artefatos existentes contra contracts
2. Criar project-config com TEMPLATE_VERSION
3. Criar CHANGELOG.md v1.0.0
4. Corrigir desvios encontrados (se houver)

### Execution Order

```
Phase 1: Validação — verificar conformidade dos artefatos existentes
Phase 2: Project Config — criar instância atualizada para estimates_api
Phase 3: Changelog — criar baseline v1.0.0
Phase 4: Correções — ajustar artefatos que não estão em conformidade
Phase 5: Polish — documentação final
```

---

## Notes

- Esta feature é fundamentalmente diferente da 001: a 001 criou os artefatos do zero; a 002 extrai padrões e valida conformidade
- Os workflows já existem e funcionam — o risco de regressão é baixo
- O quickstart e checklist pré-deploy já foram criados como artefatos do plan (Phase 1)
- O principal valor agregado é: qualquer novo repo pode adotar o pipeline consultando os contracts, project-config schema, e quickstart
- Evolução futura (v2): CLI que gera workflows a partir do project-config automaticamente
