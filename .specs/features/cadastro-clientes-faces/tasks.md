# Cadastro de Clientes e Faces — Tasks

**Design:** `.specs/features/cadastro-clientes-faces/design.md`  
**Testing:** `.specs/codebase/TESTING.md`  
**Depends on:** `.specs/features/platform-foundation/tasks.md` (T1-T16 complete)  
**Status:** Draft

---

## Execution Plan

### Phase 1: Auth API + Frontend Auth (Sequential)

```
foundation T9 → T1 → T2 → T3 → T4
```

### Phase 2: Cliente Backend (Sequential)

```
foundation T15 → T5 → T6
```

### Phase 3: Webcam + Validation (Parallel after T4)

```
T4 complete, then:
  ├── T7 [P]  useWebcam hook
  └── T8      FaceValidationController
T7 → T9 [P] WebcamCapture
T8 + T5 → T10
```

### Phase 4: Admin UI Pages (Sequential)

```
T3 + T6 → T11 → T12 → T13
T9 + T10 → T14
T11 + T14 → T15 (integration smoke)
```

---

## Task Breakdown

### T1: AuthController REST endpoints

**What:** `POST /api/auth/login`, `POST /api/auth/logout`, `GET /api/auth/me`.  
**Where:** `backend/.../web/AuthController.java`, DTOs  
**Depends on:** foundation T9  
**Reuses:** `AdminUserRepository`, BCrypt  
**Requirement:** CAD-01, CAD-02, CAD-03, CAD-04

**Done when:**

- [x] Login válido cria sessão; inválido retorna 401 genérico
- [x] Logout invalida sessão
- [x] Gate: `AuthControllerWebTest` → ≥5 tests pass

**Tests:** integration  
**Gate:** full-backend

**Commit:** `feat(auth): add auth REST endpoints`

---

### T2: authApi + useAuth + AuthProvider

**What:** Client API auth + context React + hook.  
**Where:** `frontend/src/api/authApi.ts`, `frontend/src/hooks/useAuth.ts`  
**Depends on:** foundation T13, T1  
**Reuses:** `api/client.ts`  
**Requirement:** CAD-01, CAD-04

**Done when:**

- [x] `AuthProvider` wrap App
- [x] `useAuth` expõe login/logout/user
- [x] Gate: `useAuth.test.ts` → ≥4 tests pass

**Tests:** unit  
**Gate:** quick-frontend

**Commit:** `feat(frontend): add auth context and hook`

---

### T3: ProtectedRoute + LoginPage

**What:** Guard de rotas admin + formulário login Tailwind.  
**Where:** `frontend/src/components/ProtectedRoute.tsx`, `frontend/src/routes/LoginPage.tsx`  
**Depends on:** T2, foundation T12  
**Reuses:** `@tailwindcss/forms`  
**Requirement:** CAD-01, CAD-02, CAD-03

**Done when:**

- [x] `/admin/*` redirect `/login` se não autenticado
- [x] Login bem-sucedido → `/admin/clientes`
- [x] Gate: `LoginPage.test.tsx` → ≥3 tests pass

**Tests:** unit  
**Gate:** quick-frontend

**Commit:** `feat(frontend): add login page and protected routes`

---

### T4: AdminLayout component

**What:** Layout admin com navbar, logout, outlet.  
**Where:** `frontend/src/components/AdminLayout.tsx`  
**Depends on:** T3  
**Reuses:** Tailwind admin patterns  
**Requirement:** CAD-04

**Done when:**

- [x] Navbar com link Clientes + botão Sair
- [x] Gate: `AdminLayout.test.tsx` → ≥2 tests pass

**Tests:** unit  
**Gate:** quick-frontend

**Commit:** `feat(frontend): add admin layout`

---

### T5: ClienteService

**What:** CRUD clientes, CPF único, mascarar CPF, persistir 2 fotos + embeddings.  
**Where:** `backend/.../service/ClienteService.java`  
**Depends on:** foundation T4 (repos), foundation T6 (CpfValidator), foundation T7 (ImageStorage), foundation T15 (FaceRecognition)  
**Reuses:** `CpfValidator`, `FaceRecognitionService`, `ImageStorageService`  
**Requirement:** CAD-05..09, CAD-13..19

**Done when:**

- [x] `criar`, `atualizar`, `listar`, `alterarStatus` implementados
- [x] CPF duplicado → exception
- [x] Gate: `ClienteServiceTest` → ≥10 tests pass

