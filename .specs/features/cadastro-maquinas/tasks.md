# Cadastro de Máquinas da Academia — Tasks

**Design:** `.specs/features/cadastro-maquinas/design.md`  
**Testing:** `.specs/codebase/TESTING.md`  
**Depends on:** platform-foundation (T1–T17 complete), auth existente  
**Status:** ✅ Done (2026-05-30)

---

## Execution Plan

### Phase 1: Backend Domain (Sequential)

```
T1 → T2 → T3
```

### Phase 2: Frontend API + Pages (Parallel after T2)

```
T2 complete, then:
  ├── T4 [P]  maquinasApi
  ├── T5 [P]  MaquinaListPage
  └── T6 [P]  MaquinaFormPage
T4 → T5, T6 (pages import api)
```

### Phase 3: Integration (Sequential)

```
T5 + T6 → T7
```

---

## Task Breakdown

### T1: Migration + domain Maquina

**What:** `V3__maquina.sql`, entity `Maquina`, enums `MaquinaTipo`/`MaquinaStatus`, `MaquinaRepository`.  
**Where:** `backend/src/main/resources/db/migration/`, `domain/`, `repository/`  
**Depends on:** platform foundation (Flyway V1/V2)  
**Reuses:** Padrão `Cliente` entity  
**Requirement:** MAQ-04, MAQ-05, MAQ-06

**Done when:**

- [x] Tabela `maquina` criada com UK em `codigo_patrimonio`
- [x] Repository com `findAllByOrderByNomeAsc` e query de busca
- [x] Gate: `mvn verify` passa (migration aplicada em test profile)

**Tests:** none (migration smoke via full gate)  
**Gate:** full-backend

**Commit:** `feat(maquina): add domain and migration`

---

### T2: MaquinaService

**What:** CRUD, patrimônio único, normalização blank→null, listagem com `?q=`.  
**Where:** `backend/.../service/MaquinaService.java`, exceptions, `GlobalExceptionHandler`  
**Depends on:** T1  
**Reuses:** `ClienteService` commands pattern, `DuplicateCpfException` pattern  
**Requirement:** MAQ-04..07, MAQ-10..12, MAQ-13..15, MAQ-16..17

**Done when:**

- [x] `criar`, `atualizar`, `listar`, `alterarStatus`, `buscarPorId`
- [x] Patrimônio duplicado → `DuplicatePatrimonioException`
- [x] Gate: `MaquinaServiceTest` → ≥8 tests pass

**Tests:** unit  
**Gate:** quick-backend

**Commit:** `feat(maquina): implement maquina service`

---

### T3: MaquinaController REST

**What:** Endpoints `/api/maquinas/**` + DTOs + `SecurityConfig` update.  
**Where:** `web/MaquinaController.java`, `web/dto/`, `config/SecurityConfig.java`  
**Depends on:** T2  
**Reuses:** `ClienteController` signatures  
**Requirement:** MAQ-01..03, MAQ-04..07, MAQ-08, MAQ-10..17

**Done when:**

- [x] GET list `?q=`, POST, GET id, PUT, PATCH status
- [x] 401 sem auth; 409 patrimônio dup
- [x] Gate: `MaquinaControllerWebTest` → ≥8 tests pass

**Tests:** integration  
**Gate:** full-backend

**Commit:** `feat(maquina): add maquina REST controller`

---

### T4: maquinasApi module [P]

**What:** Funções API + types TypeScript.  
**Where:** `frontend/src/api/maquinasApi.ts`, `frontend/src/types/maquina.ts`  
**Depends on:** T3, foundation T13 (`api/client.ts`)  
**Reuses:** `clientesApi` pattern  
**Requirement:** MAQ-01..07

**Done when:**

- [x] Types alinhados aos DTOs Java
- [x] Gate: `maquinasApi.test.ts` → ≥4 tests pass

**Tests:** unit  
**Gate:** quick-frontend

**Commit:** `feat(frontend): add maquinas api module`

---

### T5: MaquinaListPage [P]

