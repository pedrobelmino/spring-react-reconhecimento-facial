# Testing Strategy

**Project:** Academia Face Access (greenfield)  
**Last Updated:** 2026-05-25

---

## Stack de testes

| Camada | Framework | Local |
| ------ | --------- | ----- |
| Backend unit | JUnit 5 + Mockito | `backend/src/test/java/` |
| Backend integration | Spring Boot Test + `@WebMvcTest` / `@SpringBootTest` | `backend/src/test/java/` |
| Backend DB (integration) | `@DataJpaTest` + Testcontainers MySQL (full gate) | `backend/src/test/java/` |
| Frontend unit | Vitest + React Testing Library + jsdom | `frontend/src/**/*.test.tsx` |
| E2E | _Deferred pós-MVP_ | — |

---

## Gate Check Commands

| Gate | Comando | Quando usar |
| ---- | ------- | ----------- |
| **quick-backend** | `cd backend && mvn -q test -Dtest="*Test" -DfailIfNoTests=false` | Services, validators, utils |
| **quick-frontend** | `cd frontend && npm test -- --run` | Hooks, components |
| **full-backend** | `cd backend && mvn verify` | Controllers, integração |
| **full-frontend** | `cd frontend && npm run build && npm test -- --run` | Pages, build |
| **build** | `cd frontend && npm run build && cd ../backend && mvn -q package -DskipTests` | Deploy artifact |

---

## Test Coverage Matrix

| Code Layer | Required Test | Gate | Parallel-Safe |
| ---------- | ------------- | ---- | ------------- |
| Validators (`CpfValidator`) | unit | quick-backend | Yes |
| Services (`*Service`) | unit | quick-backend | Yes |
| `FaceRecognitionService` | unit (mocked models) | quick-backend | No* |
| `ImageStorageService` | unit | quick-backend | Yes |
| JPA Repositories | integration `@DataJpaTest` | full-backend | No |
| REST Controllers | integration `@WebMvcTest` | full-backend | No |
| React hooks | unit Vitest | quick-frontend | Yes |
| React components | unit Vitest | quick-frontend | Yes |
| React pages | unit Vitest | quick-frontend | Yes |
| Config (`SecurityConfig`, etc.) | covered by controller tests | full-backend | No |
| Migrations Flyway | manual / full-backend smoke | full-backend | No |
| Docker / GCP deploy | manual | build | No |

\*DJL model loading — testes unitários mockam `Predictor`; teste manual separado para inferência real.

---

## Parallelism Assessment

| Test Type | Parallel-Safe | Reason |
| --------- | ------------- | ------ |
| Backend unit (`*Test`) | Yes | Sem estado compartilhado |
| Backend `@WebMvcTest` | No | Context Spring por classe |
| Backend `@DataJpaTest` | No | Container DB |
| Frontend Vitest | Yes | `--run` isolado por arquivo |
| Full `mvn verify` | No | Sequencial |

**Regra:** Task com `Tests: integration` ou `@WebMvcTest` **não** recebe flag `[P]`.

---

## Convenções

- Nome backend: `{ClassName}Test.java`, `{ClassName}WebTest.java` para controllers
- Nome frontend: `{name}.test.ts(x)` co-located
- Nunca deletar testes silenciosamente — gate exige contagem documentada em `Done when`
- H2 em memória permitido para `@DataJpaTest` rápido; Testcontainers MySQL no full gate

---

## Dev dependencies

**Backend (`pom.xml`):** `spring-boot-starter-test`, `testcontainers-mysql` (optional full)

**Frontend (`package.json`):** `vitest`, `@testing-library/react`, `@testing-library/jest-dom`, `jsdom`
