# Tela de Entrada (Reconhecimento) — Tasks

**Design:** `.specs/features/tela-entrada/design.md`  
**Testing:** `.specs/codebase/TESTING.md`  
**Depends on:** platform-foundation (T1-T16), cadastro backend (T5, T6) para base facial  
**Status:** Draft

---

## Execution Plan

### Phase 1: Access Backend (Sequential)

```
foundation T15 → T1 → T2
```

### Phase 2: Access Frontend Core (Parallel after T2)

```
T2 complete, then:
  ├── T3 [P]  accessApi
  ├── T4 [P]  AccessFeedbackOverlay
  └── T5 [P]  CameraStatusIndicator
T3 + T4 + foundation T7 → T6
T5 + T6 → T7
```

### Phase 3: Integration (Sequential)

```
T7 → T8 (optional P3 sound)
T7 → T9 (smoke + UAT manual)
```

---

## Task Breakdown

### T1: AccessEventService

**What:** Cooldown 5 min, persistir `EventoAcesso`, regras LIBERADO/NEGADO.  
**Where:** `backend/.../service/AccessEventService.java`  
**Depends on:** foundation T4, T15  
**Reuses:** `EventoAcessoRepository`, config cooldown  
**Requirement:** ENT-12, ENT-13, ENT-14, ENT-15, ENT-16, ENT-17, ENT-18

**Done when:**

- [x] LIBERADO: max 1 evento/5min por cliente
- [x] NEGADO desconhecido: cooldown global 5 min
- [x] NEGADO inativo: sempre registra
- [x] Gate: `AccessEventServiceTest` → ≥8 tests pass

**Tests:** unit  
**Gate:** quick-backend

**Commit:** `feat(access): implement access event service with cooldown`

---

### T2: AccessController REST

**What:** `POST /api/access/recognize`, `GET /api/access/status`.  
**Where:** `backend/.../web/AccessController.java`  
**Depends on:** T1, foundation T15, foundation T9  
**Reuses:** `FaceRecognitionService`, DTOs  
**Requirement:** ENT-01..05, ENT-06..11, ENT-16..18

**Done when:**

- [x] Recognize retorna outcome, nome, fotoUrl, eventoRegistrado, faceCount
- [x] Cliente inativo → NEGADO + CLIENTE_INATIVO
- [x] Gate: `AccessControllerWebTest` → ≥8 tests pass

**Tests:** integration  
**Gate:** full-backend

**Commit:** `feat(access): add access recognition endpoints`

---

### T3: accessApi module [P]

**What:** `recognize(base64)`, `getStatus()`.  
**Where:** `frontend/src/api/accessApi.ts`, `frontend/src/types/access.ts`  
**Depends on:** T2, foundation T13  
**Reuses:** `api/client.ts`  
**Requirement:** ENT-01

**Done when:**

- [x] Types `RecognizeResponse` alinhados ao Java DTO
- [x] Gate: `accessApi.test.ts` → ≥3 tests pass

**Tests:** unit  
**Gate:** quick-frontend

**Commit:** `feat(frontend): add access api module`

---

### T4: AccessFeedbackOverlay component [P]

**What:** Overlay Tailwind fullscreen — liberado (verde) / negado (vermelho).  
**Where:** `frontend/src/components/AccessFeedbackOverlay.tsx`  
**Depends on:** foundation T11  
**Reuses:** tokens `access-granted`, `access-denied`  
**Requirement:** ENT-06, ENT-07, ENT-08, ENT-09, ENT-10, ENT-11

**Done when:**

- [x] 3 variantes: liberado, negado sem foto, negado inativo com foto
- [x] Gate: `AccessFeedbackOverlay.test.tsx` → ≥4 tests pass

**Tests:** unit  
**Gate:** quick-frontend

**Commit:** `feat(frontend): add access feedback overlay`

---

### T5: CameraStatusIndicator component [P]

**What:** Indicador online/offline da webcam.  
**Where:** `frontend/src/components/CameraStatusIndicator.tsx`  
**Depends on:** foundation T11  
**Reuses:** —  
**Requirement:** ENT-19, ENT-20

**Done when:**

- [x] Dot verde/cinza + mensagem erro
- [x] Gate: `CameraStatusIndicator.test.tsx` → ≥2 tests pass

**Tests:** unit  
**Gate:** quick-frontend

**Commit:** `feat(frontend): add camera status indicator`

---

### T6: useRecognitionLoop hook

**What:** Loop captura → API → feedback 3s → throttle 800ms.  
**Where:** `frontend/src/hooks/useRecognitionLoop.ts`  
**Depends on:** T3, T4, foundation T7  
**Reuses:** `useWebcam`, `accessApi`  
**Requirement:** ENT-01..05, ENT-12..15

**Done when:**

