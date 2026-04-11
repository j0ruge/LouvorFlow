# Task Memory: task_03.md

Keep only task-local execution context here. Do not duplicate facts that are obvious from the repository, task file, PRD documents, or git history.

## Objective Snapshot
Update `openapi.json` to document the new PATCH endpoint, extended POST body, and new MusicaEvento/VersaoMusica shapes from tasks 01-02.

## Important Decisions
- `VersaoMusica` schema placed before `MusicaEvento` in components.schemas so the `$ref` resolves forward.
- `versao_selecionada` uses `nullable: true` + `allOf` pattern (same as `tonalidade` in the existing spec).
- `versoes_disponiveis` is required on `MusicaEvento`; `versao_selecionada` is not (nullable).
- PATCH response uses `{ msg, musica }` envelope with `musica` referencing `MusicaEvento` via `$ref`.

## Learnings
- OpenAPI spec uses `python -m json.tool` for validation since `jq` is not installed on this Windows env.

## Files / Surfaces
- `packages/backend/docs/openapi.json` — added VersaoMusica schema, extended MusicaEvento, extended POST body, added PATCH operation.

## Errors / Corrections
- None.

## Ready for Next Run
- task_04 can rely on the documented contract for frontend Zod schema and service implementation.