**Tests:** unit  
**Gate:** quick-backend

**Commit:** `feat(cliente): implement cliente service`

---

### T6: ClienteController REST

**What:** Endpoints CRUD `/api/clientes/**` + stream foto.  
**Where:** `backend/.../web/ClienteController.java`  
**Depends on:** T5, foundation T9  
**Reuses:** DTOs com `@CpfValid`  
**Requirement:** CAD-05..12, CAD-13..19, CAD-20..21

**Done when:**

- [x] GET list com `?q=`, POST, PUT, PATCH status, GET foto
- [x] Gate: `ClienteControllerWebTest` → ≥8 tests pass

**Tests:** integration  
**Gate:** full-backend

**Commit:** `feat(cliente): add cliente REST controller`

---

### T7: useWebcam hook [P]

**What:** Hook MediaDevices — start, stop, captureFrame base64, error states.  
**Where:** `frontend/src/hooks/useWebcam.ts`  
**Depends on:** foundation T16  
**Reuses:** —  
**Requirement:** CAD-05, CAD-08

**Done when:**

- [x] Mock `getUserMedia` nos tests
- [x] Gate: `useWebcam.test.ts` → ≥5 tests pass

**Tests:** unit  
**Gate:** quick-frontend

**Commit:** `feat(frontend): add useWebcam hook`

---

### T8: FaceValidationController

**What:** `POST /api/faces/validate` — detecta rosto, retorna valid + faceCount.  
**Where:** `backend/.../web/FaceValidationController.java`  
**Depends on:** foundation T15, T9  
**Reuses:** `FaceRecognitionService.detectFaces`  
**Requirement:** CAD-07, CAD-08

**Done when:**

- [x] Sem rosto → valid=false; 2+ rostos → faceCount>1
- [x] Gate: `FaceValidationControllerWebTest` → ≥4 tests pass

**Tests:** integration  
**Gate:** full-backend

**Commit:** `feat(faces): add face validation endpoint`

---

### T9: WebcamCapture component [P]

**What:** Componente preview `<video>` + botão capturar.  
**Where:** `frontend/src/components/WebcamCapture.tsx`  
**Depends on:** T7  
**Reuses:** `useWebcam`  
**Requirement:** CAD-05

**Done when:**

- [x] Render preview + botão "Capturar"
- [x] `onCapture(base64)` callback
- [x] Gate: `WebcamCapture.test.tsx` → ≥3 tests pass

**Tests:** unit  
**Gate:** quick-frontend

**Commit:** `feat(frontend): add webcam capture component`

---

### T10: FaceCaptureWizard component

**What:** Wizard 2 slots — valida via API, exibe progresso foto 1/2.  
**Where:** `frontend/src/components/FaceCaptureWizard.tsx`  
**Depends on:** T8, T9, foundation T13  
**Reuses:** `facesApi.validate`  
**Requirement:** CAD-05, CAD-07, CAD-08

**Done when:**

- [ ] Não avança slot sem validação OK
- [ ] Gate: `FaceCaptureWizard.test.tsx` → ≥4 tests pass

**Tests:** unit  
**Gate:** quick-frontend

**Commit:** `feat(frontend): add face capture wizard`

---

### T11: clientesApi module

**What:** Funções API clientes (list, create, update, patchStatus).  
**Where:** `frontend/src/api/clientesApi.ts`, `frontend/src/types/cliente.ts`  
**Depends on:** foundation T13, T6  
**Reuses:** `api/client.ts`  
**Requirement:** CAD-05..12

**Done when:**

- [x] Types TypeScript alinhados aos DTOs Java
- [x] Gate: `clientesApi.test.ts` → ≥4 tests pass

**Tests:** unit  
**Gate:** quick-frontend

**Commit:** `feat(frontend): add clientes api module`

---

### T12: ClienteListPage

**What:** Tabela clientes, CPF mascarado, status badge, busca debounced, empty state.  
**Where:** `frontend/src/routes/ClienteListPage.tsx`  
**Depends on:** T4, T11  
**Reuses:** `AdminLayout`, Tailwind table  
**Requirement:** CAD-10, CAD-11, CAD-12, CAD-17..19, CAD-20..21

**Done when:**

