# State

**Last Updated:** 2026-05-25
**Current Work:** tela-entrada T6 (useRecognitionLoop) concluído — próximo: T7 EntradaPage

---

## Recent Decisions (Last 60 days)

### AD-001: Single-tenant no MVP (2026-05-25)

**Decision:** A v1 opera com uma única academia por instância; multi-empresa fica para pós-MVP.
**Reason:** Reduz complexidade de isolamento de dados e autenticação na primeira entrega.
**Trade-off:** Cada academia precisa de sua própria instância/deploy até o multi-tenant existir.
**Impact:** Schema e API não precisam de `tenant_id` na v1.

### AD-003: DJL + ONNX para reconhecimento facial (2026-05-25)

**Decision:** Reconhecimento facial server-side com DJL (Ultra-Light detector + embedding ArcFace/MobileFaceNet ONNX).
**Reason:** Stack Java puro; acurácia superior a OpenCV LBPH para meta ≥95%.
**Trade-off:** Cloud Run precisa ≥2Gi RAM; setup de modelos mais complexo que face-api.js.
**Impact:** FaceRecognitionService compartilhado entre cadastro e entrada; fallback face-api.js documentado.

### AD-004: Monolito Spring Boot + React SPA (2026-05-25, revisado)

**Decision:** Backend Spring Boot (API REST) + frontend React (Vite/TypeScript) em pasta `frontend/`; build React embarcado em `static/` para deploy único.
**Reason:** Requisito do usuário (React); deploy único no Cloud Run; DX com Vite HMR em dev.
**Trade-off:** Dois projetos no repo; pipeline de build em duas etapas.
**Impact:** Sem PageController/Thymeleaf; React Router; CORS em dev; CSRF via header.

### AD-006: Tailwind CSS para estilização (2026-05-25)

**Decision:** Tailwind CSS v3 com `@tailwindcss/forms`; tokens `access-granted/denied/warning` no `tailwind.config.js`.
**Reason:** Requisito do usuário; utility-first acelera MVP admin + tela fullscreen.
**Trade-off:** Classes verbose nos JSX; mitigado com componentes wrapper opcionais.
**Impact:** `index.css` com directives `@tailwind`; sem CSS modules.

### AD-002: Stack fixa Java 21 + Spring + MySQL + GCP (2026-05-25)

**Decision:** Backend em Java 21 com Spring Boot, persistência MySQL, hospedagem GCP.
**Reason:** Escolha explícita do usuário na inicialização do projeto.
**Trade-off:** Biblioteca de reconhecimento facial em Java tem opções mais limitadas que Python.
**Impact:** FaceRecognitionService com DJL no servidor.

### AD-005: Imagens em Cloud Storage / filesystem local (2026-05-25)

**Decision:** ImageStorageService abstrai local (dev) e GCS (prod); embeddings no MySQL.
**Reason:** BLOBs grandes no MySQL degradam performance; GCS é padrão GCP.
**Trade-off:** Dependência de bucket GCS em produção.
**Impact:** Campo `storage_key` em face_foto.

---

## Active Blockers

_Nenhum bloqueador ativo._

---

## Lessons Learned

_Nenhuma lição registrada ainda._

---

## Quick Tasks Completed

| #   | Description | Date | Commit | Status |
| --- | ----------- | ---- | ------ | ------ |
| —   | —           | —    | —      | —      |

---

## Deferred Ideas

- Multi-empresa / multi-tenant
- Integração com catraca física
- Anti-spoofing avançado

---

## Todos

- [ ] **Linear:** autenticar plugin MCP ou rodar `scripts/sync-linear-tasks.mjs`
- [ ] Executar cadastro-clientes-faces T5-T15 (T5–T6, T7 ✅, T8 ✅, T9 ✅, T11 ✅, T14 ✅)
- [ ] Executar entrada T7-T9 (T1–T6 ✅)

---

## Preferences

- Idioma de comunicação: português
