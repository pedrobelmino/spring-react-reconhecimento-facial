# Acompanhamento Nutricional — Especificação

## Problem Statement

A academia oferece (ou planeja oferecer) acompanhamento nutricional aos clientes, mas não há registro digital das consultas e evoluções. Sem cadastro estruturado, nutricionistas e recepção não conseguem consultar histórico, peso registrado ou orientações passadas em atendimentos anteriores.

## Goals

- [x] Admin/nutricionista consegue registrar um acompanhamento vinculado a um cliente em menos de 2 minutos.
- [x] 100% dos acompanhamentos aparecem na listagem com cliente, data e resumo visíveis.
- [x] Apenas usuários autenticados acessam cadastro e listagem de acompanhamentos.

## Out of Scope

| Feature | Motivo |
| ------- | ------ |
| Portal do cliente (auto-consulta) | Fora do MVP; cadastro operado pelo admin |
| Gráficos de evolução de peso / % gordura | Relatório analítico — pós-MVP |
| Anexo de exames de sangue ou PDFs | Upload de arquivos não previsto na v1 |
| Prescrição de dieta com macros calculados | Complexidade clínica além de registro textual |
| Agendamento / calendário de consultas | Integração separada; v1 registra data da consulta apenas |
| Multi-empresa / multi-tenant | Decisão AD-001 — pós-MVP |
| Exclusão física de registros | Soft delete via status INATIVO |

---

## Domain Model (MVP)

| Campo | Tipo | Obrigatório | Regras |
| ----- | ---- | ----------- | ------ |
| `clienteId` | FK → cliente | sim | Cliente deve existir e estar cadastrado |
| `dataConsulta` | date | sim | Não pode ser futura |
| `pesoKg` | decimal (5,2) | não | Entre 20 e 500 kg quando informado |
| `profissional` | texto (120) | não | Nome do nutricionista responsável |
| `objetivo` | texto (200) | não | Ex.: "Hipertrofia", "Emagrecimento" |
| `orientacoes` | texto (2000) | não | Plano alimentar, observações da consulta |
| `proximaConsulta` | date | não | Pode ser futura; opcional |
| `status` | enum | sim | `ATIVO`, `INATIVO` (default `ATIVO`) |
| `createdAt` | timestamp | auto | Data do registro no sistema |

---

## User Stories

### P1: Listar acompanhamentos nutricionais ⭐ MVP

**User Story**: Como administrador ou nutricionista, quero ver a lista de acompanhamentos registrados para consultar histórico de atendimentos dos clientes.

**Why P1**: Confirmação visual do cadastro; visão operacional do serviço.

**Acceptance Criteria**:

1. WHEN o admin autenticado acessa a listagem THEN o sistema SHALL exibir nome do cliente, data da consulta, peso (se houver), profissional (se houver) e status de cada acompanhamento.
2. WHEN não há acompanhamentos cadastrados THEN o sistema SHALL exibir estado vazio com ação para registrar o primeiro.
3. WHEN a listagem é carregada THEN o sistema SHALL ordenar por data da consulta decrescente (mais recente primeiro).

**Independent Test**: Após cadastrar 2 acompanhamentos, listagem exibe ambos com dados corretos.

---

### P1: Cadastrar acompanhamento nutricional ⭐ MVP

**User Story**: Como administrador, quero registrar um acompanhamento nutricional vinculado a um cliente informando data, peso e orientações para manter o histórico de consultas.

**Why P1**: Núcleo da feature — sem registro não há acompanhamento digital.

**Acceptance Criteria**:

1. WHEN o admin seleciona cliente válido, informa data da consulta e submete THEN o sistema SHALL persistir o acompanhamento com status `ATIVO`.
2. WHEN o admin tenta salvar sem cliente ou sem data da consulta THEN o sistema SHALL impedir o salvamento e exibir validação.
3. WHEN o admin informa data da consulta futura THEN o sistema SHALL rejeitar com mensagem de validação.
4. WHEN o admin informa peso fora do intervalo 20–500 kg THEN o sistema SHALL rejeitar com mensagem de validação.
5. WHEN o cadastro é concluído com sucesso THEN o sistema SHALL exibir confirmação e o registro SHALL aparecer na listagem.

**Independent Test**: Login → Novo acompanhamento → selecionar cliente → data + peso → salvar → aparece na listagem.

---

### P1: Proteger rotas de acompanhamento ⭐ MVP

**User Story**: Como administrador, quero que apenas usuários autenticados acessem o cadastro de acompanhamentos nutricionais.

**Why P1**: Dados de saúde exigem acesso restrito.

**Acceptance Criteria**:

1. WHEN o admin acessa `/admin/acompanhamentos` ou formulário sem sessão THEN o sistema SHALL redirecionar para login.
2. WHEN o admin autenticado navega para acompanhamentos THEN o sistema SHALL exibir links no menu admin.

**Independent Test**: Acessar rota sem login → redireciona para `/login`.

---

### P2: Editar acompanhamento

**User Story**: Como administrador, quero editar um acompanhamento para corrigir peso, orientações ou data registrada incorretamente.

**Why P2**: Correções são frequentes em registros clínicos.

**Acceptance Criteria**:

