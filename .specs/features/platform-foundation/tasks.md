# Platform Foundation — Tasks

**Design:** `.specs/project/SYSTEM-DESIGN.md`  
**Testing:** `.specs/codebase/TESTING.md`  
**Status:** Draft

---

## Execution Plan

### Phase 1: Scaffolding (Sequential)

```
T1 → T2 → T3 → T4 → T5
```

### Phase 2: Backend Core (Parallel after T4)

```
T4 complete, then:
  ├── T6 [P]  CpfValidator
  ├── T7 [P]  ImageStorageService
  └── T8      Flyway seed admin
T6 + T7 → T9 → T10
```

### Phase 3: Frontend Scaffold (Parallel with Phase 2 after T1)

```
T1 complete, then:
  T5 → T11 → T12 [P] → T13 [P]
(T5 independent of T2-T4 backend)
```

### Phase 4: Security & ML (Sequential)

```
T8 + T9 + T13 → T14 → T15 → T16
```

### Phase 5: DevOps (After T16)

```
T16 → T17
```

---

## Task Breakdown

### T1: Backend Spring Boot scaffold

**What:** Projeto Maven Java 21 + Spring Boot 3 (`backend/pom.xml`, main class, `application.yml` base).  
**Where:** `backend/`  
**Depends on:** None  
**Reuses:** —  
**Requirement:** INFRA-01

**Tools:** MCP: none | Skill: none

**Done when:**

- [x] `backend/pom.xml` com Web, JPA, Security, Flyway, MySQL driver, Validation
- [x] `FaceAccessApplication.java` compila
- [x] `mvn -q compile` passa

**Tests:** none  
**Gate:** build (`mvn -q compile`)

**Verify:** `cd backend && mvn -q compile` → exit 0

**Commit:** `chore(backend): scaffold Spring Boot project`

---

### T2: Flyway schema V1

**What:** Migration SQL com tabelas `admin_user`, `cliente`, `face_foto`, `evento_acesso`.  
**Where:** `backend/src/main/resources/db/migration/V1__schema.sql`  
**Depends on:** T1  
**Reuses:** SYSTEM-DESIGN schema  
**Requirement:** INFRA-02

**Done when:**

- [x] Todas as tabelas, FKs, índices e UNIQUE constraints criados
- [x] Flyway habilitado em `application.yml`

**Tests:** none  
**Gate:** full-backend (smoke após T4)

**Verify:** Subir app com MySQL → Flyway success no log

**Commit:** `feat(db): add V1 schema migration`

---

### T3: JPA entities

**What:** Entidades `AdminUser`, `Cliente`, `FaceFoto`, `EventoAcesso` + enums.  
**Where:** `backend/src/main/java/.../domain/`  
**Depends on:** T2  
**Reuses:** —  
**Requirement:** INFRA-03

**Done when:**

- [x] 4 entities mapeiam schema V1
- [x] Relacionamentos `@OneToMany` / `@ManyToOne` corretos
- [x] `mvn -q compile` passa

**Tests:** none  
**Gate:** build

**Commit:** `feat(domain): add JPA entities`

---

### T4: JPA repositories

**What:** Repositories Spring Data para as 4 entidades + queries de cooldown.  
**Where:** `backend/src/main/java/.../repository/`  
**Depends on:** T3  
**Reuses:** —  
**Requirement:** INFRA-04

**Done when:**

- [x] `EventoAcessoRepository` com `existsByClienteIdAndOcorridoEmAfter`
- [x] `ClienteRepository` com busca por nome/CPF
- [x] `@DataJpaTest` smoke: context loads

**Tests:** integration  
**Gate:** full-backend

**Verify:** `cd backend && mvn -q test -Dtest="*RepositoryTest"` → ≥1 test pass

**Commit:** `feat(repo): add JPA repositories`

---

### T5: Docker Compose MySQL dev

**What:** `docker-compose.yml` MySQL 8 + perfis `application-dev.yml`.  
**Where:** `docker-compose.yml`, `backend/src/main/resources/application-dev.yml`  
**Depends on:** T1  
**Reuses:** —  
**Requirement:** INFRA-05

**Done when:**

- [x] `docker compose up -d` sobe MySQL na porta 3306
- [x] Profile `dev` conecta ao container

**Tests:** none  
**Gate:** manual

**Commit:** `chore(dev): add docker-compose mysql`

---

### T6: CpfValidator [P]