**What:** Tabela, badges 3 status, busca debounced, ciclo status, empty state.  
**Where:** `frontend/src/routes/MaquinaListPage.tsx`  
**Depends on:** T4  
**Reuses:** `ClienteListPage`  
**Requirement:** MAQ-01..03, MAQ-08..09, MAQ-13..15, MAQ-16..17

**Done when:**

- [x] Lista ordenada alfabeticamente
- [x] Alteração de status (ATIVA/MANUTENCAO/INATIVA)
- [x] Busca por nome/marca/patrimônio
- [x] Gate: `MaquinaListPage.test.tsx` → ≥5 tests pass

**Tests:** unit  
**Gate:** quick-frontend

**Commit:** `feat(frontend): add maquina list page`

---

### T6: MaquinaFormPage [P]

**What:** Form create/edit — nome, tipo, marca, modelo, patrimônio, localização, observações.  
**Where:** `frontend/src/routes/MaquinaFormPage.tsx`  
**Depends on:** T4  
**Reuses:** `ClienteFormPage` (sem webcam)  
**Requirement:** MAQ-04..07, MAQ-10..12

**Done when:**

- [x] Modo create e edit
- [x] Validação client-side + erros API 409
- [x] Gate: `MaquinaFormPage.test.tsx` → ≥5 tests pass

**Tests:** unit  
**Gate:** quick-frontend

**Commit:** `feat(frontend): add maquina form page`

---

### T7: Wire admin routes (máquinas)

**What:** Rotas em `App.tsx`, links em `AdminLayout`, README fluxo máquinas.  
**Where:** `frontend/src/App.tsx`, `AdminLayout.tsx`, `README.md`  
**Depends on:** T5, T6, T3  
**Reuses:** ProtectedRoute existente  
**Requirement:** MAQ-08..09 (P1 MVP)

**Done when:**

- [x] `/admin/maquinas`, `/novo`, `/:id/editar` funcionais
- [x] `npm run build` + `mvn verify` passam

**Tests:** none  
**Gate:** build + full-backend + full-frontend

**Commit:** `feat(maquina): wire admin routes and document flow`

---

## Parallel Execution Map

```
T1 → T2 → T3
T3 → T4 [P] → T5 [P]
T4 → T6 [P]
T5 + T6 → T7
```

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1 | 1 migration + 1 entity + 1 repo | ✅ |
| T2 | 1 service | ✅ |
| T3 | 1 controller + security | ✅ |
| T5 | 1 page | ✅ |
| T6 | 1 page | ✅ |

---

## Diagram-Definition Cross-Check

| Task | Depends On | Diagram | Status |
| ---- | ---------- | ------- | ------ |
| T2 | T1 | T1→T2 | ✅ |
| T3 | T2 | T2→T3 | ✅ |
| T4 | T3 | T3→T4 | ✅ |
| T5 | T4 | T4→T5 | ✅ |
| T6 | T4 | T4→T6 | ✅ |
| T7 | T5,T6 | T5+T6→T7 | ✅ |

---

## Test Co-location Validation

| Task | Layer | Matrix | Task Says | Status |
| ---- | ----- | ------ | --------- | ------ |
| T2 | Service | unit | unit | ✅ |
| T3 | Controller | integration | integration | ✅ |
| T4 | API client | unit | unit | ✅ |
| T5 | Page | unit | unit | ✅ |
| T6 | Page | unit | unit | ✅ |
| T1 | Migration | none/smoke | none | ✅ |
| T7 | Wiring | none | none | ✅ |

---

## Requirement Traceability

| ID | Task(s) |
| -- | ------- |
| MAQ-01..03 | T3, T5 |
| MAQ-04..07 | T1, T2, T3, T6 |
| MAQ-08..09 | T3, T5, T7 |
| MAQ-10..12 | T2, T3, T6 |
| MAQ-13..15 | T2, T3, T5 |
| MAQ-16..17 | T2, T3, T5 |

**Coverage:** 17 requirements → 7 tasks, 0 unmapped ✅

---

## MCPs e Skills (pré-execução)

| Task type | MCPs sugeridos | Skills |
| --------- | -------------- | ------ |
| Backend Java | — | — |
| Frontend React | — | — |

**Disponíveis no projeto:** cursor-ide-browser (UAT futuro), plugin-linear-linear
