# Echo Grove backend

Spring Boot 3.4 API (Java 17) on PostgreSQL. The music is generated in the browser; this service handles accounts, saved gardens, the gallery and moderation.

## Run (PostgreSQL in Docker)

Needs Docker Desktop running.

```bash
cd backend
cp .env.example .env        # then edit: admin email/password, JWT secret, DB password
mvn spring-boot:run         # starts Postgres from compose.yaml, then the API on http://localhost:8085
mvn test                    # tests use an in-memory H2 database, no Docker needed
```

The first start creates the tables and the admin account from `.env`. Postgres keeps its data in the Docker volume `pgdata`
(`docker compose down -v` in this folder wipes it). The old `backend/data/` H2 folder is no longer used and can be deleted.

## Endpoints

| Method | Path | Purpose |
| --- | --- | --- |
| GET | `/api/health` | Wake-up check |
| GET | `/api/presets` | The four built-in presets |
| POST | `/api/gardens` | Save a garden, returns its 8-character share code |
| GET | `/api/gardens/{code}` | Load a shared garden (anyone) |
| GET | `/api/gardens?limit=12` | Public gallery: published, not hidden (anyone) |
| GET | `/api/me`, `/api/me/gardens` | Signed-in user and their gardens (USER) |
| DELETE | `/api/gardens/{code}` | Delete a garden (owner or ADMIN) |
| POST | `/api/auth/register`, `/login`, `/verify-email`, `/resend-verification` | Accounts (anyone, rate-limited) |
| GET, PATCH | `/api/admin/stats`, `/gardens`, `/users` | Moderation (ADMIN) |

Saving a garden (`POST /api/gardens`) needs a signed-in user with a verified email.

## Environment variables

| Variable | Default | Purpose |
| --- | --- | --- |
| `PORT` | 8085 | Port to listen on (set by most hosts) |
| `ALLOWED_ORIGINS` | `http://localhost:5173,http://127.0.0.1:5173` | Frontend origins allowed by CORS |
| `FRONTEND_URL` | `http://localhost:5173` | Used to build email verification links |
| `JWT_SECRET` | random per start | 32+ characters; set it in production |
| `ADMIN_EMAIL`, `ADMIN_PASSWORD` | none | Creates the admin account at startup (password 12+ characters) |
| `SPRING_MAIL_HOST`, `_PORT`, `_USERNAME`, `_PASSWORD` | none | SMTP for verification emails; without it the link is printed in the log |
| `POSTGRES_PASSWORD` | `local-dev-only` | Password of the local Docker Postgres (set it in `.env`) |
| `SPRING_DATASOURCE_URL`, `_USERNAME`, `_PASSWORD` | Docker Postgres | Hosted PostgreSQL for the live server |

## Security basics

- Passwords: BCrypt hashes only. Login tokens: JWT (HS256), 1 hour.
- Roles: USER (default) and ADMIN (seeded from env). Guests can use every read endpoint.
- Email verification: one-time token, only its SHA-256 hash is stored, expires in 24 hours.
- Brute force: 5 wrong passwords lock the account for 15 minutes; 10 login attempts per minute per IP.
- Floods: 120 API requests per minute per IP, 3 registrations and 3 resends per hour per IP, 16 KB body limit.
- SQL injection: only Spring Data repositories with bound parameters; every input is validated.
- Messages never reveal whether an email is registered.
