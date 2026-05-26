# Academia Face Access

Sistema de controle de acesso por reconhecimento facial.

## Desenvolvimento

### MySQL (Docker)

```bash
docker compose up -d
```

### Backend

```bash
cd backend
SPRING_PROFILES_ACTIVE=dev mvn spring-boot:run
```

### Admin inicial

Flyway `V2__SeedAdmin` cria o usuário `admin` no primeiro run.

| Variável | Default | Descrição |
| -------- | ------- | --------- |
| `ADMIN_PASSWORD` | `admin123` | Senha do admin (BCrypt na migration) |

Defina `ADMIN_PASSWORD` **antes** do primeiro `flyway migrate` se quiser outra senha.

### Frontend

```bash
cd frontend
npm install   # primeira vez
npm run dev   # http://localhost:5173 — proxy /api → :8080
```

Build de produção embarca o SPA em `backend/src/main/resources/static/` (`npm run build`).

---

## Fluxo: cadastro admin (login → cadastrar → listar)

Área **protegida** para gestão de clientes e faces.

1. Subir MySQL, backend e frontend (seções acima).
2. Acesse **`http://localhost:5173/login`**.
3. Entre com **usuário** `admin` e **senha** `admin123` (seed Flyway `V2__SeedAdmin`).
4. Após login → redirecionamento para **`/admin/clientes`** (listagem).
5. Clique em **Novo cliente** (`/admin/clientes/novo`).
6. Preencha **nome** e **CPF** válido; capture **2 fotos** via webcam (validação facial no servidor a cada captura).
7. **Salvar** → retorna à listagem com o cliente cadastrado.
8. Na listagem: busque por nome/CPF, alterne **Ativo/Inativo** ou edite em `/admin/clientes/:id/editar`.

**Rotas:** `/login`, `/admin/clientes`, `/admin/clientes/novo`, `/admin/clientes/:id/editar` (guard `ProtectedRoute` + `AdminLayout`).

---

## Fluxo: tela de entrada (`/entrada`)

Tela **pública** (sem login) para reconhecimento facial na portaria.

1. Subir MySQL, backend e frontend (seções acima).
2. **Cadastrar cliente de teste** — ver [fluxo cadastro admin](#fluxo-cadastro-admin-login--cadastrar--listar) (login → `/admin/clientes/novo` → 2 fotos via webcam).
3. Abrir **`http://localhost:5173/entrada`** (ou `/entrada` no deploy único).
4. Conceder permissão da webcam → preview fullscreen inicia captura automática (~800 ms entre frames).
5. **Resultados:**
   - Cliente **ativo** reconhecido → overlay verde, foto, nome, **"Acesso liberado"** (≥ 3 s).
   - Rosto **desconhecido** → overlay vermelho, **"Acesso negado"**, sem foto.
   - Cliente **inativo** → overlay vermelho com foto, nome e **"Acesso negado"**.
   - **Duas pessoas** na câmera → aviso amarelo; frame ignorado.
   - **Base vazia** (nenhum ativo com face) → banner de aviso; todos os acessos negados.
6. **Cooldown:** no máximo 1 evento `LIBERADO` por cliente a cada 5 minutos (`face.access.cooldown-minutes`); feedback visual continua mesmo sem novo registro.

**UAT manual:** checklist completo em [`.specs/features/tela-entrada/UAT.md`](.specs/features/tela-entrada/UAT.md).

**API:** `POST /api/access/recognize`, `GET /api/access/status` (endpoints públicos).
