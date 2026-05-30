# Cadastro de Máquinas da Academia — Especificação

## Problem Statement

A academia precisa manter um inventário digital das máquinas e equipamentos disponíveis no salão (esteiras, leg press, bicicletas, etc.). Hoje não há registro centralizado — a equipe não sabe quantas máquinas existem, em que estado estão ou onde estão localizadas. Sem cadastro, manutenção e operação dependem de memória ou planilhas externas.

## Goals

- [x] Admin consegue cadastrar uma máquina com dados essenciais em menos de 1 minuto.
- [x] 100% das máquinas ativas aparecem na listagem com status e data de cadastro visíveis.
- [x] Apenas usuários autenticados acessam cadastro e listagem de máquinas.

## Out of Scope

| Feature | Motivo |
| ------- | ------ |
| QR code / etiqueta física na máquina | Pós-MVP; cadastro textual basta na v1 |
| Histórico de manutenção com ordens de serviço | Complexidade operacional além de listar/cadastrar |
| Reserva ou fila de uso da máquina | Fora do escopo desta feature |
| Integração com sensores IoT | Hardware não previsto no MVP |
| Multi-empresa / multi-tenant | Decisão AD-001 — pós-MVP |
| Exclusão física de registros | Soft delete via status INATIVA (mesmo padrão de clientes) |

---

## Domain Model (MVP)

| Campo | Tipo | Obrigatório | Regras |
| ----- | ---- | ----------- | ------ |
| `nome` | texto (120) | sim | Ex.: "Esteira 01", "Leg Press" |
| `tipo` | enum | sim | `CARDIO`, `MUSCULACAO`, `FUNCIONAL`, `OUTRO` |
| `marca` | texto (80) | não | Fabricante |
| `modelo` | texto (80) | não | Modelo do equipamento |
| `codigoPatrimonio` | texto (50) | não | Único quando informado |
| `localizacao` | texto (120) | não | Ex.: "Andar térreo — área cardio" |
| `status` | enum | sim | `ATIVA`, `MANUTENCAO`, `INATIVA` (default `ATIVA`) |
| `observacoes` | texto (500) | não | Notas livres |
| `createdAt` | timestamp | auto | Data do cadastro |

---

## User Stories

### P1: Listar máquinas cadastradas ⭐ MVP

**User Story**: Como administrador da academia, quero ver a lista de máquinas cadastradas para saber o inventário disponível e o status de cada equipamento.

**Why P1**: Confirmação visual do cadastro; ponto de partida para novos cadastros.

**Acceptance Criteria**:

1. WHEN o admin autenticado acessa a listagem THEN o sistema SHALL exibir nome, tipo, status, localização (se houver) e data de cadastro de cada máquina.
2. WHEN não há máquinas cadastradas THEN o sistema SHALL exibir estado vazio com ação para cadastrar a primeira máquina.
3. WHEN a listagem é carregada THEN o sistema SHALL ordenar máquinas por nome em ordem alfabética.

**Independent Test**: Após cadastrar 2 máquinas, listagem exibe ambas com dados corretos.

---

### P1: Cadastrar máquina ⭐ MVP

**User Story**: Como administrador, quero cadastrar uma máquina informando nome, tipo e demais dados para manter o inventário da academia atualizado.

**Why P1**: Núcleo da feature — sem cadastro não há inventário.

**Acceptance Criteria**:

1. WHEN o admin preenche nome e tipo válidos e submete THEN o sistema SHALL persistir a máquina com status `ATIVA` e redirecionar para listagem ou permitir novo cadastro.
2. WHEN o admin tenta salvar sem nome ou sem tipo THEN o sistema SHALL impedir o salvamento e exibir validação nos campos obrigatórios.
3. WHEN o admin informa código de patrimônio já cadastrado em outra máquina THEN o sistema SHALL rejeitar com mensagem de duplicidade.
4. WHEN o cadastro é concluído com sucesso THEN o sistema SHALL exibir confirmação e a máquina SHALL aparecer na listagem.

**Independent Test**: Login → Nova máquina → preencher nome/tipo → salvar → máquina aparece na listagem.

---

### P1: Proteger rotas de máquinas ⭐ MVP

**User Story**: Como administrador, quero que apenas usuários autenticados acessem o cadastro de máquinas.

**Why P1**: Mesmo padrão de segurança das demais telas admin.

**Acceptance Criteria**:

1. WHEN o admin acessa `/admin/maquinas` ou formulário sem sessão THEN o sistema SHALL redirecionar para login.
2. WHEN o admin autenticado navega para máquinas THEN o sistema SHALL exibir links no menu admin (listagem + novo).

