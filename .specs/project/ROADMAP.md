# Roadmap

**Repositório:** [github.com/pedrobelmino/spring-react-reconhecimento-facial](https://github.com/pedrobelmino/spring-react-reconhecimento-facial)

**Milestone atual:** MVP P1 — Reconhecimento facial single-tenant  
**Status:** ✅ Implementado (UAT manual pendente)

---

## MVP P1 — Acesso facial na academia

**Objetivo:** Academia consegue cadastrar clientes e liberar entrada por reconhecimento facial via webcam.  
**Critério de conclusão:** Fluxo completo funcionando — cadastro, reconhecimento e registro de acesso.

### Features

**Platform Foundation** — ✅ DONE (FAC-10 … FAC-26)

- Spring Boot 3 + Java 21, Flyway, JPA, Security, CORS/CSRF
- React + Vite + Tailwind, API client, Vitest
- DJL + ONNX (detector + embedder), Docker Compose MySQL, Dockerfile

**Cadastro de clientes e faces** — ✅ DONE (FAC-27 … FAC-41)

- Login admin, CRUD clientes, captura webcam (2 fotos)
- Validação facial server-side, listagem e edição

**Tela de entrada (reconhecimento)** — ✅ DONE (FAC-42 … FAC-50)

- Fullscreen, loop de reconhecimento, feedback visual
- Cooldown 5 min, registro de eventos de acesso

### Pendências pós-implementação

- [ ] UAT manual — [`.specs/features/tela-entrada/UAT.md`](../features/tela-entrada/UAT.md)
- [ ] Modelos ONNX em ambiente de produção — `./scripts/download-face-models.sh`
- [ ] Deploy GCP (Cloud Run + Cloud SQL + GCS)

---

## Pós-MVP

**Objetivo:** Expandir operação e integrações após validação do MVP.

### Features

**Cadastro de máquinas** — ✅ DONE

**Acompanhamento nutricional** — ✅ DONE

**Multi-empresa (multi-tenant)** — PLANNED

- Isolamento de dados por academia
- Painel administrativo por tenant

**Integração com hardware** — PLANNED

- Sinal para catraca/torniquete via GPIO ou API

**Relatórios e auditoria** — PLANNED

- Dashboard de acessos por período
- Exportação de logs

---

## Considerações futuras

- App mobile para auto-cadastro de clientes
- Notificações (e-mail/push) em tentativas de acesso negado
- Anti-spoofing (detecção de foto/vídeo falso na câmera)
- Suporte offline com sincronização posterior
