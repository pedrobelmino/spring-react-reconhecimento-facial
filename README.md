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

Ver `frontend/README.md` (após scaffold).
