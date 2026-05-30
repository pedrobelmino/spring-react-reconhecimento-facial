# Cadastro de Clientes e Faces — Especificação

## Problem Statement

A academia precisa registrar clientes e suas faces antes que o reconhecimento na entrada funcione. Hoje não há fluxo digital para isso. Sem cadastro autenticado e confiável (nome, CPF, duas fotos via webcam), a tela de entrada não tem base para comparar rostos.

## Goals

- [x] Admin consegue cadastrar um cliente completo (dados + 2 fotos) em menos de 3 minutos.
- [x] 100% dos clientes ativos possuem exatamente 2 descritores faciais válidos armazenados antes de serem elegíveis para reconhecimento na entrada.
- [x] Apenas usuários autenticados acessam as telas de cadastro e gestão.

## Out of Scope

| Feature | Motivo |
| ------- | ------ |
| Upload de arquivo de imagem | MVP usa somente captura via webcam |
| Auto-cadastro pelo cliente | Fora do MVP; cadastro é operado pelo admin |
| Multi-empresa / multi-tenant | Decisão AD-001 — pós-MVP |
| Recuperação de senha por e-mail | Complexidade desnecessária na v1 |
| Múltiplas faces por CPF (família) | Um cadastro = um cliente = um CPF |

---

## User Stories

### P1: Login do administrador ⭐ MVP

**User Story**: Como administrador da academia, quero fazer login com usuário e senha para acessar o sistema de cadastro com segurança.

**Why P1**: Sem autenticação, qualquer pessoa na rede poderia cadastrar ou alterar clientes.

**Acceptance Criteria**:

1. WHEN o admin acessa a rota de cadastro sem sessão autenticada THEN o sistema SHALL redirecionar para a tela de login.
2. WHEN credenciais válidas são submetidas THEN o sistema SHALL criar sessão autenticada e redirecionar para a listagem de clientes.
3. WHEN credenciais inválidas são submetidas THEN o sistema SHALL exibir mensagem de erro genérica sem revelar qual campo está incorreto.
4. WHEN o admin clica em logout THEN o sistema SHALL encerrar a sessão e redirecionar para login.

**Independent Test**: Acessar `/cadastro` sem login → redireciona. Login correto → entra. Logout → volta ao login.

---

### P1: Cadastrar cliente com duas fotos via webcam ⭐ MVP

**User Story**: Como administrador, quero cadastrar um cliente informando nome e CPF e capturar duas fotos pela webcam para que ele possa ser reconhecido na entrada.

**Why P1**: É o núcleo da feature — sem isso não há base facial para reconhecimento.

**Acceptance Criteria**:

1. WHEN o admin preenche nome, CPF válido e captura 2 fotos com rosto detectado THEN o sistema SHALL persistir o cliente, as imagens e os descritores faciais associados.
2. WHEN o admin tenta salvar com CPF já cadastrado THEN o sistema SHALL rejeitar com mensagem informando duplicidade.
3. WHEN o admin tenta salvar sem capturar exatamente 2 fotos válidas THEN o sistema SHALL impedir o salvamento e indicar quantas fotos faltam ou são inválidas.
4. WHEN uma foto é capturada sem rosto detectável THEN o sistema SHALL rejeitar a captura e permitir nova tentativa sem descartar a foto válida já capturada.
5. WHEN o cadastro é concluído com sucesso THEN o sistema SHALL exibir confirmação e redirecionar para a listagem ou permitir novo cadastro.

**Independent Test**: Login → Novo cliente → preencher nome/CPF → capturar 2 fotos → salvar → cliente aparece na listagem com status ativo.

---

### P1: Listar clientes cadastrados ⭐ MVP

**User Story**: Como administrador, quero ver a lista de clientes cadastrados para consultar quem já está na base.

**Why P1**: Confirmação visual de que o cadastro funcionou; ponto de partida para edição.

**Acceptance Criteria**:

1. WHEN o admin autenticado acessa a listagem THEN o sistema SHALL exibir nome, CPF (parcialmente mascarado), status (ativo/inativo) e data do cadastro de cada cliente.
2. WHEN não há clientes cadastrados THEN o sistema SHALL exibir estado vazio com ação para cadastrar o primeiro cliente.
3. WHEN a listagem é carregada THEN o sistema SHALL ordenar clientes por nome em ordem alfabética.

**Independent Test**: Após cadastrar 2 clientes, listagem exibe ambos com dados corretos.

---

### P2: Editar dados e recapturar fotos

**User Story**: Como administrador, quero editar nome, CPF ou recapturar as fotos de um cliente para corrigir erros de cadastro.

**Why P2**: Correções são frequentes na operação; não bloqueiam o primeiro cadastro, mas são essenciais antes de ir para produção.

**Acceptance Criteria**:

1. WHEN o admin edita o nome de um cliente e salva THEN o sistema SHALL persistir o novo nome.
2. WHEN o admin altera o CPF para um já existente em outro cliente THEN o sistema SHALL rejeitar a alteração.
3. WHEN o admin recaptura uma ou ambas as fotos THEN o sistema SHALL substituir imagens e descritores anteriores pelos novos após validação facial.
4. WHEN fotos são recapturadas THEN o sistema SHALL exigir novamente exatamente 2 fotos válidas antes de salvar.

**Independent Test**: Editar nome de cliente existente → salvar → listagem reflete alteração. Recapturar 2 fotos → reconhecimento na entrada usa nova face.

---

### P2: Ativar e desativar cliente

**User Story**: Como administrador, quero desativar um cliente para que ele deixe de ter acesso liberado na entrada sem excluir seu histórico.

**Why P2**: Academias pausam/cancelam matrículas com frequência; exclusão física perderia histórico.

**Acceptance Criteria**:

1. WHEN o admin desativa um cliente THEN o sistema SHALL marcar status como inativo e persistir a alteração.
2. WHEN o admin reativa um cliente inativo THEN o sistema SHALL marcar status como ativo.
3. WHEN um cliente inativo é desativado THEN o sistema SHALL mantê-lo visível na listagem com indicador visual de inativo.

**Independent Test**: Desativar cliente → status muda na listagem. (Comportamento na entrada validado na spec da tela de entrada.)

---

### P3: Buscar cliente na listagem

**User Story**: Como administrador, quero buscar clientes por nome ou CPF na listagem para encontrar cadastros rapidamente em bases grandes.

**Why P3**: Útil com muitos clientes; não impede operação inicial com poucos cadastros.

**Acceptance Criteria**:

1. WHEN o admin digita no campo de busca THEN o sistema SHALL filtrar a listagem por correspondência parcial em nome ou CPF.
2. WHEN nenhum cliente corresponde à busca THEN o sistema SHALL exibir mensagem de nenhum resultado encontrado.

**Independent Test**: Cadastrar 5 clientes → buscar por parte do nome → apenas matches aparecem.

---

## Edge Cases

- WHEN o CPF informado é inválido (dígitos verificadores incorretos) THEN o sistema SHALL rejeitar no formulário com mensagem de validação.
- WHEN a webcam não está disponível ou permissão é negada THEN o sistema SHALL exibir instrução clara e impedir captura até permissão concedida.
- WHEN a sessão expira durante cadastro THEN o sistema SHALL redirecionar para login e descartar dados não salvos.
- WHEN o admin tenta excluir um cliente THEN o sistema SHALL **não** oferecer exclusão física na v1 (soft delete via inativação apenas).
- WHEN nome ou CPF excedem limites de campo THEN o sistema SHALL validar e rejeitar entrada.

---

## Requirement Traceability

| Requirement ID | Story | Phase | Status |
| -------------- | ----- | ----- | ------ |
| CAD-01 | P1: Login do administrador | Execute | Done |
| CAD-02 | P1: Login do administrador | Execute | Done |
| CAD-03 | P1: Login do administrador | Execute | Done |
| CAD-04 | P1: Login do administrador | Execute | Done |
| CAD-05 | P1: Cadastrar cliente | Execute | Done |
| CAD-06 | P1: Cadastrar cliente | Execute | Done |
| CAD-07 | P1: Cadastrar cliente | Execute | Done |
| CAD-08 | P1: Cadastrar cliente | Execute | Done |
| CAD-09 | P1: Cadastrar cliente | Execute | Done |
| CAD-10 | P1: Listar clientes | Execute | Done |
| CAD-11 | P1: Listar clientes | Execute | Done |
| CAD-12 | P1: Listar clientes | Execute | Done |
| CAD-13 | P2: Editar dados e fotos | Execute | Done |
| CAD-14 | P2: Editar dados e fotos | Execute | Done |
| CAD-15 | P2: Editar dados e fotos | Execute | Done |
| CAD-16 | P2: Editar dados e fotos | Execute | Done |
| CAD-17 | P2: Ativar/desativar | Execute | Done |
| CAD-18 | P2: Ativar/desativar | Execute | Done |
| CAD-19 | P2: Ativar/desativar | Execute | Done |
| CAD-20 | P3: Buscar cliente | Execute | Done |
| CAD-21 | P3: Buscar cliente | Execute | Done |

**Coverage:** 21 total, 21 mapeados para tasks, 0 unmapped ✅

---

## Success Criteria

- [x] Admin autenticado cadastra cliente com 2 fotos válidas em ≤ 3 minutos.
- [x] CPF duplicado é sempre rejeitado.
- [x] Cliente cadastrado aparece na listagem imediatamente após salvamento.
- [x] Telas de cadastro inacessíveis sem login autenticado.
