# Acompanhamento Nutricional — Tasks

**Design:** `.specs/features/acompanhamento-nutricional/design.md`  
**Testing:** `.specs/codebase/TESTING.md`  
**Depends on:** platform-foundation, cadastro clientes (entity `Cliente`), cadastro-maquinas T1 (migration V3 antes de V4)  
**Status:** ✅ Done (2026-05-30)

---

## Execution Plan

### Phase 1: Backend Domain (Sequential)

```
cadastro-maquinas T1 (V3) → T1 → T2 → T3
```

### Phase 2: Frontend Shared + API (Parallel after T2)

```
T2 complete, then:
  ├── T4 [P]  acompanhamentosApi
  └── T5 [P]  ClienteSelect
T4 + T5 → T6 [P] AcompanhamentoListPage
T4 + T5 → T7 [P] AcompanhamentoFormPage
```

### Phase 3: Integration (Sequential)

```
T6 + T7 → T8
```

---

## Task Breakdown

### T1: Migration + domain AcompanhamentoNutricional

**What:** `V4__acompanhamento_nutricional.sql`, entity, enum `AcompanhamentoStatus`, repository.  
**Where:** `backend/src/main/resources/db/migration/`, `domain/`, `repository/`  
**Depends on:** cadastro-maquinas T1 (V3), `Cliente` entity  
**Reuses:** FK pattern `evento_acesso` → `cliente`  
**Requirement:** NUT-04, NUT-05

**Done when:**

- [x] Tabela com FK `cliente_id` e índice `(cliente_id, data_consulta)`
- [x] Repository com listagem ordenada e query filtrada
- [x] Gate: `mvn verify` passa

**Tests:** none (migration smoke via full gate)  
**Gate:** full-backend

**Commit:** `feat(nutricao): add domain and migration`

---

### T2: AcompanhamentoNutricionalService

**What:** CRUD, validação datas/peso, listagem `clienteId` + `q`, cliente inativo OK.  
**Where:** `backend/.../service/AcompanhamentoNutricionalService.java`, exceptions  
**Depends on:** T1  
**Reuses:** `MaquinaService` / `ClienteService` patterns  
**Requirement:** NUT-04..08, NUT-11..13, NUT-14..16, NUT-17..20

**Done when:**

- [x] Data futura rejeitada; peso 20–500; proximaConsulta >= dataConsulta
- [x] Cliente inexistente → 404
- [x] Gate: `AcompanhamentoNutricionalServiceTest` → ≥10 tests pass

**Tests:** unit  
**Gate:** quick-backend

**Commit:** `feat(nutricao): implement acompanhamento service`

---

### T3: AcompanhamentoNutricionalController REST

**What:** Endpoints `/api/acompanhamentos/**` + DTOs + `SecurityConfig` update.  
**Where:** `web/AcompanhamentoNutricionalController.java`, `web/dto/`, `SecurityConfig.java`  
**Depends on:** T2  
**Reuses:** `MaquinaController` query params  
**Requirement:** NUT-01..10, NUT-11..20

**Done when:**

- [x] GET list `?clienteId=&q=`, POST, GET id, PUT, PATCH status
- [x] 401 sem auth; 400 validação; 404 not found
- [x] Gate: `AcompanhamentoNutricionalControllerWebTest` → ≥9 tests pass

**Tests:** integration  
**Gate:** full-backend

**Commit:** `feat(nutricao): add acompanhamento REST controller`

---

### T4: acompanhamentosApi module [P]

**What:** Funções API + types TypeScript.  
**Where:** `frontend/src/api/acompanhamentosApi.ts`, `frontend/src/types/acompanhamento.ts`  
**Depends on:** T3, foundation T13  
**Reuses:** `maquinasApi` / `clientesApi` pattern  
**Requirement:** NUT-01..08

**Done when:**

- [x] `listar({ clienteId?, q? })` tipado
- [x] Gate: `acompanhamentosApi.test.ts` → ≥4 tests pass

**Tests:** unit  
**Gate:** quick-frontend

**Commit:** `feat(frontend): add acompanhamentos api module`

---

### T5: ClienteSelect component [P]

**What:** Select de clientes (filtro + formulário) com busca opcional.  
**Where:** `frontend/src/components/ClienteSelect.tsx`  
**Depends on:** foundation T13, `clientesApi` existente  
**Reuses:** `clientesApi.listar()`  
**Requirement:** NUT-04, NUT-17..18

**Done when:**

- [x] Props `value`, `onChange`, `disabled`, `placeholder`
- [x] Gate: `ClienteSelect.test.tsx` → ≥3 tests pass

**Tests:** unit  
**Gate:** quick-frontend

**Commit:** `feat(frontend): add cliente select component`

---

### T6: AcompanhamentoListPage [P]

**What:** Tabela, filtro cliente, busca debounced, badge status, toggle inativar.  
**Where:** `frontend/src/routes/AcompanhamentoListPage.tsx`  
**Depends on:** T4, T5  
**Reuses:** `MaquinaListPage` / `ClienteListPage`  
**Requirement:** NUT-01..03, NUT-09..10, NUT-14..16, NUT-17..20

