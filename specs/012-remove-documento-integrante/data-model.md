# Data Model: Remover Campo Documento de Integrantes

**Branch**: `012-remove-documento-integrante` | **Date**: 2026-02-25

## Entidade: Integrantes

### Estado Atual

| Campo | Tipo | Constraints | Notas |
|-------|------|-------------|-------|
| id | UUID | PK, default uuid() | Chave primária |
| nome | String | NOT NULL | Nome do integrante |
| **doc_id** | **String** | **UNIQUE, NOT NULL** | **REMOVER** |
| email | String | UNIQUE, NOT NULL, VARCHAR(255) | Identificador de login |
| senha | String | NOT NULL, VARCHAR(255) | Hash bcrypt |
| telefone | String? | VARCHAR(20), NULLABLE | Contato |
| created_at | DateTime | NOT NULL, default now() | Auditoria |
| updated_at | DateTime | NOT NULL, @updatedAt | Auditoria |

### Estado Final (após migração)

| Campo | Tipo | Constraints | Notas |
|-------|------|-------------|-------|
| id | UUID | PK, default uuid() | Chave primária |
| nome | String | NOT NULL | Nome do integrante |
| email | String | UNIQUE, NOT NULL, VARCHAR(255) | Identificador de login |
| senha | String | NOT NULL, VARCHAR(255) | Hash bcrypt |
| telefone | String? | VARCHAR(20), NULLABLE | Contato |
| created_at | DateTime | NOT NULL, default now() | Auditoria |
| updated_at | DateTime | NOT NULL, @updatedAt | Auditoria |

### Relacionamentos (sem alteração)

- `Integrantes` 1:N `Integrantes_Funcoes` (via `fk_integrante_id`, ON DELETE CASCADE)
- `Integrantes` 1:N `Eventos_Integrantes` (via `fk_integrante_id`, ON DELETE CASCADE)

### Regras de Validação

| Regra | Antes | Depois |
|-------|-------|--------|
| Unicidade de doc_id | Validada no service + constraint DB | **REMOVIDA** |
| Unicidade de email | Apenas constraint DB | Validada no service + constraint DB |
| Normalização de doc_id | Strip não-numéricos no service | **REMOVIDA** |

### Migration SQL Esperada

```sql
-- DropIndex
DROP INDEX "integrantes_doc_id_key";

-- AlterTable
ALTER TABLE "integrantes" DROP COLUMN "doc_id";
```

## Interfaces TypeScript

### IntegranteWithFuncoes (após)

```typescript
export interface IntegranteWithFuncoes {
    id: string;
    nome: string;
    email: string;
    telefone: string | null;
    Integrantes_Funcoes: {
        integrantes_funcoes_funcao_id_fkey: IdNome;
    }[];
}
```

### INTEGRANTE_PUBLIC_SELECT (após)

```typescript
export const INTEGRANTE_PUBLIC_SELECT = {
    id: true,
    nome: true,
    email: true,
    telefone: true
} as const;
```
