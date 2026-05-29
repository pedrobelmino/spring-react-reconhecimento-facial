# Academia Face Access

Sistema de controle de acesso por reconhecimento facial para academias — **Spring Boot + React + Tailwind**, com inferência facial server-side via **DJL + ONNX**.

**Repositório:** [github.com/pedrobelmino/spring-react-reconhecimento-facial](https://github.com/pedrobelmino/spring-react-reconhecimento-facial)

## Funcionalidades

- **Cadastro admin** — login, CRUD de clientes, captura de 2 fotos via webcam com validação facial no servidor
- **Tela de entrada** — reconhecimento contínuo em fullscreen, feedback visual (liberado/negado), cooldown de 5 min
- **Reconhecimento facial** — detecção Ultra-Light + embeddings ArcFace (ONNX) no backend Java
- **Deploy único** — SPA React embarcado no JAR Spring Boot (Cloud Run ready)

## Stack

| Camada | Tecnologia |
| ------ | ---------- |
| Backend | Java 21, Spring Boot 3.3, Spring Security, JPA, Flyway |
| ML | DJL 0.27 + ONNX Runtime |
| Frontend | React 18, TypeScript, Vite, React Router, Tailwind CSS |
| Banco | MySQL 8 |
| Deploy | Docker multi-stage → GCP Cloud Run |

## Pré-requisitos

- Java 21, Maven 3.9+
- Node.js 20+, npm
- Docker (MySQL local)
- Modelos ONNX (script abaixo)

## Início rápido

### 1. Clonar e modelos ML

```bash
git clone https://github.com/pedrobelmino/spring-react-reconhecimento-facial.git
cd spring-react-reconhecimento-facial

./scripts/download-face-models.sh
```

### 2. MySQL

```bash
docker compose up -d
```

Credenciais padrão: banco `faceaccess`, usuário/senha `faceaccess`.

### 3. Backend

```bash
cd backend
SPRING_PROFILES_ACTIVE=dev mvn spring-boot:run
```

API em `http://localhost:8080`.

### 4. Frontend (dev)

```bash
cd frontend
npm install   # primeira vez
npm run dev   # http://localhost:5173 — proxy /api → :8080
```

### Admin inicial

Flyway `V2__SeedAdmin` cria o usuário `admin` no primeiro run.

| Variável | Default | Descrição |
| -------- | ------- | --------- |
| `ADMIN_PASSWORD` | `admin123` | Senha do admin (BCrypt na migration) |

Defina `ADMIN_PASSWORD` **antes** do primeiro `flyway migrate` se quiser outra senha.

---

## Fluxos

### Cadastro admin (`/login` → `/admin/clientes`)

Área **protegida** para gestão de clientes e faces.

1. Subir MySQL, backend e frontend.
2. Acesse `http://localhost:5173/login`.
3. Entre com **admin** / **admin123**.
4. **Novo cliente** → nome + CPF + 2 fotos via webcam.
5. Listagem: busca, ativar/inativar, editar.

**Rotas:** `/login`, `/admin/clientes`, `/admin/clientes/novo`, `/admin/clientes/:id/editar`

### Tela de entrada (`/entrada`)

Tela **pública** (sem login) para reconhecimento na portaria.

1. Cadastre um cliente de teste (fluxo admin acima).
2. Abra `http://localhost:5173/entrada`.
3. Conceda permissão da webcam → captura automática (~800 ms entre frames).
4. **Resultados:** overlay verde (liberado), vermelho (negado/inativo), amarelo (múltiplas faces).
5. **Cooldown:** 1 evento `LIBERADO` por cliente a cada 5 min.

**API pública:** `POST /api/access/recognize`, `GET /api/access/status`

Checklist UAT: [`.specs/features/tela-entrada/UAT.md`](.specs/features/tela-entrada/UAT.md)

---

## Build e Docker

```bash
# Build completo (frontend → static + JAR)
./scripts/build.sh

# Imagem Docker (multi-stage)
docker build -t faceaccess .
docker run -p 8080:8080 faceaccess
```

---

## Testes

```bash
# Frontend
cd frontend && npm test

# Backend
cd backend && mvn test
```

---

## Estrutura do projeto

```
├── backend/          # Spring Boot API + DJL/ONNX
├── frontend/         # React SPA (Vite)
├── scripts/          # build, modelos ONNX, sync Linear
├── docker-compose.yml
├── Dockerfile
└── .specs/           # Specs, design, roadmap, tasks
```

---

## Documentação

| Documento | Conteúdo |
| --------- | -------- |
| [`.specs/project/PROJECT.md`](.specs/project/PROJECT.md) | Visão, objetivos, escopo |
| [`.specs/project/ROADMAP.md`](.specs/project/ROADMAP.md) | Milestones e status |
| [`.specs/project/SYSTEM-DESIGN.md`](.specs/project/SYSTEM-DESIGN.md) | Arquitetura e decisões |
| [`.specs/project/STATE.md`](.specs/project/STATE.md) | Estado atual do projeto |
| [`.specs/linear/`](.specs/linear/) | Tasks sincronizadas com Linear (FAC-*) |

---

## Linear

Issues do MVP no time **Face Access (FAC)** — projeto [Academia Face Access](https://linear.app/peraai/project/academia-face-access-acf62f8ac2dc).

```bash
# Sync tasks → Linear (requer .env com LINEAR_API_KEY)
node scripts/sync-linear-tasks.mjs
```

---

## Licença

Projeto privado — uso conforme acordado com o mantenedor.