**Done when:**

- [x] Ordenação data consulta desc
- [x] Filtro por cliente + busca textual
- [x] Inativos visíveis com badge
- [x] Gate: `AcompanhamentoListPage.test.tsx` → ≥6 tests pass

**Tests:** unit  
**Gate:** quick-frontend

**Commit:** `feat(frontend): add acompanhamento list page`

---

### T7: AcompanhamentoFormPage [P]

**What:** Form create/edit — ClienteSelect (create), datas, peso, campos texto; cliente read-only no edit.  
**Where:** `frontend/src/routes/AcompanhamentoFormPage.tsx`  
**Depends on:** T4, T5  
**Reuses:** `MaquinaFormPage` validation UX  
**Requirement:** NUT-04..08, NUT-11..13

**Done when:**

- [x] Create com ClienteSelect; edit com cliente fixo
- [x] Validação data não futura + peso client-side
- [x] Gate: `AcompanhamentoFormPage.test.tsx` → ≥6 tests pass

**Tests:** unit  
**Gate:** quick-frontend

**Commit:** `feat(frontend): add acompanhamento form page`

---

### T8: Wire admin routes (acompanhamentos)

**What:** Rotas em `App.tsx`, links em `AdminLayout`, README fluxo nutrição.  
**Where:** `frontend/src/App.tsx`, `AdminLayout.tsx`, `README.md`  
**Depends on:** T6, T7, T3  
**Reuses:** ProtectedRoute  
**Requirement:** NUT-09..10 (P1 MVP)

**Done when:**

- [x] `/admin/acompanhamentos`, `/novo`, `/:id/editar` funcionais
- [x] `npm run build` + `mvn verify` passam

**Tests:** none  
**Gate:** build + full-backend + full-frontend

**Commit:** `feat(nutricao): wire admin routes and document flow`

---

## Parallel Execution Map

```
cadastro-maquinas T1 → T1 → T2 → T3
T3 → T4 [P]
T3 → T5 [P]  (T5 independente do backend nutrição — só clientesApi)
T4 + T5 → T6 [P]
T4 + T5 → T7 [P]
T6 + T7 → T8
```

> **Nota:** T5 (`ClienteSelect`) pode iniciar em paralelo com cadastro-maquinas frontend se `clientesApi` já existir.

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1 | 1 migration + 1 entity + 1 repo | ✅ |
| T2 | 1 service | ✅ |
| T3 | 1 controller | ✅ |
| T5 | 1 component | ✅ |
| T6 | 1 page | ✅ |
| T7 | 1 page | ✅ |

---

## Diagram-Definition Cross-Check

| Task | Depends On | Diagram | Status |
| ---- | ---------- | ------- | ------ |
| T1 | maquinas T1 | V3→T1 | ✅ |
| T2 | T1 | T1→T2 | ✅ |
| T3 | T2 | T2→T3 | ✅ |
| T4 | T3 | T3→T4 | ✅ |
| T5 | clientesApi | parallel OK | ✅ |
| T6 | T4,T5 | T4+T5→T6 | ✅ |
| T7 | T4,T5 | T4+T5→T7 | ✅ |
| T8 | T6,T7 | T6+T7→T8 | ✅ |

---

## Test Co-location Validation

| Task | Layer | Matrix | Task Says | Status |
| ---- | ----- | ------ | --------- | ------ |
| T2 | Service | unit | unit | ✅ |
| T3 | Controller | integration | integration | ✅ |
| T4 | API client | unit | unit | ✅ |
| T5 | Component | unit | unit | ✅ |
| T6 | Page | unit | unit | ✅ |
| T7 | Page | unit | unit | ✅ |
| T1 | Migration | smoke | none | ✅ |
| T8 | Wiring | none | none | ✅ |

---

## Requirement Traceability

| ID | Task(s) |
| -- | ------- |
| NUT-01..03 | T3, T6 |
| NUT-04..08 | T1, T2, T3, T5, T7 |
| NUT-09..10 | T3, T6, T8 |
| NUT-11..13 | T2, T3, T7 |
| NUT-14..16 | T2, T3, T6 |
| NUT-17..18 | T2, T3, T5, T6 |
| NUT-19..20 | T2, T3, T6 |

**Coverage:** 20 requirements → 8 tasks, 0 unmapped ✅

---

## Ordem global (ambas features)

```
cadastro-maquinas T1–T7  (completo)
acompanhamento T1–T8     (após maquinas T1 para V4)
```

Paralelismo possível: `acompanhamento T5` durante `cadastro-maquinas T4–T7`.

---

## MCPs e Skills (pré-execução)

| Task type | MCPs sugeridos | Skills |
| --------- | -------------- | ------ |
| Backend Java | — | — |
| Frontend React | — | — |

**Disponíveis no projeto:** cursor-ide-browser (UAT futuro), plugin-linear-linear