**What:** Validador CPF (dígitos verificadores) + annotation `@CpfValid`.  
**Where:** `backend/.../service/CpfValidator.java`, `.../validation/CpfValid.java`  
**Depends on:** T1  
**Reuses:** —  
**Requirement:** CAD-05 (edge case CPF)

**Done when:**

- [x] CPFs válidos/inválidos cobertos
- [x] Gate: `mvn -q test -Dtest=CpfValidatorTest` → ≥5 tests pass

**Tests:** unit  
**Gate:** quick-backend

**Commit:** `feat(validation): add CPF validator`

---

### T7: ImageStorageService local [P]

**What:** Salvar/ler/deletar imagens no filesystem local via `storage_key`.  
**Where:** `backend/.../service/ImageStorageService.java`  
**Depends on:** T1  
**Reuses:** `application.yml` storage config  
**Requirement:** CAD-05

**Done when:**

- [x] `save(base64)`, `load(key)`, `delete(key)` implementados
- [x] Gate: `ImageStorageServiceTest` → ≥4 tests pass

**Tests:** unit  
**Gate:** quick-backend

**Commit:** `feat(storage): add local image storage service`

---

### T8: Admin user seed V2

**What:** Flyway V2 seed admin com BCrypt (`ADMIN_PASSWORD` env).  
**Where:** `backend/.../db/migration/V2__seed_admin.sql` ou Java migration  
**Depends on:** T2  
**Reuses:** —  
**Requirement:** CAD-01

**Done when:**

- [x] Admin default criado no primeiro run
- [x] Senha via env var documentada no README

**Tests:** none  
**Gate:** manual

**Commit:** `feat(auth): seed admin user`

---

### T9: SecurityConfig + CORS + CSRF

**What:** Sessão HTTP, rotas públicas/protegidas, CORS dev, CSRF cookie.  
**Where:** `backend/.../config/SecurityConfig.java`  
**Depends on:** T1, T8  
**Reuses:** SYSTEM-DESIGN security table  
**Requirement:** CAD-01, ENT-01

**Done when:**

- [x] `/api/access/**`, `/api/auth/login` públicos
- [x] `/api/clientes/**` exige autenticação
- [x] CORS `localhost:5173` com credentials

**Tests:** integration (via T14 smoke)  
**Gate:** full-backend

**Commit:** `feat(security): configure session auth and CORS`

---

### T10: WebConfig SPA fallback

**What:** Forward rotas não-API para `index.html`; servir `/static`.  
**Where:** `backend/.../config/WebConfig.java`  
**Depends on:** T9  
**Reuses:** —  
**Requirement:** INFRA-06

**Done when:**

- [x] `/admin/**` client-side routes servem index.html em prod

**Tests:** none  
**Gate:** build

**Commit:** `feat(web): add SPA fallback config`

---

### T11: Frontend Vite + React + TS + Tailwind scaffold

**What:** Projeto `frontend/` com Vite, React 18, TypeScript, Tailwind, forms plugin.  
**Where:** `frontend/`  
**Depends on:** None (parallel T1)  
**Reuses:** —  
**Requirement:** INFRA-07

**Done when:**

- [x] `npm run dev` inicia em :5173
- [x] `index.css` com `@tailwind` directives
- [x] `tailwind.config.js` com tokens `access.*`

**Tests:** none  
**Gate:** full-frontend (`npm run build`)

**Commit:** `chore(frontend): scaffold vite react tailwind`

---

### T12: React Router shell [P]

**What:** `App.tsx` com rotas stub: `/login`, `/admin/clientes`, `/entrada`.  
**Where:** `frontend/src/App.tsx`, `frontend/src/main.tsx`  
**Depends on:** T11  
**Reuses:** —  
**Requirement:** CAD-01, ENT-01

**Done when:**

- [x] 4 rotas renderizam placeholder
- [x] `npm run build` passa

**Tests:** none  
**Gate:** full-frontend

**Commit:** `feat(frontend): add react router shell`

---

### T13: API client fetch wrapper [P]

**What:** `api/client.ts` com credentials, CSRF header, 401 handler.  
**Where:** `frontend/src/api/client.ts`  
**Depends on:** T11  
**Reuses:** —  
**Requirement:** CAD-01

**Done when:**

- [x] `apiGet`, `apiPost`, `apiPut`, `apiPatch` exportados
- [x] CSRF lê cookie `XSRF-TOKEN`

**Tests:** unit  
**Gate:** quick-frontend

**Verify:** `client.test.ts` → ≥3 tests pass