1. WHEN o admin edita orientações ou peso e salva THEN o sistema SHALL persistir as alterações.
2. WHEN o admin altera data da consulta para data futura THEN o sistema SHALL rejeitar.
3. WHEN o admin abre edição THEN o sistema SHALL pré-preencher o formulário; cliente SHALL ser editável ou fixo conforme decisão de design (default: fixo após criação).

**Independent Test**: Editar peso → salvar → listagem reflete alteração.

---

### P2: Inativar acompanhamento

**User Story**: Como administrador, quero inativar um registro de acompanhamento incorreto ou duplicado sem apagar o histórico.

**Why P2**: Auditoria — exclusão física não é desejável.

**Acceptance Criteria**:

1. WHEN o admin inativa um acompanhamento THEN o sistema SHALL marcar status como `INATIVO` e persistir.
2. WHEN o admin reativa THEN o sistema SHALL marcar como `ATIVO`.
3. WHEN inativo THEN o registro SHALL permanecer visível na listagem com indicador visual (default) ou oculto com filtro "mostrar inativos" (decisão em design).

**Independent Test**: Inativar registro → status muda na listagem.

---

### P3: Filtrar acompanhamentos por cliente

**User Story**: Como nutricionista, quero filtrar acompanhamentos por cliente para ver todo o histórico nutricional de uma pessoa.

**Why P3**: Essencial com base grande; complementa busca textual.

**Acceptance Criteria**:

1. WHEN o admin seleciona um cliente no filtro THEN o sistema SHALL exibir apenas acompanhamentos daquele cliente, ordenados por data decrescente.
2. WHEN o filtro é limpo THEN o sistema SHALL exibir todos os acompanhamentos ativos.

**Independent Test**: Cadastrar 3 acompanhamentos para 2 clientes → filtrar por cliente A → apenas registros de A.

---

### P3: Buscar na listagem

**User Story**: Como administrador, quero buscar acompanhamentos por nome do cliente ou profissional para localizar registros rapidamente.

**Why P3**: Atalho operacional em bases grandes.

**Acceptance Criteria**:

1. WHEN o admin digita no campo de busca THEN o sistema SHALL filtrar por correspondência parcial em nome do cliente ou profissional.
2. WHEN nenhum registro corresponde THEN o sistema SHALL exibir mensagem de nenhum resultado.

**Independent Test**: Buscar por parte do nome do cliente → apenas matches aparecem.

---

## Edge Cases

- WHEN o cliente vinculado está inativo THEN o sistema SHALL permitir novo acompanhamento (cliente inativo ainda pode ter histórico nutricional).
- WHEN orientações excedem 2000 caracteres THEN o sistema SHALL validar e rejeitar.
- WHEN a sessão expira durante cadastro THEN o sistema SHALL redirecionar para login e descartar dados não salvos.
- WHEN `proximaConsulta` é anterior à `dataConsulta` THEN o sistema SHALL rejeitar com validação.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| NUT-01 | P1: Listar acompanhamentos | Execute | Done |
| NUT-02 | P1: Listar acompanhamentos | Execute | Done |
| NUT-03 | P1: Listar acompanhamentos | Execute | Done |
| NUT-04 | P1: Cadastrar acompanhamento | Execute | Done |
| NUT-05 | P1: Cadastrar acompanhamento | Execute | Done |
| NUT-06 | P1: Cadastrar acompanhamento | Execute | Done |
| NUT-07 | P1: Cadastrar acompanhamento | Execute | Done |
| NUT-08 | P1: Cadastrar acompanhamento | Execute | Done |
| NUT-09 | P1: Proteger rotas | Execute | Done |
| NUT-10 | P1: Proteger rotas | Execute | Done |
| NUT-11 | P2: Editar acompanhamento | Execute | Done |
| NUT-12 | P2: Editar acompanhamento | Execute | Done |
| NUT-13 | P2: Editar acompanhamento | Execute | Done |
| NUT-14 | P2: Inativar acompanhamento | Execute | Done |
| NUT-15 | P2: Inativar acompanhamento | Execute | Done |
| NUT-16 | P2: Inativar acompanhamento | Execute | Done |
| NUT-17 | P3: Filtrar por cliente | Execute | Done |
| NUT-18 | P3: Filtrar por cliente | Execute | Done |
| NUT-19 | P3: Buscar na listagem | Execute | Done |
| NUT-20 | P3: Buscar na listagem | Execute | Done |

**Coverage:** 20 total, 20 mapeados para tasks, 0 unmapped ✅

---

## Success Criteria

- [x] Admin autenticado registra acompanhamento com cliente e data em ≤ 2 minutos.
- [x] Data futura de consulta é sempre rejeitada.
- [x] Acompanhamento cadastrado aparece na listagem imediatamente após salvamento.
- [x] Telas inacessíveis sem login autenticado.

---

## Assumptions (confirmar se necessário)

- Mesmo **login admin** de clientes/máquinas (sem perfil nutricionista separado na v1).
- Acompanhamento **sempre vinculado a um cliente** já cadastrado.
- **Sem upload** de documentos ou fotos na v1.
- Cliente **não editável** após criação do acompanhamento (evita inconsistência de histórico).
