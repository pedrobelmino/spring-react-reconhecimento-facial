# Tela de Entrada (Reconhecimento) — Especificação

## Problem Statement

Clientes da academia precisam entrar sem cartão ou check-in manual. A recepção ou portaria usa uma tela dedicada com webcam que identifica quem está na frente da câmera e informa se o acesso foi liberado ou negado, usando as faces cadastradas pelo admin.

## Goals

- [ ] Reconhecer clientes cadastrados e exibir resultado (liberado/negado) em ≤ 2 segundos por tentativa.
- [ ] Registrar no máximo 1 evento de acesso por cliente a cada 5 minutos.
- [ ] Taxa de reconhecimento ≥ 95% em condições normais (iluminação adequada, rosto frontal, uma pessoa na câmera).

## Out of Scope

| Feature | Motivo |
| ------- | ------ |
| Integração com catraca/torniquete | Apenas feedback visual na v1 (PROJECT.md) |
| Reconhecimento com máscara | Fora do escopo do MVP |
| Múltiplas pessoas simultâneas na câmera | Fora do escopo; sistema exige uma pessoa por vez |
| Login na tela de entrada | Tela pública de uso contínuo na portaria |
| Relatórios/dashboard de acessos | Pós-MVP |
| Anti-spoofing (foto de foto) | Consideração futura |

---

## User Stories

### P1: Captura contínua e reconhecimento facial ⭐ MVP

**User Story**: Como operador da portaria, quero uma tela fullscreen com preview da webcam que reconheça automaticamente clientes cadastrados para liberar a entrada sem interação manual.

**Why P1**: É a funcionalidade central — identificar quem está na câmera em tempo real.

**Acceptance Criteria**:

1. WHEN a tela de entrada é aberta THEN o sistema SHALL solicitar permissão da webcam e exibir preview em tela cheia.
2. WHEN um rosto é detectado no frame THEN o sistema SHALL comparar contra descritores faciais de clientes ativos cadastrados.
3. WHEN o match atinge o limiar de confiança configurado THEN o sistema SHALL identificar o cliente correspondente.
4. WHEN nenhum match atinge o limiar THEN o sistema SHALL tratar como rosto não reconhecido.
5. WHEN mais de um rosto é detectado simultaneamente THEN o sistema SHALL ignorar o frame e exibir orientação para posicionar apenas uma pessoa.

**Independent Test**: Abrir tela → posicionar cliente cadastrado → sistema identifica em ≤ 2 s.

---

### P1: Feedback visual de acesso liberado ⭐ MVP

**User Story**: Como cliente da academia, quero ver minha foto cadastrada e a mensagem "Acesso liberado" quando sou reconhecido para ter confirmação clara de entrada.

**Why P1**: Feedback visual é o substituto da catraca no MVP — deve ser inequívoco.

**Acceptance Criteria**:

1. WHEN um cliente **ativo** é reconhecido com sucesso THEN o sistema SHALL exibir a foto cadastrada do cliente, o nome e a frase **"Acesso liberado"** em destaque visual positivo (ex.: verde).
2. WHEN o feedback de acesso liberado é exibido THEN o sistema SHALL mantê-lo visível por no mínimo 3 segundos antes de retomar captura contínua.
3. WHEN o cliente reconhecido possui 2 fotos cadastradas THEN o sistema SHALL exibir uma delas (a associada ao descritor que fez match).

**Independent Test**: Cliente ativo cadastrado → olha para câmera → foto + nome + "Acesso liberado" aparecem.

---

### P1: Feedback visual de acesso negado ⭐ MVP

**User Story**: Como operador da portaria, quero que rostos não cadastrados ou clientes inativos vejam claramente "Acesso negado" para saber que a entrada não foi autorizada.

**Why P1**: Segurança operacional — negação deve ser tão clara quanto a liberação.

**Acceptance Criteria**:

1. WHEN um rosto não corresponde a nenhum cliente cadastrado THEN o sistema SHALL exibir a frase **"Acesso negado"** em destaque visual negativo (ex.: vermelho), sem foto de cliente.
2. WHEN um cliente **inativo** é reconhecido THEN o sistema SHALL exibir a foto cadastrada, o nome e a frase **"Acesso negado"**.
3. WHEN o feedback de acesso negado é exibido THEN o sistema SHALL mantê-lo visível por no mínimo 3 segundos antes de retomar captura contínua.

**Independent Test**: Pessoa não cadastrada → "Acesso negado". Cliente inativo cadastrado → foto + nome + "Acesso negado".

---

### P1: Cooldown de 5 minutos entre acessos ⭐ MVP

**User Story**: Como administrador, quero que o mesmo cliente gere no máximo 1 registro de acesso a cada 5 minutos para evitar duplicatas enquanto permanece na frente da câmera.

**Why P1**: Requisito explícito do usuário; evita poluir log e re-triggers visuais.

**Acceptance Criteria**:

1. WHEN um cliente ativo é reconhecido e não houve evento de acesso **liberado** nos últimos 5 minutos para esse cliente THEN o sistema SHALL registrar evento de acesso com resultado `LIBERADO` e exibir feedback de acesso liberado.
2. WHEN um cliente ativo é reconhecido dentro de 5 minutos após último acesso liberado THEN o sistema SHALL exibir feedback de acesso liberado **sem** registrar novo evento.
3. WHEN um acesso negado ocorre THEN o sistema SHALL registrar evento com resultado `NEGADO` independentemente do cooldown (cada negação é registrada).
4. WHEN múltiplas negações ocorrem em sequência para o mesmo rosto desconhecido THEN o sistema SHALL aplicar cooldown de 5 minutos também para eventos `NEGADO` do mesmo tipo (rosto não identificado) para evitar spam no log.