**Commit:** `feat(frontend): add api fetch client`

---

### T14: FaceRecognitionConfig DJL beans

**What:** Configuração DJL ONNX — detector + embedding model beans.  
**Where:** `backend/.../config/FaceRecognitionConfig.java`, `resources/models/`  
**Depends on:** T1  
**Reuses:** DJL docs  
**Requirement:** CAD-05, ENT-02

**Done when:**

- [x] Beans `FaceDetector` e `FaceEmbedder` criados
- [x] Modelos ONNX documentados (download script ou bundled)
- [x] App inicia sem erro (models presentes)

**Tests:** none  
**Gate:** manual smoke

**Commit:** `feat(ml): configure DJL face recognition beans`

---

### T15: FaceRecognitionService

**What:** `detectFaces`, `extractEmbedding`, `findBestMatch`, cache embeddings.  
**Where:** `backend/.../service/FaceRecognitionService.java`  
**Depends on:** T4, T14  
**Reuses:** T7  
**Requirement:** CAD-05, ENT-02, ENT-03

**Done when:**

- [x] Detecta 0/1/N faces
- [x] Match por distância euclidiana + threshold
- [x] Gate: `FaceRecognitionServiceTest` → ≥6 tests pass (mocked predictors)

**Tests:** unit  
**Gate:** quick-backend

**Commit:** `feat(ml): implement face recognition service`

---

### T16: Frontend Vitest setup

**What:** Config Vitest + RTL + script `npm test`.  
**Where:** `frontend/vite.config.ts`, `frontend/src/setupTests.ts`  
**Depends on:** T11  
**Reuses:** TESTING.md  
**Requirement:** INFRA-08

**Done when:**

- [x] `npm test -- --run` executa (mesmo 0 tests → setup OK)
- [x] Sample test passa

**Tests:** none  
**Gate:** quick-frontend

**Commit:** `chore(frontend): configure vitest`

---

### T17: Dockerfile + build script

**What:** Multi-stage Docker (frontend build → backend jar); script `build.sh`.  
**Where:** `Dockerfile`, `scripts/build.sh`  
**Depends on:** T10, T12  
**Reuses:** SYSTEM-DESIGN deploy  
**Requirement:** INFRA-09

**Done when:**

- [x] `scripts/build.sh` gera JAR com static/
- [ ] `docker build` completa _(Docker indisponível neste ambiente; Dockerfile pronto)_

**Tests:** none  
**Gate:** build

**Commit:** `chore(deploy): add dockerfile and build script`

---

## Parallel Execution Map

```
Phase 1:  T1 ──→ T2 ──→ T3 ──→ T4
              └──→ T5
Phase 2:  T4 ──┬→ T6 [P]
               ├→ T7 [P]
               └→ T8 ──→ T9 ──→ T10
Phase 3:  T1 ──→ T11 ──→ T12 [P]
                      └──→ T13 [P]
                      └──→ T16
Phase 4:  T4 + T14 ──→ T15
Phase 5:  T10 + T12 ──→ T17
```

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1 | 1 scaffold | ✅ |
| T2 | 1 migration file | ✅ |
| T3 | 4 entities (cohesive domain) | ✅ |
| T6 | 1 validator | ✅ |
| T15 | 1 service | ✅ |
| T11 | 1 frontend scaffold | ✅ |

---

## Diagram-Definition Cross-Check

| Task | Depends On | Diagram | Status |
| ---- | ---------- | ------- | ------ |
| T2 | T1 | T1→T2 | ✅ |
| T6 | T1 | T4→T6 (after T1 ok) | ✅ |
| T7 | T1 | T4→T7 | ✅ |
| T15 | T4, T14 | T4+T14→T15 | ✅ |
| T17 | T10, T12 | T10+T12→T17 | ✅ |

---

## Test Co-location Validation

| Task | Layer | Matrix | Task Says | Status |
| ---- | ----- | ------ | --------- | ------ |
| T4 | Repository | integration | integration | ✅ |
| T6 | Validator | unit | unit | ✅ |
| T7 | Service | unit | unit | ✅ |
| T15 | Service | unit | unit | ✅ |
| T13 | API client | unit | unit | ✅ |
| T9 | Config | controller covers | integration deferred | ✅ |

---

## Requirement Traceability

| ID | Task |
| -- | ---- |
| INFRA-01..09 | T1-T17 (platform) |

**Coverage:** 9 infra requirements, 17 tasks mapped
