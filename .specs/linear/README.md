# Linear — Sync de Tasks

**Repositório:** [github.com/pedrobelmino/spring-react-reconhecimento-facial](https://github.com/pedrobelmino/spring-react-reconhecimento-facial)

## Conteúdo

- `tasks.json` — 41 tasks (17 foundation + 15 cadastro + 9 entrada) com dependências
- `manifest.json` — preenchido após sync (IDs Linear)

## Opção 1: Plugin Linear no Cursor (recomendado)

1. **Settings → MCP → Linear** → habilitar e autenticar
2. No chat, peça: *"sincronize as tasks no Linear"*
3. O agente usa `save_issue` + `blockedBy` para criar as 41 issues

## Opção 2: Script API

1. Crie API key: [Linear Settings → API](https://linear.app/settings/api)
2. Execute:

```bash
export LINEAR_API_KEY=lin_api_xxxxxxxx
export LINEAR_TEAM=SeuTeamKey   # opcional
node scripts/sync-linear-tasks.mjs
```

Dry-run (preview):

```bash
LINEAR_DRY_RUN=1 LINEAR_API_KEY=lin_api_xxx node scripts/sync-linear-tasks.mjs
```

## Estrutura no Linear

| Projeto | Academia Face Access |
| Milestones | Platform Foundation → Cadastro → Entrada |
| Issues | `[F-T1]` … `[E-T9]` com relações **blocked by** |
| Labels sugeridos | backend, frontend, infra, ml, auth, devops |

## Mapeamento de keys

| Prefixo | Feature |
| ------- | ------- |
| F-T* | platform-foundation |
| C-T* | cadastro-clientes-faces |
| E-T* | tela-entrada |
