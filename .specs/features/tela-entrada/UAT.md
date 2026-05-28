# Tela de Entrada — UAT Manual

**Feature:** tela-entrada  
**Spec:** `.specs/features/tela-entrada/spec.md`  
**Rota:** `http://localhost:5173/entrada` (dev) ou `/entrada` (build embarcado)

---

## Pré-requisitos

1. **Infra:** MySQL via `docker compose up -d`; backend (`SPRING_PROFILES_ACTIVE=dev mvn spring-boot:run`) e frontend (`cd frontend && npm run dev`) em execução.
2. **Webcam:** Navegador com permissão de câmera concedida.
3. **Cliente cadastrado para teste:** Concluir o fluxo de **cadastro-clientes-faces T15** (login admin → cadastrar cliente ativo com 2 fotos via webcam). Sem isso, cenários de acesso liberado e cliente inativo não são testáveis.
4. **Opcional — cliente inativo:** Editar um cliente no admin e alterar status para `INATIVO` (ou cadastrar segundo cliente e inativá-lo) para o cenário de negação com foto.

---

## Smoke: rota pública

| # | Passos | Resultado esperado | OK? |
| - | ------ | ------------------ | --- |
| S1 | Abrir `/entrada` **sem** estar logado no admin | Página fullscreen com preview da webcam; **não** redireciona para `/login` | ☐ |
| S2 | Conferir `frontend/src/App.tsx` | Rota `/entrada` **fora** de `<ProtectedRoute />` | ☐ |
| S3 | Abrir DevTools → Network → `GET /api/access/status` | Resposta 200 com `operacional` e `clientesAtivosComFaces` | ☐ |

---

## Cenários funcionais (P1)

### 1. Acesso liberado

| # | Passos | Resultado esperado | OK? |
| - | ------ | ------------------ | --- |
| L1 | Posicionar **cliente ativo cadastrado** (T15) sozinho na câmera, rosto frontal, boa iluminação | Em ≤ 2 s: overlay verde, foto cadastrada, nome e texto **"Acesso liberado"** | ☐ |
| L2 | Aguardar ≥ 3 s após o overlay | Feedback some; captura contínua retoma (novo preview ativo) | ☐ |
| L3 | Inspecionar resposta `POST /api/access/recognize` (primeira liberação) | `outcome=LIBERADO`, `eventoRegistrado=true` | ☐ |

### 2. Acesso negado — rosto desconhecido

| # | Passos | Resultado esperado | OK? |
| - | ------ | ------------------ | --- |
| N1 | Posicionar pessoa **não cadastrada** na câmera | Overlay vermelho, **sem** foto de cliente, texto **"Acesso negado"** | ☐ |
| N2 | Aguardar ≥ 3 s | Feedback some; captura retoma | ☐ |
| N3 | Conferir API | `outcome=NEGADO`, `motivo=NAO_RECONHECIDO`, `fotoUrl` ausente/null | ☐ |

### 3. Acesso negado — cliente inativo

| # | Passos | Resultado esperado | OK? |
| - | ------ | ------------------ | --- |
| I1 | Posicionar **cliente inativo** reconhecível (cadastrado, depois inativado no admin) | Overlay vermelho com **foto + nome** e **"Acesso negado"** | ☐ |
| I2 | Conferir API | `outcome=NEGADO`, `motivo=CLIENTE_INATIVO`, `eventoRegistrado=true` | ☐ |

### 4. Cooldown 5 minutos

| # | Passos | Resultado esperado | OK? |
| - | ------ | ------------------ | --- |
| C1 | Cliente ativo: obter **primeiro** acesso liberado (L1) | `eventoRegistrado=true`; registro em `evento_acesso` com `resultado=LIBERADO` | ☐ |
| C2 | **Mesmo cliente**, permanecer na câmera dentro de 5 min | Overlay **"Acesso liberado"** ainda aparece, mas `eventoRegistrado=false` (sem novo registro no log) | ☐ |
| C3 | Aguardar 5 min (ou ajustar `face.access.cooldown-minutes` em dev) e reconhecer de novo | Novo evento `LIBERADO` registrado (`eventoRegistrado=true`) | ☐ |
| C4 | Rosto desconhecido: repetir negações em sequência | Após 1ª negação registrada, negações seguintes em < 5 min podem suprimir registro (cooldown global desconhecido); feedback visual de negado continua | ☐ |

**Verificação do log:** consultar tabela `evento_acesso` ou contar linhas antes/depois de cada tentativa.

### 5. Múltiplas faces (multi-face warning)

| # | Passos | Resultado esperado | OK? |
| - | ------ | ------------------ | --- |
| M1 | Posicionar **duas pessoas** simultaneamente na câmera | Banner amarelo: **"Posicione apenas uma pessoa na frente da câmera"**; **sem** overlay de liberado/negado | ☐ |
| M2 | Remover uma pessoa, ficar só uma | Banner some; reconhecimento normal retoma | ☐ |

### 6. Base vazia

| # | Passos | Resultado esperado | OK? |
| - | ------ | ------------------ | --- |
| B1 | Garantir **zero** clientes ativos com faces (ex.: inativar todos ou banco limpo) e recarregar `/entrada` | Banner: **"Nenhum cliente cadastrado com face ativa..."**; `GET /api/access/status` → `operacional=false` | ☐ |
| B2 | Tentar reconhecer qualquer rosto | Apenas **"Acesso negado"** (sem match na base) | ☐ |
| B3 | Restaurar cliente ativo (T15) e recarregar | Banner some; `operacional=true` | ☐ |

---

## Indicadores auxiliares (P2)

| # | Passos | Resultado esperado | OK? |
| - | ------ | ------------------ | --- |
| A1 | Webcam funcionando | Indicador discreto de câmera online (dot verde) | ☐ |
| A2 | Revogar permissão da câmera ou desconectar webcam | Alerta visível + botão **"Tentar novamente"** | ☐ |

---

## Registro de execução

| Campo | Valor |
| ----- | ----- |
| Data | |
| Executor | |
| Ambiente | dev / staging / prod |
| Build frontend | `npm run build` ✅ / ❌ |
| Gate backend | `mvn verify` ✅ / ❌ |
| Resultado geral | ✅ Aprovado / ⚠️ Com ressalvas / ❌ Reprovado |
| Observações | |

---

## Referência de requisitos

| Cenário | IDs |
| ------- | --- |
| Liberado | ENT-01..08, ENT-12, ENT-16 |
| Negado | ENT-09..11, ENT-15..18 |
| Cooldown | ENT-12..15 |
| Multi-face | ENT-05 |
| Base vazia | spec edge case |
| Câmera | ENT-19, ENT-20 |