- [x] Pausa durante feedback
- [x] Ignora frames com faceCount > 1
- [x] Gate: `useRecognitionLoop.test.ts` → ≥6 tests pass

**Tests:** unit  
**Gate:** quick-frontend

**Commit:** `feat(frontend): add recognition loop hook`

---

### T7: EntradaPage

**What:** Página fullscreen `/entrada` — video, overlay, warnings, empty base banner.  
**Where:** `frontend/src/routes/EntradaPage.tsx`  
**Depends on:** T5, T6, foundation T12  
**Reuses:** `WebcamCapture`, `AccessFeedbackOverlay`, `CameraStatusIndicator`  
**Requirement:** ENT-01..11, ENT-19, ENT-20

**Done when:**

- [x] Layout fullscreen Tailwind
- [x] Banner base vazia se `operacional=false`
- [x] Gate: `EntradaPage.test.tsx` → ≥4 tests pass

**Tests:** unit  
**Gate:** quick-frontend

**Commit:** `feat(frontend): add entrada recognition page`

---

### T8: useAccessSound hook (P3)

**What:** Beeps Web Audio liberado/negado + toggle localStorage.  
**Where:** `frontend/src/hooks/useAccessSound.ts`  
**Depends on:** T7  
**Reuses:** —  
**Requirement:** ENT-21, ENT-22

**Done when:**

- [x] Sons distintos; disabled por default
- [x] Gate: `useAccessSound.test.ts` → ≥2 tests pass

**Tests:** unit  
**Gate:** quick-frontend

**Commit:** `feat(frontend): add access sound feedback hook`

---

### T9: Entrada integration smoke + UAT checklist

**What:** Rota `/entrada` no App; checklist UAT manual na spec.  
**Where:** `frontend/src/App.tsx`, `.specs/features/tela-entrada/UAT.md`  
**Depends on:** T7, cadastro T15 (cliente cadastrado para teste)  
**Reuses:** —  
**Requirement:** ENT-01..18 (P1)

**Done when:**

- [x] `/entrada` acessível sem login
- [x] UAT checklist: liberado, negado, cooldown 5min documentado
- [x] `npm run build` + `mvn verify` passam

**Tests:** none  
**Gate:** build + full-backend + full-frontend

**Commit:** `feat(entrada): wire entrada route and UAT checklist`

---

## Parallel Execution Map

```
foundation T15 → T1 → T2
T2 ──┬→ T3 [P]
     ├→ T4 [P]
     └→ T5 [P]
T3 + T4 + foundation T7 → T6
T5 + T6 → T7 → T8
T7 + cadastro T15 → T9
```

---

## Task Granularity Check

| Task | Scope | Status |
| ---- | ----- | ------ |
| T1 | 1 service | ✅ |
| T2 | 1 controller | ✅ |
| T6 | 1 hook | ✅ |
| T7 | 1 page | ✅ |

---

## Diagram-Definition Cross-Check

| Task | Depends On | Diagram | Status |
| ---- | ---------- | ------- | ------ |
| T1 | foundation T4, T15 | T15→T1 | ✅ |
| T2 | T1, foundation T9 | T1→T2 | ✅ |
| T6 | T3, T4, foundation T7 | T3+T4+T7→T6 | ✅ |
| T9 | T7, cadastro T15 | T7→T9 | ✅ |

---

## Test Co-location Validation

| Task | Layer | Matrix | Task Says | Status |
| ---- | ----- | ------ | --------- | ------ |
| T1 | Service | unit | unit | ✅ |
| T2 | Controller | integration | integration | ✅ |
| T3 | API module | unit | unit | ✅ |
| T4 | Component | unit | unit | ✅ |
| T6 | Hook | unit | unit | ✅ |
| T7 | Page | unit | unit | ✅ |

---

## Requirement Traceability

| ID | Task(s) |
| -- | ------- |
| ENT-01..05 | T2, T3, T6, T7 |
| ENT-06..08 | T2, T4, T6, T7 |
| ENT-09..11 | T2, T4, T6, T7 |
| ENT-12..15 | T1, T2, T6 |
| ENT-16..18 | T1, T2 |
| ENT-19..20 | T5, T7 |
| ENT-21..22 | T8 |

**Coverage:** 22 requirements → 9 tasks, 0 unmapped ✅

---

## Ordem de execução recomendada (MVP completo)

```
1. platform-foundation T1-T16
2. cadastro T1-T15
3. entrada T1-T9
```

Entrada T1-T2 pode iniciar em paralelo com cadastro frontend (T7-T14) após foundation T15.

---

## MCPs e Skills (pré-execução)

| Task | MCPs | Skills |
| ---- | ---- | ------ |
| T9 UAT manual | cursor-ide-browser | validate.md |
| T2 recognize tests | — | — |

**Confirme:** Quais MCPs/skills usar por task antes de iniciar Execute?