- [ ] Lista ordenada alfabeticamente
- [ ] Toggle ativo/inativo
- [ ] Busca por nome/CPF
- [ ] Gate: `ClienteListPage.test.tsx` → ≥5 tests pass

**Tests:** unit  
**Gate:** quick-frontend

**Commit:** `feat(frontend): add cliente list page`

---

### T13: ClienteFormPage

**What:** Form novo/editar — nome, CPF, wizard fotos, submit.  
**Where:** `frontend/src/routes/ClienteFormPage.tsx`  
**Depends on:** T10, T11, T4  
**Reuses:** `FaceCaptureWizard`  
**Requirement:** CAD-05..09, CAD-13..16

**Done when:**

- [ ] Modo create e edit
- [ ] Validação CPF client-side + erros API
- [ ] Gate: `ClienteFormPage.test.tsx` → ≥5 tests pass

**Tests:** unit  
**Gate:** quick-frontend

**Commit:** `feat(frontend): add cliente form page`

---

### T14: facesApi module

**What:** `validateFace(base64)` wrapper.  
**Where:** `frontend/src/api/facesApi.ts`  
**Depends on:** T8, foundation T13  
**Reuses:** —  
**Requirement:** CAD-07

**Done when:**

- [x] Tipagem `FaceValidationResponse`
- [x] Gate: `facesApi.test.ts` → ≥2 tests pass

**Tests:** unit  
**Gate:** quick-frontend

**Commit:** `feat(frontend): add faces api module`

---

### T15: Cadastro integration smoke

**What:** Wire rotas finais em App.tsx; README fluxo cadastro manual.  
**Where:** `frontend/src/App.tsx`, `README.md`  
**Depends on:** T12, T13, T3  
**Reuses:** —  
**Requirement:** CAD-01..12 (P1 MVP)

**Done when:**

- [ ] Fluxo manual documentado: login → cadastrar → listar
- [ ] `npm run build` + `mvn verify` passam

**Tests:** none  
**Gate:** build + full-backend + full-frontend

**Commit:** `feat(cadastro): wire admin routes and document flow`

---

## Parallel Execution Map

```
foundation T15 → T5 → T6
T5 ──→ T11
foundation T16 ──→ T7 [P] → T9 [P] → T10
foundation T9 + T15 ──→ T8 ──→ T10
T1 → T2 → T3 → T4
T4 + T11 → T12
T10 + T11 + T4 → T13
T12 + T13 + T3 → T15
```

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1 | 1 controller | ✅ |
| T5 | 1 service | ✅ |
| T12 | 1 page | ✅ |
| T10 | 1 wizard component | ✅ |

---

## Diagram-Definition Cross-Check

| Task | Depends On | Diagram | Status |
| ---- | ---------- | ------- | ------ |
| T5 | foundation T4,T6,T7,T15 | foundation→T5 | ✅ |
| T10 | T8,T9 | T8+T9→T10 | ✅ |
| T15 | T12,T13,T3 | T12+T13+T3→T15 | ✅ |
| T7 | foundation T16 | parallel OK | ✅ |

---

## Test Co-location Validation

| Task | Layer | Matrix | Task Says | Status |
| ---- | ----- | ------ | --------- | ------ |
| T1 | Controller | integration | integration | ✅ |
| T5 | Service | unit | unit | ✅ |
| T6 | Controller | integration | integration | ✅ |
| T8 | Controller | integration | integration | ✅ |
| T7 | Hook | unit | unit | ✅ |
| T12 | Page | unit | unit | ✅ |

---

## Requirement Traceability

| ID | Task(s) |
| -- | ------- |
| CAD-01..04 | T1, T2, T3 |
| CAD-05..09 | T5, T6, T8, T9, T10, T13 |
| CAD-10..12 | T6, T11, T12 |
| CAD-13..16 | T5, T6, T13 |
| CAD-17..19 | T5, T6, T12 |
| CAD-20..21 | T5, T6, T12 |

**Coverage:** 21 requirements → 15 tasks, 0 unmapped ✅

---

## MCPs e Skills (pré-execução)

Antes de executar, confirme ferramentas por task:

| Task type | MCPs sugeridos | Skills |
| --------- | -------------- | ------ |
| Backend Java | — | — |
| Frontend React | — | — |
| DJL setup (foundation T14) | web search | — |

**Disponíveis no projeto:** cursor-ide-browser (UAT futuro), plugin-linear-linear