**Independent Test**: Cliente reconhecido → acesso liberado registrado. Mesmo cliente em 2 min → feedback liberado mas sem novo registro. Após 5 min → novo registro.

---

### P1: Registro de eventos de acesso ⭐ MVP

**User Story**: Como administrador, quero que cada tentativa relevante de acesso seja registrada com horário e resultado para auditoria básica.

**Why P1**: PROJECT.md inclui registro de eventos; necessário para validar cooldown e operação.

**Acceptance Criteria**:

1. WHEN um acesso liberado é registrado THEN o sistema SHALL persistir: `cliente_id`, `timestamp`, `resultado=LIBERADO`.
2. WHEN um acesso negado é registrado (rosto desconhecido ou cliente inativo) THEN o sistema SHALL persistir: `cliente_id` (nullable se desconhecido), `timestamp`, `resultado=NEGADO`, `motivo` (ex.: `NAO_RECONHECIDO`, `CLIENTE_INATIVO`).
3. WHEN um evento é registrado THEN o sistema SHALL usar timestamp do servidor (UTC), não do cliente.

**Independent Test**: Após 3 tentativas (1 liberado, 1 negado desconhecido, 1 inativo), consultar API/banco → 3 eventos com dados corretos.

---

### P2: Indicador de status da câmera

**User Story**: Como operador, quero ver claramente se a webcam está funcionando ou com erro para saber quando reiniciar a tela.

**Why P2**: Melhora operação; não bloqueia reconhecimento básico.

**Acceptance Criteria**:

1. WHEN a webcam está ativa e capturando THEN o sistema SHALL exibir indicador discreto de câmera online.
2. WHEN a webcam perde conexão ou permissão THEN o sistema SHALL exibir alerta visível com instrução para recarregar ou reconectar.

**Independent Test**: Desconectar webcam → alerta aparece. Reconectar → preview retoma.

---

### P3: Som de feedback

**User Story**: Como operador, quero um som distinto para acesso liberado e negado para perceber o resultado sem olhar constantemente para a tela.

**Why P3**: Melhora UX em ambiente ruidoso; opcional na v1.

**Acceptance Criteria**:

1. WHEN acesso liberado é exibido THEN o sistema SHALL reproduzir som de sucesso (se áudio habilitado nas configurações).
2. WHEN acesso negado é exibido THEN o sistema SHALL reproduzir som de negação distinto do sucesso.

**Independent Test**: Habilitar som → liberado toca um tom, negado toca outro.

---

## Edge Cases

- WHEN a webcam não está disponível THEN o sistema SHALL exibir tela de erro com instruções, sem tentar reconhecimento.
- WHEN nenhum cliente ativo possui descritores faciais THEN o sistema SHALL exibir aviso de base vazia e negar todos os acessos.
- WHEN iluminação impede detecção facial THEN o sistema SHALL permanecer em estado de aguardo sem registrar eventos.
- WHEN o limiar de confiança não é atingido mas há match parcial THEN o sistema SHALL tratar como não reconhecido (acesso negado).
- WHEN a tela de entrada é aberta em múltiplas abas/dispositivos THEN cada instância SHALL operar independentemente (sem sincronização entre abas na v1).

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| ENT-01 | P1: Captura e reconhecimento | Tasks | Pending |
| ENT-02 | P1: Captura e reconhecimento | Tasks | Pending |
| ENT-03 | P1: Captura e reconhecimento | Tasks | Pending |
| ENT-04 | P1: Captura e reconhecimento | Tasks | Pending |
| ENT-05 | P1: Captura e reconhecimento | Tasks | Pending |
| ENT-06 | P1: Feedback liberado | Tasks | Pending |
| ENT-07 | P1: Feedback liberado | Tasks | Pending |
| ENT-08 | P1: Feedback liberado | Tasks | Pending |
| ENT-09 | P1: Feedback negado | Tasks | Pending |
| ENT-10 | P1: Feedback negado | Tasks | Pending |
| ENT-11 | P1: Feedback negado | Tasks | Pending |
| ENT-12 | P1: Cooldown 5 min | Tasks | Pending |
| ENT-13 | P1: Cooldown 5 min | Tasks | Pending |
| ENT-14 | P1: Cooldown 5 min | Tasks | Pending |
| ENT-15 | P1: Cooldown 5 min | Tasks | Pending |
| ENT-16 | P1: Registro de eventos | Tasks | Pending |
| ENT-17 | P1: Registro de eventos | Tasks | Pending |
| ENT-18 | P1: Registro de eventos | Tasks | Pending |
| ENT-19 | P2: Status da câmera | Tasks | Pending |
| ENT-20 | P2: Status da câmera | Tasks | Pending |
| ENT-21 | P3: Som de feedback | Tasks | Pending |
| ENT-22 | P3: Som de feedback | Tasks | Pending |

**Coverage:** 22 total, 0 mapeados para tasks, 22 unmapped ⚠️

---

## Success Criteria

- [ ] Cliente ativo cadastrado é reconhecido e vê foto + "Acesso liberado" em ≤ 2 s.
- [ ] Rosto desconhecido recebe "Acesso negado" sem foto de cliente.
- [ ] Cliente inativo reconhecido recebe foto + nome + "Acesso negado".
- [ ] Mesmo cliente ativo não gera mais de 1 evento `LIBERADO` a cada 5 minutos.
- [ ] Eventos de acesso persistidos com timestamp e resultado corretos.