**Independent Test**: Acessar `/admin/maquinas` sem login → redireciona para `/login`.

---

### P2: Editar máquina

**User Story**: Como administrador, quero editar dados de uma máquina para corrigir erros de cadastro ou atualizar localização e observações.

**Why P2**: Correções são frequentes; não bloqueiam o primeiro cadastro.

**Acceptance Criteria**:

1. WHEN o admin edita nome ou localização e salva THEN o sistema SHALL persistir as alterações.
2. WHEN o admin altera código de patrimônio para um já existente em outra máquina THEN o sistema SHALL rejeitar a alteração.
3. WHEN o admin abre edição THEN o sistema SHALL pré-preencher o formulário com os dados atuais.

**Independent Test**: Editar nome → salvar → listagem reflete alteração.

---

### P2: Alterar status da máquina

**User Story**: Como administrador, quero marcar uma máquina como em manutenção ou inativa para refletir a disponibilidade real no salão.

**Why P2**: Operação diária — equipamento quebrado ou desativado precisa constar no sistema.

**Acceptance Criteria**:

1. WHEN o admin altera status para `MANUTENCAO` ou `INATIVA` THEN o sistema SHALL persistir e exibir badge visual na listagem.
2. WHEN o admin reativa uma máquina inativa THEN o sistema SHALL marcar status como `ATIVA`.
3. WHEN uma máquina está inativa THEN ela SHALL permanecer visível na listagem com indicador visual.

**Independent Test**: Desativar máquina → badge muda na listagem.

---

### P3: Buscar máquina na listagem

**User Story**: Como administrador, quero buscar máquinas por nome, marca ou código de patrimônio para encontrar equipamentos rapidamente.

**Why P3**: Útil com inventário grande; não impede operação inicial.

**Acceptance Criteria**:

1. WHEN o admin digita no campo de busca THEN o sistema SHALL filtrar por correspondência parcial em nome, marca ou código de patrimônio.
2. WHEN nenhuma máquina corresponde THEN o sistema SHALL exibir mensagem de nenhum resultado.

**Independent Test**: Cadastrar 5 máquinas → buscar por parte do nome → apenas matches aparecem.

---

## Edge Cases

- WHEN nome excede 120 caracteres THEN o sistema SHALL validar e rejeitar entrada.
- WHEN código de patrimônio é informado vazio ou só espaços THEN o sistema SHALL tratar como não informado (null).
- WHEN a sessão expira durante cadastro THEN o sistema SHALL redirecionar para login e descartar dados não salvos.
- WHEN o admin tenta excluir uma máquina THEN o sistema SHALL **não** oferecer exclusão física na v1 (inativação apenas).

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| MAQ-01 | P1: Listar máquinas | Execute | Done |
| MAQ-02 | P1: Listar máquinas | Execute | Done |
| MAQ-03 | P1: Listar máquinas | Execute | Done |
| MAQ-04 | P1: Cadastrar máquina | Execute | Done |
| MAQ-05 | P1: Cadastrar máquina | Execute | Done |
| MAQ-06 | P1: Cadastrar máquina | Execute | Done |
| MAQ-07 | P1: Cadastrar máquina | Execute | Done |
| MAQ-08 | P1: Proteger rotas | Execute | Done |
| MAQ-09 | P1: Proteger rotas | Execute | Done |
| MAQ-10 | P2: Editar máquina | Execute | Done |
| MAQ-11 | P2: Editar máquina | Execute | Done |
| MAQ-12 | P2: Editar máquina | Execute | Done |
| MAQ-13 | P2: Alterar status | Execute | Done |
| MAQ-14 | P2: Alterar status | Execute | Done |
| MAQ-15 | P2: Alterar status | Execute | Done |
| MAQ-16 | P3: Buscar máquina | Execute | Done |
| MAQ-17 | P3: Buscar máquina | Execute | Done |

**Coverage:** 17 total, 17 mapeados para tasks, 0 unmapped ✅

---

## Success Criteria

- [x] Admin autenticado cadastra máquina com nome e tipo em ≤ 1 minuto.
- [x] Código de patrimônio duplicado é sempre rejeitado.
- [x] Máquina cadastrada aparece na listagem imediatamente após salvamento.
- [x] Telas de máquinas inacessíveis sem login autenticado.

---

## Assumptions (confirmar se necessário)

- Cadastro operado pelo **admin** (mesmo fluxo de clientes).
- **Sem foto** da máquina na v1.
- Status `MANUTENCAO` é informativo — não bloqueia uso em outras features (não há reserva de equipamento).
