# Academia Face Access

**Repositório:** [github.com/pedrobelmino/spring-react-reconhecimento-facial](https://github.com/pedrobelmino/spring-react-reconhecimento-facial)

**Visão:** Sistema de controle de acesso por reconhecimento facial via webcam, comparando rostos capturados em tempo real com imagens cadastradas no banco de dados.

**Para:** Academias de ginástica e seus clientes cadastrados.

**Resolve:** Automatizar a liberação de entrada na academia sem cartão, tag ou check-in manual — identificando o cliente pelo rosto.

## Objetivos

- Permitir cadastro de faces de clientes via interface web, com armazenamento seguro das imagens e dos descritores faciais no MySQL.
- Reconhecer clientes em tempo real na tela de entrada (webcam), com feedback visual claro de identificação e liberação/negação de acesso.
- Atingir taxa de reconhecimento ≥ 95% em condições normais de iluminação e posicionamento frontal da câmera.
- Processar cada tentativa de reconhecimento em ≤ 2 segundos (captura → match → resposta na UI).

## Tech Stack

**Core:**

- Linguagem: Java 21
- Framework: Spring Boot 3.x
- Banco de dados: MySQL 8.x
- Hospedagem: Google Cloud Platform (GCP)

**Dependências-chave:**

- Spring Web (API REST + servir frontend)
- Spring Data JPA (persistência)
- Spring Security (autenticação básica para telas administrativas)
- Biblioteca de reconhecimento facial: DJL + ONNX (server-side)
- Frontend: **React 18 + TypeScript + Vite + React Router + Tailwind CSS**

## Escopo

**v1 inclui:**

- Cadastro de clientes com captura de foto via webcam ou upload de imagem.
- Extração e armazenamento de descritores faciais vinculados ao cliente.
- Tela de entrada em tela cheia: captura contínua da webcam, reconhecimento e exibição do nome do cliente + status de acesso.
- Registro de eventos de acesso (cliente identificado, horário, resultado).
- Operação single-tenant (uma única academia por instância).

**Explicitamente fora do escopo (MVP):**

- Multi-empresa / multi-tenant (várias academias na mesma instância).
- App mobile nativo.
- Integração com catraca física ou torniquete (apenas feedback visual na v1).
- Planos, mensalidades ou cobrança.
- Relatórios analíticos avançados.
- Reconhecimento com máscara ou múltiplas pessoas simultâneas na câmera.

## Restrições

- Timeline: sem prazo fixo definido.
- Técnicas: Java 21, Spring, MySQL e deploy em GCP são requisitos fixos.
- Recursos: sem restrições críticas de equipe ou orçamento informadas.
